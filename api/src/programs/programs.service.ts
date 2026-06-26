import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from '../entities/program.entity';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';
import { AuditService } from '../common/audit.service';
import {
  auditChanges,
  auditCreatedSummary,
  auditDeletedSummary,
} from '../common/audit.util';

const PROGRAM_LABELS: Record<string, string> = {
  name: 'ชื่อ',
  version: 'เวอร์ชัน',
  githubUrl: 'GitHub URL',
  methods: 'วิธีติดตั้ง',
  osId: 'OS',
  note: 'หมายเหตุ',
};

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(search?: string, includeDeleted = false) {
    const qb = this.programRepo
      .createQueryBuilder('program')
      .leftJoinAndSelect('program.os', 'os')
      .orderBy('program.name', 'ASC');

    if (!includeDeleted) {
      qb.andWhere('program.is_delete = :notDeleted', { notDeleted: 0 });
    }

    const term = search?.trim();
    if (term) {
      qb.andWhere('program.name LIKE :term', { term: `%${term}%` });
    }

    return qb.getMany();
  }

  async findActive() {
    return this.programRepo.find({
      where: { isDelete: 0, isActive: 1 },
      relations: { os: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const program = await this.programRepo.findOne({
      where: { id },
      relations: { os: true },
    });
    if (!program) throw new NotFoundException('ไม่พบ program');
    return program;
  }

  async create(dto: CreateProgramDto, performedBy: string) {
    const program = this.programRepo.create({
      ...dto,
      isActive: 0,
      createdBy: performedBy,
    });
    const saved = await this.programRepo.save(program);

    await this.auditService.log({
      action: 'create',
      objectType: 'program',
      objectId: saved.id,
      objectName: saved.name,
      performedBy,
      details: auditCreatedSummary(
        {
          name: saved.name,
          version: saved.version,
          githubUrl: saved.githubUrl,
          methods: saved.methods,
          osId: saved.osId,
        },
        PROGRAM_LABELS,
      ),
    });

    return saved;
  }

  async update(id: number, dto: UpdateProgramDto, performedBy: string) {
    const program = await this.findOne(id);
    const before = {
      name: program.name,
      version: program.version,
      githubUrl: program.githubUrl,
      methods: program.methods,
      osId: program.osId,
      note: program.note,
    };
    Object.assign(program, dto);
    const saved = await this.programRepo.save(program);
    const after = {
      name: saved.name,
      version: saved.version,
      githubUrl: saved.githubUrl,
      methods: saved.methods,
      osId: saved.osId,
      note: saved.note,
    };

    await this.auditService.log({
      action: 'update',
      objectType: 'program',
      objectId: saved.id,
      objectName: saved.name,
      performedBy,
      details: auditChanges(before, after, PROGRAM_LABELS),
    });

    return saved;
  }

  async softDelete(id: number, performedBy: string) {
    const program = await this.findOne(id);
    program.isDelete = 1;
    program.deletedBy = performedBy;
    program.deletedAt = new Date();
    await this.programRepo.save(program);

    await this.auditService.log({
      action: 'delete',
      objectType: 'program',
      objectId: program.id,
      objectName: program.name,
      performedBy,
      details: auditDeletedSummary('program', program.name),
    });

    return { ok: true };
  }

  async toggleActive(id: number, isActive: boolean, performedBy: string) {
    const program = await this.findOne(id);
    if (program.isDelete) {
      throw new NotFoundException('ไม่พบ program');
    }

    program.isActive = isActive ? 1 : 0;
    const saved = await this.programRepo.save(program);

    await this.auditService.log({
      action: 'update',
      objectType: 'program',
      objectId: saved.id,
      objectName: saved.name,
      performedBy,
      details: `สถานะ: ${isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}`,
    });

    return saved;
  }
}
