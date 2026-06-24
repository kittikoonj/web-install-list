import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { SessionGuard } from '../common/guards/session.guard';
import { RequireMenu } from '../common/decorators/require-menu.decorator';

@Controller('audit-logs')
@UseGuards(SessionGuard)
@RequireMenu('audit_log')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('action') action?: string,
    @Query('performedBy') performedBy?: string,
  ) {
    return this.auditLogsService.findAll({ from, to, action, performedBy });
  }
}
