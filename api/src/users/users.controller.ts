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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { SessionGuard } from '../common/guards/session.guard';
import { RequireMenu } from '../common/decorators/require-menu.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('users')
@UseGuards(SessionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('select-options')
  findSelectOptions() {
    return this.usersService.findSelectOptions();
  }

  @Get()
  @RequireMenu('users')
  findAll(
    @Query('search') search?: string,
    @Query('roleId') roleId?: string,
  ) {
    return this.usersService.findAll(
      search,
      roleId ? parseInt(roleId, 10) : undefined,
    );
  }

  @Get(':id')
  @RequireMenu('users')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequireMenu('users')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: User) {
    return this.usersService.create(dto, user.name);
  }

  @Put(':id')
  @RequireMenu('users')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.update(id, dto, user.name);
  }

  @Delete(':id')
  @RequireMenu('users')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.usersService.softDelete(id, user.name);
  }
}
