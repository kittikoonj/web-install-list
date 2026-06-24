import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async findAll(filters: {
    from?: string;
    to?: string;
    action?: string;
    performedBy?: string;
  }) {
    const where: FindOptionsWhere<AuditLog> = {};

    if (filters.action) {
      where.action = filters.action as 'create' | 'update' | 'delete';
    }

    if (filters.performedBy) {
      where.performedBy = filters.performedBy;
    }

    if (filters.from && filters.to) {
      where.performedAt = Between(
        new Date(filters.from),
        new Date(`${filters.to}T23:59:59`),
      );
    }

    return this.auditRepo.find({
      where,
      order: { performedAt: 'DESC' },
      take: 500,
    });
  }
}
