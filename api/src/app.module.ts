import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProgramsModule } from './programs/programs.module';
import { InstallListsModule } from './install-lists/install-lists.module';
import { RolesModule } from './roles/roles.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
import { SettingsModule } from './settings/settings.module';
import { IssuesModule } from './issues/issues.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Program } from './entities/program.entity';
import { InstallList } from './entities/install-list.entity';
import { InstallListItem } from './entities/install-list-item.entity';
import { InstallListCustomer } from './entities/install-list-customer.entity';
import { InstallListCustomerItem } from './entities/install-list-customer-item.entity';
import { Issue } from './entities/issue.entity';
import { IssueAttachment } from './entities/issue-attachment.entity';
import { IssueComment } from './entities/issue-comment.entity';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mariadb',
        host: config.get('DB_HOST', 'localhost'),
        port: parseInt(config.get('DB_PORT', '3306'), 10),
        username: config.get('DB_USERNAME', 'installlist'),
        password: config.get('DB_PASSWORD', 'installlist'),
        database: config.get('DB_DATABASE', 'install_list'),
        entities: [
          User,
          Role,
          RolePermission,
          Program,
          InstallList,
          InstallListItem,
          InstallListCustomer,
          InstallListCustomerItem,
          Issue,
          IssueAttachment,
          IssueComment,
          AuditLog,
        ],
        synchronize: true,
        charset: 'utf8mb4',
      }),
    }),
    AuthModule,
    CommonModule,
    DatabaseModule,
    UsersModule,
    ProgramsModule,
    InstallListsModule,
    IssuesModule,
    DashboardModule,
    HealthModule,
    RolesModule,
    AuditLogsModule,
    SettingsModule,
  ],
})
export class AppModule {}
