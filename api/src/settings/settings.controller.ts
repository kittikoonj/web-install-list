import { Controller, Get, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../common/guards/session.guard';
import { RequireMenu } from '../common/decorators/require-menu.decorator';

@Controller('settings')
@UseGuards(SessionGuard)
@RequireMenu('settings')
export class SettingsController {
  @Get()
  getSettings() {
    return {
      companyName: 'Install List Manager',
      githubOrg: '',
      sessionTimeout: 24,
    };
  }
}
