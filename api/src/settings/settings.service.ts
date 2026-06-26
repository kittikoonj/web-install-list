import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingOs } from '../entities/setting-os.entity';
import { SettingProgramName } from '../entities/setting-program-name.entity';
import { SettingCustomerName } from '../entities/setting-customer-name.entity';
import { Program } from '../entities/program.entity';
import { AuditService } from '../common/audit.service';
import { auditCreatedSummary, auditDeletedSummary } from '../common/audit.util';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SettingOs)
    private readonly osRepo: Repository<SettingOs>,
    @InjectRepository(SettingProgramName)
    private readonly programNameRepo: Repository<SettingProgramName>,
    @InjectRepository(SettingCustomerName)
    private readonly customerNameRepo: Repository<SettingCustomerName>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    private readonly auditService: AuditService,
  ) {}

  getAppSettings() {
    return {
      companyName: 'Install List Manager',
      githubOrg: '',
      sessionTimeout: 24,
    };
  }

  listOs() {
    return this.osRepo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async createOs(name: string, performedBy: string) {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('กรุณาระบุชื่อ OS');

    const existing = await this.osRepo.findOne({ where: { name: trimmed } });
    if (existing) throw new ConflictException('ชื่อ OS นี้มีอยู่แล้ว');

    const saved = await this.osRepo.save(
      this.osRepo.create({ name: trimmed, sortOrder: 0 }),
    );

    await this.auditService.log({
      action: 'create',
      objectType: 'setting_os',
      objectId: saved.id,
      objectName: saved.name,
      performedBy,
      details: auditCreatedSummary({ name: saved.name }, { name: 'ชื่อ OS' }),
    });

    return saved;
  }

  async deleteOs(id: number, performedBy: string) {
    const item = await this.osRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('ไม่พบ OS');

    const inUse = await this.programRepo.count({ where: { osId: id, isDelete: 0 } });
    if (inUse > 0) {
      throw new BadRequestException('ไม่สามารถลบ OS ที่ program กำลังใช้งานอยู่');
    }

    await this.osRepo.delete(id);

    await this.auditService.log({
      action: 'delete',
      objectType: 'setting_os',
      objectId: id,
      objectName: item.name,
      performedBy,
      details: auditDeletedSummary('OS', item.name),
    });

    return { ok: true };
  }

  listProgramNames() {
    return this.programNameRepo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async createProgramName(name: string, performedBy: string) {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('กรุณาระบุชื่อ program');

    const existing = await this.programNameRepo.findOne({ where: { name: trimmed } });
    if (existing) throw new ConflictException('ชื่อ program นี้มีอยู่แล้ว');

    const saved = await this.programNameRepo.save(
      this.programNameRepo.create({ name: trimmed, sortOrder: 0 }),
    );

    await this.auditService.log({
      action: 'create',
      objectType: 'setting_program_name',
      objectId: saved.id,
      objectName: saved.name,
      performedBy,
      details: auditCreatedSummary({ name: saved.name }, { name: 'ชื่อ program' }),
    });

    return saved;
  }

  async deleteProgramName(id: number, performedBy: string) {
    const item = await this.programNameRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('ไม่พบชื่อ program');

    await this.programNameRepo.delete(id);

    await this.auditService.log({
      action: 'delete',
      objectType: 'setting_program_name',
      objectId: id,
      objectName: item.name,
      performedBy,
      details: auditDeletedSummary('ชื่อ program', item.name),
    });

    return { ok: true };
  }

  listCustomerNames() {
    return this.customerNameRepo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async createCustomerName(name: string, performedBy: string) {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('กรุณาระบุชื่อลูกค้า');

    const existing = await this.customerNameRepo.findOne({ where: { name: trimmed } });
    if (existing) throw new ConflictException('ชื่อลูกค้านี้มีอยู่แล้ว');

    const saved = await this.customerNameRepo.save(
      this.customerNameRepo.create({ name: trimmed, sortOrder: 0 }),
    );

    await this.auditService.log({
      action: 'create',
      objectType: 'setting_customer_name',
      objectId: saved.id,
      objectName: saved.name,
      performedBy,
      details: auditCreatedSummary({ name: saved.name }, { name: 'ชื่อลูกค้า' }),
    });

    return saved;
  }

  async deleteCustomerName(id: number, performedBy: string) {
    const item = await this.customerNameRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('ไม่พบชื่อลูกค้า');

    await this.customerNameRepo.delete(id);

    await this.auditService.log({
      action: 'delete',
      objectType: 'setting_customer_name',
      objectId: id,
      objectName: item.name,
      performedBy,
      details: auditDeletedSummary('ชื่อลูกค้า', item.name),
    });

    return { ok: true };
  }
}
