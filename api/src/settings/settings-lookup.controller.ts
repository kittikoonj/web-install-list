import { Controller, Get, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SessionGuard } from '../common/guards/session.guard';

@Controller('settings/lookup')
@UseGuards(SessionGuard)
export class SettingsLookupController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('os')
  listOs() {
    return this.settingsService.listOs();
  }

  @Get('program-names')
  listProgramNames() {
    return this.settingsService.listProgramNames();
  }

  @Get('customer-names')
  listCustomerNames() {
    return this.settingsService.listCustomerNames();
  }
}
