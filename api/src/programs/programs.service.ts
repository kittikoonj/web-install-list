import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Program } from '../entities/program.entity';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';
import { AuditService } from '../common/audit.service';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(search?: string, includeDeleted = false) {
    const where: Record<string, unknown> = {};
    if (!includeDeleted) where.isDelete = 0;

    if (search) {
      return this.programRepo.find({
        where: { ...where, name: Like(`%${search}%`) },
        order: { name: 'ASC' },
      });
    }

    return this.programRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findActive() {
    return this.programRepo.find({
      where: { isDelete: 0 },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const program = await this.programRepo.findOne({ where: { id } });
    if (!program) throw new NotFoundException('ไม่พบ program');
    return program;
  }

  async create(dto: CreateProgramDto, performedBy: string) {
    const program = this.programRepo.create({
      ...dto,
      createdBy: performedBy,
    });
    const saved = await this.programRepo.save(program);

    await this.auditService.log({
      action: 'create',
      objectType: 'program',
      objectId: saved.id,
      objectName: saved.name,
      performedBy,
    });

    return saved;
  }

  async update(id: number, dto: UpdateProgramDto, performedBy: string) {
    const program = await this.findOne(id);
    Object.assign(program, dto);
    const saved = await this.programRepo.save(program);

    await this.auditService.log({
      action: 'update',
      objectType: 'program',
      objectId: saved.id,
      objectName: saved.name,
      performedBy,
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
    });

    return { ok: true };
  }
}
