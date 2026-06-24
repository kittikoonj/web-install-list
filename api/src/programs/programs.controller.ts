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
} from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';
import { SessionGuard } from '../common/guards/session.guard';
import { RequireMenu } from '../common/decorators/require-menu.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('programs')
@UseGuards(SessionGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @RequireMenu('programs')
  findAll(
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.programsService.findAll(search, includeDeleted === 'true');
  }

  @Get('active')
  findActive() {
    return this.programsService.findActive();
  }

  @Get(':id')
  @RequireMenu('programs')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.findOne(id);
  }

  @Post()
  @RequireMenu('programs')
  create(@Body() dto: CreateProgramDto, @CurrentUser() user: User) {
    return this.programsService.create(dto, user.name);
  }

  @Put(':id')
  @RequireMenu('programs')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgramDto,
    @CurrentUser() user: User,
  ) {
    return this.programsService.update(id, dto, user.name);
  }

  @Delete(':id')
  @RequireMenu('programs')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.programsService.softDelete(id, user.name);
  }
}
