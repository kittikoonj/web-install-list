import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, IssueStatus } from '../../core/models';
import { ISSUE_STATUS } from '../../core/constants';
import { TooltipDirective } from '../../shared/tooltip/tooltip.directive';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink, TooltipDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  stats = signal<DashboardStats | null>(null);
  health = signal<{ status: string; db: string } | null>(null);
  loading = signal(true);
  readonly issueStatusMeta = ISSUE_STATUS;

  readonly issueStatusOrder: IssueStatus[] = [
    'open',
    'in_progress',
    'resolved',
    'closed',
  ];

  readonly actionLabels: Record<string, string> = {
    create: 'สร้าง',
    update: 'แก้ไข',
    delete: 'ลบ',
  };

  readonly objectTypeLabels: Record<string, string> = {
    program: 'Program',
    install_list: 'Install List',
    install_list_customer_item: 'เลือกติดตั้ง',
    install_list_document: 'เอกสาร',
    issue: 'Issue',
    issue_attachment: 'ไฟล์แนบ',
    issue_comment: 'ความคิดเห็น',
    setting_os: 'ตั้งค่า OS',
    setting_program_name: 'ชื่อ Program',
    setting_customer_name: 'ชื่อลูกค้า',
    user: 'ผู้ใช้',
  };

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.api.getHealth().subscribe({
      next: (data) => this.health.set({ status: data.status, db: data.db }),
      error: () => this.health.set({ status: 'error', db: 'unknown' }),
    });
  }

  canAccess(menuKey: string): boolean {
    return this.auth.canAccess(menuKey);
  }

  canWrite(): boolean {
    return this.auth.canWrite();
  }

  issueCount(status: IssueStatus): number {
    const s = this.stats();
    if (!s) return 0;
    const map: Record<IssueStatus, number> = {
      open: s.openIssues,
      in_progress: s.inProgressIssues,
      resolved: s.resolvedIssues,
      closed: s.closedIssues,
    };
    return map[status] ?? 0;
  }

  issueTotal(): number {
    const s = this.stats();
    if (!s) return 0;
    return s.openIssues + s.inProgressIssues + s.resolvedIssues + s.closedIssues;
  }

  statusLabel(status: string): string {
    return this.issueStatusMeta[status]?.label ?? status;
  }

  statusStyle(status: string) {
    const meta = this.issueStatusMeta[status];
    return meta ? { background: meta.bg, color: meta.fg } : {};
  }

  statusColor(status: string): string {
    return this.issueStatusMeta[status]?.fg ?? '#666';
  }

  healthLabel(): string {
    const h = this.health();
    if (!h) return 'กำลังตรวจสอบ...';
    if (h.status === 'ok' && h.db === 'ok') return 'ระบบปกติ';
    return 'มีปัญหา';
  }

  healthClass(): string {
    const h = this.health();
    if (!h) return 'checking';
    return h.status === 'ok' && h.db === 'ok' ? 'ok' : 'error';
  }

  progressClass(percent: number): string {
    if (percent >= 100) return 'done';
    if (percent >= 60) return 'good';
    if (percent >= 30) return 'warn';
    return 'low';
  }

  objectTypeLabel(type: string): string {
    return this.objectTypeLabels[type] ?? type;
  }

  auditSummary(log: {
    action: string;
    objectType: string;
    objectName?: string | null;
    details?: string | null;
  }): string {
    const action = this.actionLabels[log.action] ?? log.action;
    const type = this.objectTypeLabel(log.objectType);
    const name = log.objectName?.trim();
    if (log.details?.trim()) return log.details;
    if (name) return `${action} ${type}: ${name}`;
    return `${action} ${type}`;
  }

  issueMeta(issue: { installListName?: string; customerName?: string | null }): string {
    const parts = [issue.installListName, issue.customerName].filter(Boolean);
    return parts.join(' · ') || '—';
  }
}
