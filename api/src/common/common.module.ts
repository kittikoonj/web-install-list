import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditService } from './audit.service';
import { SessionGuard } from './guards/session.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService, SessionGuard],
  exports: [AuditService, SessionGuard],
})
export class CommonModule {}
