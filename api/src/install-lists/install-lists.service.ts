import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import type { Response } from 'express';
import { InstallList } from '../entities/install-list.entity';
import { InstallListItem } from '../entities/install-list-item.entity';
import { InstallListCustomer } from '../entities/install-list-customer.entity';
import { InstallListCustomerItem } from '../entities/install-list-customer-item.entity';
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
    @InjectRepository(InstallListCustomerItem)
    private readonly customerItemRepo: Repository<InstallListCustomerItem>,
    private readonly auditService: AuditService,
  ) {}

  private installKey(customerName: string, programId: number, method: string) {
    return `${customerName}:${programId}:${method}`;
  }

  private async loadCustomerInstalls(listId: number) {
    const customers = await this.customerRepo.find({ where: { listId } });
    if (!customers.length) return [];

    return this.customerItemRepo.find({
      where: { customerId: In(customers.map((c) => c.id)) },
    });
  }

  private attachCustomerInstalls(
    list: InstallList,
    customerItems: InstallListCustomerItem[],
  ) {
    return {
      ...list,
      customerInstalls: customerItems.map((ci) => ({
        customerId: ci.customerId,
        itemId: ci.itemId,
        isInstalled: !!ci.isInstalled,
      })),
    };
  }

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

    const customerItems = await this.loadCustomerInstalls(id);
    return this.attachCustomerInstalls(list, customerItems);
  }

  private async snapshotInstallMap(listId: number) {
    const customers = await this.customerRepo.find({ where: { listId } });
    if (!customers.length) return new Map<string, number>();

    const customerItems = await this.customerItemRepo.find({
      where: { customerId: In(customers.map((c) => c.id)) },
      relations: { item: true, customer: true },
    });

    const map = new Map<string, number>();
    for (const ci of customerItems) {
      if (!ci.isInstalled || !ci.item || !ci.customer) continue;
      map.set(
        this.installKey(ci.customer.customerName, ci.item.programId, ci.item.method),
        1,
      );
    }
    return map;
  }

  private async restoreInstallMap(
    listId: number,
    installMap: Map<string, number>,
  ) {
    if (!installMap.size) return;

    const customers = await this.customerRepo.find({ where: { listId } });
    const items = await this.itemRepo.find({ where: { listId } });
    const records: InstallListCustomerItem[] = [];

    for (const customer of customers) {
      for (const item of items) {
        const key = this.installKey(customer.customerName, item.programId, item.method);
        if (installMap.get(key)) {
          records.push(
            this.customerItemRepo.create({
              customerId: customer.id,
              itemId: item.id,
              isInstalled: 1,
            }),
          );
        }
      }
    }

    if (records.length) {
      await this.customerItemRepo.save(records);
    }
  }

  private async saveItems(listId: number, items: CreateInstallListDto['items']) {
    const installMap = await this.snapshotInstallMap(listId);

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

    await this.restoreInstallMap(listId, installMap);
  }

  private async saveCustomers(
    listId: number,
    customers: CreateInstallListDto['customers'],
  ) {
    const installMap = await this.snapshotInstallMap(listId);

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

    await this.restoreInstallMap(listId, installMap);
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
    await this.listRepo.update(id, { name: dto.name });

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

  async toggleCustomerItemInstalled(
    listId: number,
    customerId: number,
    itemId: number,
    isInstalled: boolean,
    performedBy: string,
  ) {
    const customer = await this.customerRepo.findOne({ where: { id: customerId, listId } });
    const item = await this.itemRepo.findOne({ where: { id: itemId, listId } });
    if (!customer || !item) {
      throw new NotFoundException('ไม่พบลูกค้าหรือ program ใน list นี้');
    }

    let record = await this.customerItemRepo.findOne({ where: { customerId, itemId } });
    if (!record) {
      record = this.customerItemRepo.create({
        customerId,
        itemId,
        isInstalled: isInstalled ? 1 : 0,
      });
    } else {
      record.isInstalled = isInstalled ? 1 : 0;
    }
    await this.customerItemRepo.save(record);

    const list = await this.listRepo.findOne({ where: { id: listId } });
    await this.auditService.log({
      action: 'update',
      objectType: 'install_list_customer_item',
      objectId: record.id,
      objectName: `${list?.name ?? listId} / ${customer.customerName}`,
      performedBy,
    });

    return {
      customerId,
      itemId,
      isInstalled: !!record.isInstalled,
    };
  }

  async clone(id: number, dto: CloneInstallListDto, performedBy: string) {
    const source = await this.findOne(id);
    const installMap = await this.snapshotInstallMap(id);
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
    const created = await this.create(payload, performedBy);
    await this.restoreInstallMap(created.id, installMap);
    return this.findOne(created.id);
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

    const installLookup = new Map<string, boolean>();
    for (const ci of list.customerInstalls ?? []) {
      installLookup.set(`${ci.customerId}:${ci.itemId}`, ci.isInstalled);
    }

    const lines = [
      `# Install List: ${list.name}`,
      `# Exported: ${new Date().toISOString()}`,
      '',
      '## Programs',
      'Program,Version,Method',
      ...(list.items ?? []).map(
        (item) =>
          `"${item.program?.name ?? item.programId}","${item.program?.version ?? ''}","${item.method}"`,
      ),
      '',
      '## Customers',
      'Customer,Installer,Installed At,Test Case URL',
      ...(list.customers ?? []).map(
        (c) =>
          `"${c.customerName}","${c.installerName ?? ''}","${c.installedAt}","${c.testCaseUrl ?? ''}"`,
      ),
      '',
      '## Install Progress by Site',
      'Customer,Program,Version,Method,Installed',
      ...(list.customers ?? []).flatMap((customer) =>
        (list.items ?? []).map((item) => {
          const installed = installLookup.get(`${customer.id}:${item.id}`) ? 'yes' : 'no';
          return `"${customer.customerName}","${item.program?.name ?? item.programId}","${item.program?.version ?? ''}","${item.method}","${installed}"`;
        }),
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
    await this.listRepo.update(id, {
      isDelete: 1,
      deletedBy: performedBy,
      deletedAt: new Date(),
    });

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
