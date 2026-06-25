import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SessionGuard } from '../common/guards/session.guard';
import { RequireMenu } from '../common/decorators/require-menu.decorator';

@Controller('dashboard')
@UseGuards(SessionGuard)
@RequireMenu('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }
}
