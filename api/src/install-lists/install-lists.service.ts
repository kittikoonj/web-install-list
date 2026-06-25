import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import type { Response } from 'express';
import { InstallList } from '../entities/install-list.entity';
import { InstallListItem } from '../entities/install-list-item.entity';
import { InstallListCustomer } from '../entities/install-list-customer.entity';
import { CreateInstallListDto, UpdateInstallListDto, CloneInstallListDto } from './dto/install-list.dto';
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
    const existing = await this.itemRepo.find({ where: { listId } });
    const installedMap = new Map(
      existing.map((item) => [`${item.programId}:${item.method}`, item.isInstalled]),
    );

    await this.itemRepo.delete({ listId });
    if (items?.length) {
      const entities = items.map((item) =>
        this.itemRepo.create({
          listId,
          programId: item.programId,
          method: item.method,
          isInstalled: installedMap.get(`${item.programId}:${item.method}`) ?? 0,
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

  async toggleItemInstalled(
    listId: number,
    itemId: number,
    isInstalled: boolean,
    performedBy: string,
  ) {
    const item = await this.itemRepo.findOne({ where: { id: itemId, listId } });
    if (!item) throw new NotFoundException('ไม่พบรายการ program');

    item.isInstalled = isInstalled ? 1 : 0;
    await this.itemRepo.save(item);

    const list = await this.listRepo.findOne({ where: { id: listId } });
    await this.auditService.log({
      action: 'update',
      objectType: 'install_list_item',
      objectId: item.id,
      objectName: list?.name ?? `#${listId}`,
      performedBy,
      detail: isInstalled ? 'marked installed' : 'marked not installed',
    });

    return item;
  }

  async clone(id: number, dto: CloneInstallListDto, performedBy: string) {
    const source = await this.findOne(id);
    const payload: CreateInstallListDto = {
      name: dto.name?.trim() || `${source.name} (Copy)`,
      items: (source.items ?? []).map((item) => ({
        programId: item.programId,
        method: item.method,
      })),
      customers: (source.customers ?? []).map((c) => ({
        customerName: c.customerName,
        installerName: c.installerName ?? '',
        installedAt: c.installedAt,
        testCaseUrl: c.testCaseUrl ?? undefined,
      })),
    };
    return this.create(payload, performedBy);
  }

  async exportList(id: number, format: 'csv' | 'json', res: Response) {
    const list = await this.findOne(id);
    const safeName = list.name.replace(/[^\w.-]+/g, '_');

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.json"`);
      res.send(JSON.stringify(list, null, 2));
      return;
    }

    const lines = [
      `# Install List: ${list.name}`,
      `# Exported: ${new Date().toISOString()}`,
      '',
      '## Programs',
      'Program,Version,Method,Installed',
      ...(list.items ?? []).map(
        (item) =>
          `"${item.program?.name ?? item.programId}","${item.program?.version ?? ''}","${item.method}","${item.isInstalled ? 'yes' : 'no'}"`,
      ),
      '',
      '## Customers',
      'Customer,Installer,Installed At,Test Case URL',
      ...(list.customers ?? []).map(
        (c) =>
          `"${c.customerName}","${c.installerName ?? ''}","${c.installedAt}","${c.testCaseUrl ?? ''}"`,
      ),
      '',
      '## Issues',
      'Title,Status,Description',
      ...(list.issues ?? []).map(
        (i) => `"${i.title}","${i.status}","${(i.description ?? '').replace(/"/g, '""')}"`,
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.csv"`);
    res.send('\uFEFF' + lines.join('\n'));
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
