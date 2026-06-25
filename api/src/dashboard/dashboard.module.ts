import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallList } from '../entities/install-list.entity';
import { Program } from '../entities/program.entity';
import { Issue } from '../entities/issue.entity';
import { User } from '../entities/user.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InstallList, Program, Issue, User])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
