import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { SUPER_ADMIN_ROLE, MENU_KEYS, MenuKey } from '../common/constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RolePermission)
    private readonly permRepo: Repository<RolePermission>,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({
      where: { email, isDelete: 0 },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        roleId: true,
        status: true,
        isDelete: true,
      },
      relations: { role: true },
    });

    if (!user) return null;
    if (user.status === 'inactive') {
      throw new UnauthorizedException('บัญชีถูกระงับ');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;

    delete (user as Partial<User>).password;
    return user;
  }

  async findUserById(id: number): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id, isDelete: 0 },
      relations: { role: true },
    });
  }

  async getMenuPermissions(roleId: number, roleName: string): Promise<Record<string, boolean>> {
    if (roleName === SUPER_ADMIN_ROLE) {
      return Object.fromEntries(MENU_KEYS.map((k) => [k, true]));
    }

    const perms = await this.permRepo.find({ where: { roleId } });
    const map: Record<string, boolean> = {};
    for (const key of MENU_KEYS) {
      const perm = perms.find((p) => p.menuKey === key);
      map[key] = perm ? !!perm.canAccess : false;
    }
    return map;
  }

  async canAccessMenu(
    roleId: number,
    roleName: string,
    menuKey: string,
  ): Promise<boolean> {
    if (roleName === SUPER_ADMIN_ROLE) return true;
    const perm = await this.permRepo.findOne({ where: { roleId, menuKey } });
    return perm ? !!perm.canAccess : false;
  }

  sanitizeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      role: {
        id: user.role.id,
        name: user.role.name,
        label: user.role.label,
      },
      status: user.status,
    };
  }
}
