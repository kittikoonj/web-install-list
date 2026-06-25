import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { InstallList } from '../entities/install-list.entity';
import { InstallListItem } from '../entities/install-list-item.entity';
import { InstallListCustomer } from '../entities/install-list-customer.entity';
import { CreateInstallListDto, UpdateInstallListDto } from './dto/install-list.dto';
import { AuditService } from '../common/audit.service';
import { attachmentPublicPath } from '../issues/issue-upload.util';

@Injectable()
export class InstallListsService {
  constructor(
    @InjectRepository(InstallList)
    private readonly listRepo: Repository<InstallList>,
    @InjectRepository(InstallListItem)
    private readonly itemRepo: Repository<InstallListItem>,
    @InjectRepository(InstallListCustomer)
    private readonly customerRepo: Repository<InstallListCustomer>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(activeOnly = true, search?: string) {
    const qb = this.listRepo
      .createQueryBuilder('list')
      .leftJoinAndSelect('list.items', 'items')
      .leftJoinAndSelect('items.program', 'program')
      .leftJoinAndSelect('list.customers', 'customers')
      .leftJoinAndSelect('list.issues', 'issues', 'issues.isDelete = :issueNotDeleted', {
        issueNotDeleted: 0,
      })
      .orderBy('list.updatedAt', 'DESC');

    if (activeOnly) {
      qb.andWhere('list.isDelete = :isDelete', { isDelete: 0 });
    }

    const q = search?.trim();
    if (q) {
      const term = `%${q}%`;
      qb.distinct(true);
      qb.andWhere(
        new Brackets((w) => {
          w.where('list.name LIKE :term', { term })
            .orWhere('list.createdBy LIKE :term', { term })
            .orWhere('customers.customerName LIKE :term', { term })
            .orWhere('customers.installerName LIKE :term', { term })
            .orWhere('customers.testCaseUrl LIKE :term', { term })
            .orWhere('program.name LIKE :term', { term })
            .orWhere('program.version LIKE :term', { term })
            .orWhere('issues.title LIKE :term', { term })
            .orWhere('issues.description LIKE :term', { term });
        }),
      );
    }

    const lists = await qb.getMany();

    return lists.map((list) => ({
      ...list,
      programCount: list.items?.length ?? 0,
      customerCount: list.customers?.length ?? 0,
      issueCount: list.issues?.length ?? 0,
      issues: undefined,
    }));
  }

  async findOne(id: number) {
    const list = await this.listRepo.findOne({
      where: { id },
      relations: { items: { program: true }, customers: true, issues: { attachments: true } },
    });
    if (!list) throw new NotFoundException('ไม่พบ install list');
    list.issues = (list.issues ?? [])
      .filter((issue) => !issue.isDelete)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((issue) => ({
        ...issue,
        attachments: (issue.attachments ?? []).map((att) => ({
          ...att,
          url: attachmentPublicPath(att.issueId, att.storedName),
        })),
      }));
    return list;
  }

  private async saveItems(listId: number, items: CreateInstallListDto['items']) {
    await this.itemRepo.delete({ listId });
    if (items?.length) {
      const entities = items.map((item) =>
        this.itemRepo.create({
          listId,
          programId: item.programId,
          method: item.method,
        }),
      );
      await this.itemRepo.save(entities);
    }
  }

  private async saveCustomers(
    listId: number,
    customers: CreateInstallListDto['customers'],
  ) {
    await this.customerRepo.delete({ listId });
    if (customers?.length) {
      const entities = customers.map((c) =>
        this.customerRepo.create({
          listId,
          customerName: c.customerName,
          installerName: c.installerName,
          installedAt: c.installedAt,
          testCaseUrl: c.testCaseUrl ?? null,
        }),
      );
      await this.customerRepo.save(entities);
    }
  }

  async create(dto: CreateInstallListDto, performedBy: string) {
    const list = this.listRepo.create({
      name: dto.name,
      createdBy: performedBy,
    });
    const saved = await this.listRepo.save(list);

    await this.saveItems(saved.id, dto.items);
    await this.saveCustomers(saved.id, dto.customers);

    await this.auditService.log({
      action: 'create',
      objectType: 'install_list',
      objectId: saved.id,
      objectName: saved.name,
      performedBy,
    });

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateInstallListDto, performedBy: string) {
    const list = await this.findOne(id);
    list.name = dto.name;
    await this.listRepo.save(list);

    await this.saveItems(id, dto.items);
    await this.saveCustomers(id, dto.customers);

    await this.auditService.log({
      action: 'update',
      objectType: 'install_list',
      objectId: list.id,
      objectName: list.name,
      performedBy,
    });

    return this.findOne(id);
  }

  async softDelete(id: number, performedBy: string) {
    const list = await this.findOne(id);
    list.isDelete = 1;
    list.deletedBy = performedBy;
    list.deletedAt = new Date();
    await this.listRepo.save(list);

    await this.auditService.log({
      action: 'delete',
      objectType: 'install_list',
      objectId: list.id,
      objectName: list.name,
      performedBy,
    });

    return { ok: true };
  }
}
