import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Issue } from '../entities/issue.entity';
import { IssueAttachment } from '../entities/issue-attachment.entity';
import { InstallList } from '../entities/install-list.entity';
import { CreateIssueDto, UpdateIssueDto } from './dto/issue.dto';
import { AuditService } from '../common/audit.service';
import {
  removeStoredFile,
  storeIssueAttachment,
  withAttachmentUrls,
} from './issue-upload.util';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    @InjectRepository(IssueAttachment)
    private readonly attachmentRepo: Repository<IssueAttachment>,
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

  async findAll(search?: string, installListId?: number, includeDeleted = false) {
    const where: Record<string, unknown> = {};
    if (!includeDeleted) where.isDelete = 0;
    if (installListId) where.installListId = installListId;

    let issues: Issue[];

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      issues = await this.issueRepo.find({
        where: [
          { ...where, title: Like(term) },
          { ...where, description: Like(term) },
        ],
        relations: { installList: true, attachments: true },
        order: { updatedAt: 'DESC' },
      });
    } else {
      issues = await this.issueRepo.find({
        where,
        relations: { installList: true, attachments: true },
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
      relations: { installList: true, attachments: true },
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
    });

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateIssueDto, performedBy: string) {
    const issue = await this.issueRepo.findOne({ where: { id } });
    if (!issue) throw new NotFoundException('ไม่พบ issue');
    if (dto.installListId) await this.ensureInstallList(dto.installListId);
    Object.assign(issue, dto);
    const saved = await this.issueRepo.save(issue);

    await this.auditService.log({
      action: 'update',
      objectType: 'issue',
      objectId: saved.id,
      objectName: saved.title,
      performedBy,
    });

    return this.findOne(saved.id);
  }

  async uploadAttachments(id: number, files: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('ไม่พบไฟล์ที่อัปโหลด');
    }

    await this.findOne(id);
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

    return this.findOne(id);
  }

  async deleteAttachment(issueId: number, attachmentId: number) {
    const attachment = await this.attachmentRepo.findOne({
      where: { id: attachmentId, issueId },
    });
    if (!attachment) throw new NotFoundException('ไม่พบไฟล์แนบ');

    await removeStoredFile(issueId, attachment.storedName);
    await this.attachmentRepo.delete(attachmentId);
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
    });

    return { ok: true };
  }
}
