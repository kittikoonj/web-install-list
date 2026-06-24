import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuditLog } from '../../core/models';

@Component({
  selector: 'app-audit-log',
  imports: [FormsModule, DatePipe],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent implements OnInit {
  private readonly api = inject(ApiService);

  logs = signal<AuditLog[]>([]);
  filters = {
    from: '',
    to: '',
    action: '',
    performedBy: '',
  };

  readonly actionLabels: Record<string, string> = {
    create: 'สร้าง',
    update: 'แก้ไข',
    delete: 'ลบ',
  };

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getAuditLogs(this.filters).subscribe((data) => this.logs.set(data));
  }

  clearFilters() {
    this.filters = { from: '', to: '', action: '', performedBy: '' };
    this.load();
  }
}
