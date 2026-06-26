import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import type { Response } from 'express';
import { InstallList } from '../entities/install-list.entity';
import { InstallListItem } from '../entities/install-list-item.entity';
import { InstallListCustomer } from '../entities/install-list-customer.entity';
import { InstallListCustomerItem } from '../entities/install-list-customer-item.entity';
import { InstallListDocument } from '../entities/install-list-document.entity';
import { Program } from '../entities/program.entity';
import { CreateInstallListDto, UpdateInstallListDto, CloneInstallListDto } from './dto/install-list.dto';
import { AuditService } from '../common/audit.service';
import { auditDeletedSummary } from '../common/audit.util';
import { attachmentPublicPath } from '../issues/issue-upload.util';
import {
  documentPublicPath,
  removeListDocumentFile,
  storeListDocument,
} from './install-list-upload.util';

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
    @InjectRepository(InstallListDocument)
    private readonly documentRepo: Repository<InstallListDocument>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    private readonly auditService: AuditService,
  ) {}

  private installListPayloadSummary(dto: CreateInstallListDto): string {
    const itemCount = dto.items?.length ?? 0;
    const customerCount = dto.customers?.length ?? 0;
    const customerNames =
      dto.customers?.map((c) => c.customerName).join(', ') || '—';
    const methods = dto.items?.map((i) => i.method).join(', ') || '—';
    return `ชื่อ: ${dto.name}; programs ${itemCount} รายการ (วิธี: ${methods}); ลูกค้า ${customerCount} ราย (${customerNames})`;
  }

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

  private async countIncompleteCustomersByList(lists: InstallList[]) {
    const counts = new Map<number, number>();
    if (!lists.length) return counts;

    const customerIds = lists.flatMap((list) =>
      (list.customers ?? []).map((c) => c.id).filter((id): id is number => id != null),
    );

    const installedByCustomer = new Map<number, number>();
    if (customerIds.length) {
      const customerItems = await this.customerItemRepo.find({
        where: { customerId: In(customerIds), isInstalled: 1 },
      });
      for (const ci of customerItems) {
        installedByCustomer.set(
          ci.customerId,
          (installedByCustomer.get(ci.customerId) ?? 0) + 1,
        );
      }
    }

    for (const list of lists) {
      const itemCount = list.items?.length ?? 0;
      const customers = list.customers ?? [];
      if (!itemCount || !customers.length) {
        counts.set(list.id, 0);
        continue;
      }

      let incomplete = 0;
      for (const customer of customers) {
        const done = installedByCustomer.get(customer.id!) ?? 0;
        if (done < itemCount) incomplete++;
      }
      counts.set(list.id, incomplete);
    }

    return counts;
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
    const incompleteCounts = await this.countIncompleteCustomersByList(lists);

    return lists.map((list) => ({
      ...list,
      programCount: list.items?.length ?? 0,
      customerCount: list.customers?.length ?? 0,
      incompleteCustomerCount: incompleteCounts.get(list.id) ?? 0,
      issueCount: list.issues?.length ?? 0,
      issues: undefined,
    }));
  }

  async findOne(id: number) {
    const list = await this.listRepo.findOne({
      where: { id },
      relations: {
        items: { program: true },
        customers: true,
        documents: true,
        issues: { attachments: true },
      },
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
    const enriched = this.attachCustomerInstalls(list, customerItems);
    const documents = [...(list.documents ?? [])]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((doc) => ({
        ...doc,
        url: documentPublicPath(doc.listId, doc.storedName),
      }));

    return { ...enriched, documents };
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

  private async validateProgramItems(
    listId: number | null,
    items: CreateInstallListDto['items'],
  ) {
    if (!items?.length) return;

    const existing =
      listId != null
        ? await this.itemRepo.find({ where: { listId } })
        : [];
    const existingKeys = new Set(
      existing.map((item) => `${item.programId}:${item.method}`),
    );

    for (const item of items) {
      const key = `${item.programId}:${item.method}`;
      if (existingKeys.has(key)) continue;

      const program = await this.programRepo.findOne({
        where: { id: item.programId },
      });
      if (!program || program.isDelete || !program.isActive) {
        throw new BadRequestException(
          `ไม่สามารถเพิ่ม program "${program?.name ?? item.programId}" — ยังไม่เปิดใช้งานหรือถูกลบแล้ว`,
        );
      }
    }
  }

  private async saveItems(listId: number, items: CreateInstallListDto['items']) {
    await this.validateProgramItems(listId, items);

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
      details: this.installListPayloadSummary(dto),
    });

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateInstallListDto, performedBy: string) {
    const list = await this.findOne(id);
    const beforeName = list.name;
    const beforeItemCount = list.items?.length ?? 0;
    const beforeCustomerCount = list.customers?.length ?? 0;

    await this.listRepo.update(id, { name: dto.name });

    await this.saveItems(id, dto.items);
    await this.saveCustomers(id, dto.customers);

    const parts: string[] = [];
    if (beforeName !== dto.name) {
      parts.push(`ชื่อ: ${beforeName} → ${dto.name}`);
    }
    const newItemCount = dto.items?.length ?? 0;
    if (beforeItemCount !== newItemCount) {
      parts.push(`programs: ${beforeItemCount} → ${newItemCount} รายการ`);
    }
    const newCustomerCount = dto.customers?.length ?? 0;
    if (beforeCustomerCount !== newCustomerCount) {
      parts.push(`ลูกค้า: ${beforeCustomerCount} → ${newCustomerCount} ราย`);
    }
    const newCustomerNames =
      dto.customers?.map((c) => c.customerName).join(', ') || '—';
    if (newCustomerCount) {
      parts.push(`รายชื่อลูกค้า: ${newCustomerNames}`);
    }

    await this.auditService.log({
      action: 'update',
      objectType: 'install_list',
      objectId: list.id,
      objectName: dto.name,
      performedBy,
      details: parts.length ? parts.join('; ') : this.installListPayloadSummary(dto),
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
    const item = await this.itemRepo.findOne({
      where: { id: itemId, listId },
      relations: { program: true },
    });
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
    const programLabel = item.program?.name ?? String(item.programId);
    await this.auditService.log({
      action: 'update',
      objectType: 'install_list_customer_item',
      objectId: record.id,
      objectName: `${list?.name ?? listId} / ${customer.customerName}`,
      performedBy,
      details: `${customer.customerName} — ${programLabel} (${item.method}): ${isInstalled ? 'เลือกติดตั้ง' : 'ยกเลิกการติดตั้ง'}`,
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
      details: auditDeletedSummary('install list', list.name),
    });

    return { ok: true };
  }

  async uploadDocuments(
    listId: number,
    files: Express.Multer.File[],
    performedBy: string,
  ) {
    if (!files?.length) {
      throw new BadRequestException('ไม่พบไฟล์ที่อัปโหลด');
    }

    const list = await this.listRepo.findOne({ where: { id: listId } });
    if (!list) throw new NotFoundException('ไม่พบ install list');

    for (const file of files) {
      const stored = await storeListDocument(listId, file);
      await this.documentRepo.save(
        this.documentRepo.create({
          listId,
          ...stored,
          uploadedBy: performedBy,
        }),
      );
    }

    await this.auditService.log({
      action: 'update',
      objectType: 'install_list_document',
      objectId: listId,
      objectName: list.name,
      performedBy,
      details: `อัปโหลด ${files.length} ไฟล์: ${files.map((f) => f.originalname).join(', ')}`,
    });

    return this.findOne(listId);
  }

  async deleteDocument(listId: number, documentId: number, performedBy: string) {
    const doc = await this.documentRepo.findOne({
      where: { id: documentId, listId },
    });
    if (!doc) throw new NotFoundException('ไม่พบเอกสาร');

    const list = await this.listRepo.findOne({ where: { id: listId } });
    await removeListDocumentFile(listId, doc.storedName);
    await this.documentRepo.delete(documentId);

    await this.auditService.log({
      action: 'delete',
      objectType: 'install_list_document',
      objectId: documentId,
      objectName: list?.name ?? String(listId),
      performedBy,
      details: auditDeletedSummary('เอกสาร', doc.originalName),
    });

    return this.findOne(listId);
  }
}
