import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { User } from '../entities/user.entity';
import { MENU_KEYS } from '../common/constants';

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  super_admin: Object.fromEntries(MENU_KEYS.map((k) => [k, true])),
  manager: {
    dashboard: true,
    install_lists: true,
    issues: true,
    programs: true,
    users: false,
    roles: false,
    audit_log: true,
    settings: false,
  },
  user: {
    dashboard: true,
    install_lists: true,
    issues: true,
    programs: false,
    users: false,
    roles: false,
    audit_log: false,
    settings: false,
  },
  viewer: {
    dashboard: true,
    install_lists: true,
    issues: true,
    programs: false,
    users: false,
    roles: false,
    audit_log: false,
    settings: false,
  },
};

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly permRepo: Repository<RolePermission>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedPermissions();
    await this.seedAdminUser();
  }

  private async seedRoles() {
    const roles = [
      { name: 'super_admin', label: 'Super Admin' },
      { name: 'manager', label: 'Manager' },
      { name: 'user', label: 'User' },
      { name: 'viewer', label: 'Viewer' },
    ];

    for (const role of roles) {
      const existing = await this.roleRepo.findOne({
        where: { name: role.name },
      });
      if (!existing) {
        await this.roleRepo.save(this.roleRepo.create(role));
      }
    }
  }

  private async seedPermissions() {
    const roles = await this.roleRepo.find();
    for (const role of roles) {
      const perms = DEFAULT_PERMISSIONS[role.name];
      if (!perms) continue;

      for (const menuKey of MENU_KEYS) {
        const existing = await this.permRepo.findOne({
          where: { roleId: role.id, menuKey },
        });
        if (!existing) {
          await this.permRepo.save(
            this.permRepo.create({
              roleId: role.id,
              menuKey,
              canAccess: perms[menuKey] ? 1 : 0,
            }),
          );
        }
      }
    }
  }

  private async seedAdminUser() {
    const existing = await this.userRepo.findOne({
      where: { email: 'admin@example.com' },
    });
    if (existing) return;

    const adminRole = await this.roleRepo.findOne({
      where: { name: 'super_admin' },
    });
    if (!adminRole) return;

    const hash = await bcrypt.hash('admin123', 10);
    await this.userRepo.save(
      this.userRepo.create({
        name: 'Super Admin',
        email: 'admin@example.com',
        password: hash,
        roleId: adminRole.id,
        status: 'active',
      }),
    );
  }
}
