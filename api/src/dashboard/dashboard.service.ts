import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstallList } from '../entities/install-list.entity';
import { Program } from '../entities/program.entity';
import { Issue } from '../entities/issue.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(InstallList)
    private readonly listRepo: Repository<InstallList>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getStats() {
    const [
      totalLists,
      activeLists,
      totalPrograms,
      totalIssues,
      openIssues,
      totalUsers,
      recentLists,
      recentIssues,
    ] = await Promise.all([
      this.listRepo.count(),
      this.listRepo.count({ where: { isDelete: 0 } }),
      this.programRepo.count({ where: { isDelete: 0 } }),
      this.issueRepo.count({ where: { isDelete: 0 } }),
      this.issueRepo.count({
        where: { isDelete: 0, status: 'open' as const },
      }),
      this.userRepo.count({ where: { isDelete: 0, status: 'active' } }),
      this.listRepo.find({
        where: { isDelete: 0 },
        order: { updatedAt: 'DESC' },
        take: 5,
      }),
      this.issueRepo.find({
        where: { isDelete: 0 },
        relations: { installList: true },
        order: { updatedAt: 'DESC' },
        take: 5,
      }),
    ]);

    return {
      totalLists,
      activeLists,
      totalPrograms,
      totalIssues,
      openIssues,
      totalUsers,
      recentLists: recentLists.map((l) => ({
        id: l.id,
        name: l.name,
        updatedAt: l.updatedAt,
      })),
      recentIssues: recentIssues.map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        installListName: i.installList?.name,
        updatedAt: i.updatedAt,
      })),
    };
  }
}
