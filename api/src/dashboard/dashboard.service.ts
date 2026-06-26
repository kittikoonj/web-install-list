import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InstallList } from '../entities/install-list.entity';
import { InstallListCustomerItem } from '../entities/install-list-customer-item.entity';
import { Program } from '../entities/program.entity';
import { Issue } from '../entities/issue.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(InstallList)
    private readonly listRepo: Repository<InstallList>,
    @InjectRepository(InstallListCustomerItem)
    private readonly customerItemRepo: Repository<InstallListCustomerItem>,
    @InjectRepository(Program)
    private readonly programRepo: Repository<Program>,
    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  private async computeInstallMetrics(lists: InstallList[]) {
    const customerIds = lists.flatMap((list) =>
      (list.customers ?? []).map((c) => c.id).filter((id): id is number => id != null),
    );

    const installedByCustomer = new Map<number, number>();
    if (customerIds.length) {
      const customerItems = await this.customerItemRepo.find({
        where: { customerId: In(customerIds), isInstalled: 1 },
      });
      for (const ci of customerItems) {
        installedByCustomer.set(
          ci.customerId,
          (installedByCustomer.get(ci.customerId) ?? 0) + 1,
        );
      }
    }

    let totalIncompleteCustomers = 0;
    let totalCustomers = 0;
    let completedCustomers = 0;
    let listsWithIncomplete = 0;
    const incompleteLists: {
      id: number;
      name: string;
      incompleteCustomerCount: number;
      customerCount: number;
      progressPercent: number;
      updatedAt: Date;
    }[] = [];

    let totalInstallSlots = 0;
    let completedInstallSlots = 0;

    for (const list of lists) {
      const itemCount = list.items?.length ?? 0;
      const customers = list.customers ?? [];
      totalCustomers += customers.length;

      if (!itemCount || !customers.length) continue;

      let incomplete = 0;
      let installedSlots = 0;
      const totalSlots = itemCount * customers.length;

      for (const customer of customers) {
        const done = installedByCustomer.get(customer.id!) ?? 0;
        installedSlots += done;
        if (done < itemCount) incomplete++;
        else completedCustomers++;
      }

      totalInstallSlots += totalSlots;
      completedInstallSlots += installedSlots;

      totalIncompleteCustomers += incomplete;
      if (incomplete > 0) {
        listsWithIncomplete++;
        incompleteLists.push({
          id: list.id,
          name: list.name,
          incompleteCustomerCount: incomplete,
          customerCount: customers.length,
          progressPercent: totalSlots
            ? Math.round((installedSlots / totalSlots) * 100)
            : 0,
          updatedAt: list.updatedAt,
        });
      }
    }

    incompleteLists.sort(
      (a, b) => b.incompleteCustomerCount - a.incompleteCustomerCount,
    );

    return {
      totalIncompleteCustomers,
      totalCustomers,
      listsWithIncomplete,
      overallProgressPercent: totalInstallSlots
        ? Math.round((completedInstallSlots / totalInstallSlots) * 100)
        : 100,
      completedCustomers: completedCustomers,
      incompleteLists: incompleteLists.slice(0, 8),
    };
  }

  async getStats() {
    const activeListsData = await this.listRepo.find({
      where: { isDelete: 0 },
      relations: { items: true, customers: true },
      order: { updatedAt: 'DESC' },
    });

    const installMetrics = await this.computeInstallMetrics(activeListsData);

    const [
      totalLists,
      activeLists,
      totalPrograms,
      activePrograms,
      inactivePrograms,
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      closedIssues,
      totalUsers,
      recentLists,
      recentIssues,
      pendingIssues,
      recentAuditLogs,
    ] = await Promise.all([
      this.listRepo.count(),
      this.listRepo.count({ where: { isDelete: 0 } }),
      this.programRepo.count({ where: { isDelete: 0 } }),
      this.programRepo.count({ where: { isDelete: 0, isActive: 1 } }),
      this.programRepo.count({ where: { isDelete: 0, isActive: 0 } }),
      this.issueRepo.count({ where: { isDelete: 0 } }),
      this.issueRepo.count({ where: { isDelete: 0, status: 'open' } }),
      this.issueRepo.count({ where: { isDelete: 0, status: 'in_progress' } }),
      this.issueRepo.count({ where: { isDelete: 0, status: 'resolved' } }),
      this.issueRepo.count({ where: { isDelete: 0, status: 'closed' } }),
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
      this.issueRepo.find({
        where: { isDelete: 0, status: In(['open', 'in_progress']) },
        relations: { installList: true },
        order: { updatedAt: 'DESC' },
        take: 8,
      }),
      this.auditRepo.find({
        order: { performedAt: 'DESC' },
        take: 8,
      }),
    ]);

    return {
      totalLists,
      activeLists,
      totalPrograms,
      activePrograms,
      inactivePrograms,
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      closedIssues,
      totalUsers,
      totalCustomers: installMetrics.totalCustomers,
      totalIncompleteCustomers: installMetrics.totalIncompleteCustomers,
      listsWithIncomplete: installMetrics.listsWithIncomplete,
      overallProgressPercent: installMetrics.overallProgressPercent,
      completedCustomers: installMetrics.completedCustomers,
      incompleteLists: installMetrics.incompleteLists.map((l) => ({
        id: l.id,
        name: l.name,
        incompleteCustomerCount: l.incompleteCustomerCount,
        customerCount: l.customerCount,
        progressPercent: l.progressPercent,
        updatedAt: l.updatedAt,
      })),
      recentLists: recentLists.map((l) => ({
        id: l.id,
        name: l.name,
        updatedAt: l.updatedAt,
      })),
      recentIssues: recentIssues.map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        customerName: i.customerName,
        installListName: i.installList?.name,
        updatedAt: i.updatedAt,
      })),
      pendingIssues: pendingIssues.map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        customerName: i.customerName,
        installListName: i.installList?.name,
        updatedAt: i.updatedAt,
      })),
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        objectType: log.objectType,
        objectName: log.objectName,
        details: log.details,
        performedBy: log.performedBy,
        performedAt: log.performedAt,
      })),
    };
  }
}
