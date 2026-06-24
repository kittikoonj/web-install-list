import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { AuditService } from '../common/audit.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(search?: string, roleId?: number) {
    const where: Record<string, unknown>[] = [];
    const base: Record<string, unknown> = {};

    if (roleId) base.roleId = roleId;

    base.isDelete = 0;

    if (search) {
      return this.userRepo.find({
        where: [
          { ...base, name: Like(`%${search}%`) },
          { ...base, email: Like(`%${search}%`) },
        ],
        relations: { role: true },
        order: { id: 'ASC' },
      });
    }

    return this.userRepo.find({
      where: base,
      relations: { role: true },
      order: { id: 'ASC' },
    });
  }

  async findSelectOptions() {
    return this.userRepo.find({
      where: { isDelete: 0, status: 'active' },
      select: { id: true, name: true, email: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!user) throw new NotFoundException('ไม่พบผู้ใช้');
    return user;
  }

  async create(dto: CreateUserDto, performedBy: string) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('อีเมลนี้ถูกใช้แล้ว');

    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      password: hash,
      status: dto.status ?? 'active',
    });
    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      action: 'create',
      objectType: 'user',
      objectId: saved.id,
      objectName: saved.name,
      performedBy,
    });

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateUserDto, performedBy: string) {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('อีเมลนี้ถูกใช้แล้ว');
    }

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);

    await this.auditService.log({
      action: 'update',
      objectType: 'user',
      objectId: saved.id,
      objectName: saved.name,
      performedBy,
    });

    return this.findOne(saved.id);
  }

  async softDelete(id: number, performedBy: string) {
    const user = await this.findOne(id);
    user.isDelete = 1;
    user.deletedBy = performedBy;
    user.deletedAt = new Date();
    await this.userRepo.save(user);

    await this.auditService.log({
      action: 'delete',
      objectType: 'user',
      objectId: user.id,
      objectName: user.name,
      performedBy,
    });

    return { ok: true };
  }
}
