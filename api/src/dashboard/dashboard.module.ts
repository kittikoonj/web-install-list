import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallList } from '../entities/install-list.entity';
import { InstallListCustomerItem } from '../entities/install-list-customer-item.entity';
import { Program } from '../entities/program.entity';
import { Issue } from '../entities/issue.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InstallList, InstallListCustomerItem, Program, Issue, User, AuditLog])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
