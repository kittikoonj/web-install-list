import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Issue } from '../entities/issue.entity';
import { IssueAttachment } from '../entities/issue-attachment.entity';
import { IssueComment } from '../entities/issue-comment.entity';
import { InstallList } from '../entities/install-list.entity';
import { CreateIssueDto, UpdateIssueDto } from './dto/issue.dto';
import { CreateIssueCommentDto } from './dto/issue-comment.dto';
import { AuditService } from '../common/audit.service';
import {
  auditChanges,
  auditCreatedSummary,
  auditDeletedSummary,
} from '../common/audit.util';
import {
  removeStoredFile,
  storeIssueAttachment,
  withAttachmentUrls,
} from './issue-upload.util';

const ISSUE_STATUS_LABELS: Record<string, string> = {
  open: 'เปิด',
  in_progress: 'กำลังดำเนินการ',
  resolved: 'แก้ไขแล้ว',
  closed: 'ปิด',
};

const ISSUE_LABELS: Record<string, string> = {
  title: 'หัวข้อ',
  description: 'รายละเอียด',
  status: 'สถานะ',
  customerName: 'ลูกค้า',
  installListId: 'Install List',
};

function formatIssueStatus(status: unknown): unknown {
  if (typeof status === 'string') {
    return ISSUE_STATUS_LABELS[status] ?? status;
  }
  return status;
}

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    @InjectRepository(IssueAttachment)
    private readonly attachmentRepo: Repository<IssueAttachment>,
    @InjectRepository(IssueComment)
    private readonly commentRepo: Repository<IssueComment>,
    @InjectRepository(InstallList)
    private readonly listRepo: Repository<InstallList>,
    private readonly auditService: AuditService,
  ) {}

  private mapIssue(issue: Issue) {
    return withAttachmentUrls(issue);
  }

  private async ensureInstallList(installListId: number) {
    const list = await this.listRepo.findOne({
      where: { id: installListId, isDelete: 0 },
    });
    if (!list) throw new NotFoundException('ไม่พบ install list');
    return list;
  }

  async findAll(
    search?: string,
    installListId?: number,
    includeDeleted = false,
    status?: string,
  ) {
    const where: Record<string, unknown> = {};
    if (!includeDeleted) where.isDelete = 0;
    if (installListId) where.installListId = installListId;
    if (status) where.status = status;

    let issues: Issue[];

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      issues = await this.issueRepo.find({
        where: [
          { ...where, title: Like(term) },
          { ...where, description: Like(term) },
          { ...where, customerName: Like(term) },
        ],
        relations: { installList: true, attachments: true, comments: true },
        order: { updatedAt: 'DESC' },
      });
    } else {
      issues = await this.issueRepo.find({
        where,
        relations: { installList: true, attachments: true, comments: true },
        order: { updatedAt: 'DESC' },
      });
    }

    return issues.map((issue) => this.mapIssue(issue));
  }

  async findByInstallList(installListId: number) {
    const issues = await this.issueRepo.find({
      where: { installListId, isDelete: 0 },
      relations: { attachments: true },
      order: { updatedAt: 'DESC' },
    });
    return issues.map((issue) => this.mapIssue(issue));
  }

  async findOne(id: number) {
    const issue = await this.issueRepo.findOne({
      where: { id },
      relations: { installList: true, attachments: true, comments: true },
    });
    if (!issue) throw new NotFoundException('ไม่พบ issue');
    return this.mapIssue(issue);
  }

  async create(dto: CreateIssueDto, performedBy: string) {
    await this.ensureInstallList(dto.installListId);

    const issue = this.issueRepo.create({
      ...dto,
      createdBy: performedBy,
    });
    const saved = await this.issueRepo.save(issue);

    await this.auditService.log({
      action: 'create',
      objectType: 'issue',
      objectId: saved.id,
      objectName: saved.title,
      performedBy,
      details: auditCreatedSummary(
        {
          title: saved.title,
          status: formatIssueStatus(saved.status),
          customerName: saved.customerName,
          description: saved.description,
        },
        ISSUE_LABELS,
      ),
    });

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateIssueDto, performedBy: string) {
    const issue = await this.issueRepo.findOne({ where: { id } });
    if (!issue) throw new NotFoundException('ไม่พบ issue');
    if (dto.installListId) await this.ensureInstallList(dto.installListId);

    const before = {
      title: issue.title,
      description: issue.description,
      status: formatIssueStatus(issue.status),
      customerName: issue.customerName,
      installListId: issue.installListId,
    };

    Object.assign(issue, dto);
    const saved = await this.issueRepo.save(issue);

    const after = {
      title: saved.title,
      description: saved.description,
      status: formatIssueStatus(saved.status),
      customerName: saved.customerName,
      installListId: saved.installListId,
    };

    await this.auditService.log({
      action: 'update',
      objectType: 'issue',
      objectId: saved.id,
      objectName: saved.title,
      performedBy,
      details: auditChanges(before, after, ISSUE_LABELS),
    });

    return this.findOne(saved.id);
  }

  async uploadAttachments(
    id: number,
    files: Express.Multer.File[],
    performedBy: string,
  ) {
    if (!files?.length) {
      throw new BadRequestException('ไม่พบไฟล์ที่อัปโหลด');
    }

    const issue = await this.findOne(id);
    const saved: IssueAttachment[] = [];

    for (const file of files) {
      const stored = await storeIssueAttachment(id, file);
      const attachment = await this.attachmentRepo.save(
        this.attachmentRepo.create({
          issueId: id,
          ...stored,
        }),
      );
      saved.push(attachment);
    }

    await this.auditService.log({
      action: 'update',
      objectType: 'issue_attachment',
      objectId: id,
      objectName: issue.title,
      performedBy,
      details: `อัปโหลด ${files.length} ไฟล์: ${files.map((f) => f.originalname).join(', ')}`,
    });

    return this.findOne(id);
  }

  async deleteAttachment(
    issueId: number,
    attachmentId: number,
    performedBy: string,
  ) {
    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId, issueId },
    });
    if (!attachment) throw new NotFoundException('ไม่พบไฟล์แนบ');

    const issue = await this.findOne(issueId);
    await removeStoredFile(issueId, attachment.storedName);
    await this.attachmentRepo.delete(attachmentId);

    await this.auditService.log({
      action: 'delete',
      objectType: 'issue_attachment',
      objectId: attachmentId,
      objectName: issue.title,
      performedBy,
      details: auditDeletedSummary('ไฟล์แนบ', attachment.originalName),
    });

    return this.findOne(issueId);
  }

  async addComment(issueId: number, dto: CreateIssueCommentDto, performedBy: string) {
    const issue = await this.findOne(issueId);
    const body = dto.body.trim();
    await this.commentRepo.save(
      this.commentRepo.create({
        issueId,
        body,
        createdBy: performedBy,
      }),
    );

    const excerpt = body.length > 120 ? `${body.slice(0, 120)}…` : body;
    await this.auditService.log({
      action: 'create',
      objectType: 'issue_comment',
      objectId: issueId,
      objectName: issue.title,
      performedBy,
      details: `เพิ่มความคิดเห็น: ${excerpt}`,
    });

    return this.findOne(issueId);
  }

  async softDelete(id: number, performedBy: string) {
    const issue = await this.issueRepo.findOne({ where: { id } });
    if (!issue) throw new NotFoundException('ไม่พบ issue');
    issue.isDelete = 1;
    issue.deletedBy = performedBy;
    issue.deletedAt = new Date();
    await this.issueRepo.save(issue);

    await this.auditService.log({
      action: 'delete',
      objectType: 'issue',
      objectId: issue.id,
      objectName: issue.title,
      performedBy,
      details: auditDeletedSummary('issue', issue.title),
    });

    return { ok: true };
  }
}
