import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import type { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { InstallListsService } from './install-lists.service';
import { CreateInstallListDto, UpdateInstallListDto, CloneInstallListDto, ToggleItemInstalledDto } from './dto/install-list.dto';
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

  @Patch(':id/customers/:customerId/items/:itemId/installed')
  toggleCustomerItemInstalled(
    @Param('id', ParseIntPipe) id: number,
    @Param('customerId', ParseIntPipe) customerId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: ToggleItemInstalledDto,
    @CurrentUser() user: User,
  ) {
    return this.installListsService.toggleCustomerItemInstalled(
      id,
      customerId,
      itemId,
      !!dto.isInstalled,
      user.name,
    );
  }

  @Post(':id/documents')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  uploadDocuments(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: User,
  ) {
    return this.installListsService.uploadDocuments(id, files, user.name);
  }

  @Delete(':id/documents/:documentId')
  deleteDocument(
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
    @CurrentUser() user: User,
  ) {
    return this.installListsService.deleteDocument(id, documentId, user.name);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.installListsService.softDelete(id, user.name);
  }
}
