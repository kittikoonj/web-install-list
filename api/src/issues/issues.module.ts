import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue } from '../entities/issue.entity';
import { IssueAttachment } from '../entities/issue-attachment.entity';
import { InstallList } from '../entities/install-list.entity';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Issue, IssueAttachment, InstallList])],
  providers: [IssuesService],
  controllers: [IssuesController],
  exports: [IssuesService],
})
export class IssuesModule {}
