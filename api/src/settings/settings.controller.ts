import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateMasterNameDto } from './dto/master-data.dto';
import { SessionGuard } from '../common/guards/session.guard';
import { RequireMenu } from '../common/decorators/require-menu.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('settings')
@UseGuards(SessionGuard)
@RequireMenu('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getAppSettings();
  }

  @Get('os')
  listOs() {
    return this.settingsService.listOs();
  }

  @Post('os')
  createOs(@Body() dto: CreateMasterNameDto, @CurrentUser() user: User) {
    return this.settingsService.createOs(dto.name, user.name);
  }

  @Delete('os/:id')
  deleteOs(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.settingsService.deleteOs(id, user.name);
  }

  @Get('program-names')
  listProgramNames() {
    return this.settingsService.listProgramNames();
  }

  @Post('program-names')
  createProgramName(@Body() dto: CreateMasterNameDto, @CurrentUser() user: User) {
    return this.settingsService.createProgramName(dto.name, user.name);
  }

  @Delete('program-names/:id')
  deleteProgramName(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.settingsService.deleteProgramName(id, user.name);
  }

  @Get('customer-names')
  listCustomerNames() {
    return this.settingsService.listCustomerNames();
  }

  @Post('customer-names')
  createCustomerName(@Body() dto: CreateMasterNameDto, @CurrentUser() user: User) {
    return this.settingsService.createCustomerName(dto.name, user.name);
  }

  @Delete('customer-names/:id')
  deleteCustomerName(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.settingsService.deleteCustomerName(id, user.name);
  }
}
