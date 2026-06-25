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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto } from './dto/issue.dto';
import { SessionGuard } from '../common/guards/session.guard';
import { RequireMenu } from '../common/decorators/require-menu.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('issues')
@UseGuards(SessionGuard)
@RequireMenu('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('installListId') installListId?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    const listId = installListId ? parseInt(installListId, 10) : undefined;
    return this.issuesService.findAll(
      search,
      listId,
      includeDeleted === 'true',
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateIssueDto, @CurrentUser() user: User) {
    return this.issuesService.create(dto, user.name);
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  uploadAttachments(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.issuesService.uploadAttachments(id, files);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIssueDto,
    @CurrentUser() user: User,
  ) {
    return this.issuesService.update(id, dto, user.name);
  }

  @Delete(':id/attachments/:attachmentId')
  deleteAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ) {
    return this.issuesService.deleteAttachment(id, attachmentId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.issuesService.softDelete(id, user.name);
  }
}
