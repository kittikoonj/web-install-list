import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import {
  MENU_KEYS,
  MENU_LABELS,
  SUPER_ADMIN_ROLE,
} from '../common/constants';

export interface PermissionMatrix {
  menus: { key: string; label: string }[];
  roles: { id: number; name: string; label: string }[];
  matrix: Record<number, Record<string, boolean>>;
}

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly permRepo: Repository<RolePermission>,
  ) {}

  async findAllRoles() {
    return this.roleRepo.find({ order: { id: 'ASC' } });
  }

  async getPermissionMatrix(): Promise<PermissionMatrix> {
    const roles = await this.findAllRoles();
    const perms = await this.permRepo.find();

    const matrix: Record<number, Record<string, boolean>> = {};
    for (const role of roles) {
      matrix[role.id] = {};
      for (const key of MENU_KEYS) {
        if (role.name === SUPER_ADMIN_ROLE) {
          matrix[role.id][key] = true;
        } else {
          const perm = perms.find(
            (p) => p.roleId === role.id && p.menuKey === key,
          );
          matrix[role.id][key] = perm ? !!perm.canAccess : false;
        }
      }
    }

    return {
      menus: MENU_KEYS.map((key) => ({ key, label: MENU_LABELS[key] })),
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        label: r.label,
      })),
      matrix,
    };
  }

  async updatePermissions(
    updates: { roleId: number; menuKey: string; canAccess: boolean }[],
  ) {
    for (const update of updates) {
      const role = await this.roleRepo.findOne({
        where: { id: update.roleId },
      });
      if (!role || role.name === SUPER_ADMIN_ROLE) continue;

      let perm = await this.permRepo.findOne({
        where: { roleId: update.roleId, menuKey: update.menuKey },
      });

      if (!perm) {
        perm = this.permRepo.create({
          roleId: update.roleId,
          menuKey: update.menuKey,
          canAccess: update.canAccess ? 1 : 0,
        });
      } else {
        perm.canAccess = update.canAccess ? 1 : 0;
      }
      await this.permRepo.save(perm);
    }

    return this.getPermissionMatrix();
  }
}
