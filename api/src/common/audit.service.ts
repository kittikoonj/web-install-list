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
  }): Promise<void> {
    const entry = this.auditRepo.create({
      action: params.action,
      objectType: params.objectType,
      objectId: params.objectId ?? null,
      objectName: params.objectName ?? null,
      performedBy: params.performedBy ?? null,
    });
    await this.auditRepo.save(entry);
  }
}
