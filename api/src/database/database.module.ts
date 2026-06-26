import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { User } from '../entities/user.entity';
import { SettingOs } from '../entities/setting-os.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, RolePermission, User, SettingOs])],
  providers: [SeedService],
})
export class DatabaseModule {}
