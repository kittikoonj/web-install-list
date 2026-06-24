import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { SessionGuard } from '../common/guards/session.guard';
import { RequireMenu } from '../common/decorators/require-menu.decorator';

@Controller('roles')
@UseGuards(SessionGuard)
@RequireMenu('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAllRoles();
  }

  @Get('permissions')
  getPermissions() {
    return this.rolesService.getPermissionMatrix();
  }

  @Put('permissions')
  updatePermissions(
    @Body()
    body: { updates: { roleId: number; menuKey: string; canAccess: boolean }[] },
  ) {
    return this.rolesService.updatePermissions(body.updates);
  }
}
