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

  readonly objectTypeLabels: Record<string, string> = {
    program: 'Program',
    install_list: 'Install List',
    install_list_customer_item: 'เลือกติดตั้ง',
    install_list_document: 'เอกสาร Install List',
    issue: 'Issue',
    issue_attachment: 'ไฟล์แนบ Issue',
    issue_comment: 'ความคิดเห็น Issue',
    setting_os: 'ตั้งค่า OS',
    setting_program_name: 'ตั้งค่าชื่อ Program',
    setting_customer_name: 'ตั้งค่าชื่อลูกค้า',
    user: 'ผู้ใช้',
  };

  objectTypeLabel(type: string): string {
    return this.objectTypeLabels[type] ?? type;
  }

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
