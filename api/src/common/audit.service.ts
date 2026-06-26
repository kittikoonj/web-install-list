import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: {
    action: 'create' | 'update' | 'delete';
    objectType: string;
    objectId?: number;
    objectName?: string;
    performedBy?: string;
    details?: string;
  }): Promise<void> {
    const entry = this.auditRepo.create({
      action: params.action,
      objectType: params.objectType,
      objectId: params.objectId ?? null,
      objectName: params.objectName ?? null,
      details: params.details ?? null,
      performedBy: params.performedBy ?? null,
    });
    await this.auditRepo.save(entry);
  }
}
