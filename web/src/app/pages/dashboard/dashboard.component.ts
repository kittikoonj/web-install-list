import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DashboardStats } from '../../core/models';
import { ISSUE_STATUS } from '../../core/constants';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  stats = signal<DashboardStats | null>(null);
  readonly issueStatusMeta = ISSUE_STATUS;

  ngOnInit() {
    this.api.getDashboardStats().subscribe((data) => this.stats.set(data));
  }

  statusLabel(status: string): string {
    return this.issueStatusMeta[status]?.label ?? status;
  }

  statusStyle(status: string) {
    const meta = this.issueStatusMeta[status];
    return meta ? { background: meta.bg, color: meta.fg } : {};
  }
}
