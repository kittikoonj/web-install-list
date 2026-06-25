import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { InstallListsService } from './install-lists.service';
import { CreateInstallListDto, UpdateInstallListDto, CloneInstallListDto } from './dto/install-list.dto';
import { SessionGuard } from '../common/guards/session.guard';
import { RequireMenu } from '../common/decorators/require-menu.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('install-lists')
@UseGuards(SessionGuard)
@RequireMenu('install_lists')
export class InstallListsController {
  constructor(private readonly installListsService: InstallListsService) {}

  @Get()
  findAll(
    @Query('activeOnly') activeOnly?: string,
    @Query('search') search?: string,
  ) {
    return this.installListsService.findAll(activeOnly !== 'false', search);
  }

  @Get(':id/export')
  exportList(
    @Param('id', ParseIntPipe) id: number,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Res() res: Response,
  ) {
    return this.installListsService.exportList(id, format, res);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.installListsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateInstallListDto, @CurrentUser() user: User) {
    return this.installListsService.create(dto, user.name);
  }

  @Post(':id/clone')
  clone(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloneInstallListDto,
    @CurrentUser() user: User,
  ) {
    return this.installListsService.clone(id, dto, user.name);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInstallListDto,
    @CurrentUser() user: User,
  ) {
    return this.installListsService.update(id, dto, user.name);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.installListsService.softDelete(id, user.name);
  }
}
