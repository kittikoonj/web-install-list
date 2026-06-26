import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  SettingOs,
  SettingProgramName,
  SettingCustomerName,
} from '../../core/models';

type SettingsTab = 'os' | 'programNames' | 'customerNames';

@Component({
  selector: 'app-settings',
  imports: [FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  settings = signal<Record<string, unknown> | null>(null);
  activeTab = signal<SettingsTab>('os');

  osList = signal<SettingOs[]>([]);
  programNames = signal<SettingProgramName[]>([]);
  customerNames = signal<SettingCustomerName[]>([]);

  newOsName = '';
  newProgramName = '';
  newCustomerName = '';
  saving = signal(false);
  error = signal('');

  ngOnInit() {
    this.api.getSettings().subscribe((data) => this.settings.set(data));
    this.loadAll();
  }

  canWrite(): boolean {
    return this.auth.canWrite();
  }

  setTab(tab: SettingsTab) {
    this.activeTab.set(tab);
    this.error.set('');
  }

  loadAll() {
    this.api.getSettingOs().subscribe((data) => this.osList.set(data));
    this.api.getSettingProgramNames().subscribe((data) => this.programNames.set(data));
    this.api.getSettingCustomerNames().subscribe((data) => this.customerNames.set(data));
  }

  addOs() {
    const name = this.newOsName.trim();
    if (!name || !this.canWrite()) return;
    this.saving.set(true);
    this.error.set('');
    this.api.createSettingOs(name).subscribe({
      next: (item) => {
        this.osList.update((list) => [...list, item].sort((a, b) => a.name.localeCompare(b.name)));
        this.newOsName = '';
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'ไม่สามารถเพิ่ม OS ได้');
        this.saving.set(false);
      },
    });
  }

  deleteOs(item: SettingOs) {
    if (!this.canWrite() || !confirm(`ลบ OS "${item.name}"?`)) return;
    this.api.deleteSettingOs(item.id).subscribe({
      next: () => this.osList.update((list) => list.filter((x) => x.id !== item.id)),
      error: (err) => this.error.set(err.error?.message ?? 'ไม่สามารถลบ OS ได้'),
    });
  }

  addProgramName() {
    const name = this.newProgramName.trim();
    if (!name || !this.canWrite()) return;
    this.saving.set(true);
    this.error.set('');
    this.api.createSettingProgramName(name).subscribe({
      next: (item) => {
        this.programNames.update((list) =>
          [...list, item].sort((a, b) => a.name.localeCompare(b.name)),
        );
        this.newProgramName = '';
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'ไม่สามารถเพิ่มชื่อ program ได้');
        this.saving.set(false);
      },
    });
  }

  deleteProgramName(item: SettingProgramName) {
    if (!this.canWrite() || !confirm(`ลบชื่อ program "${item.name}"?`)) return;
    this.api.deleteSettingProgramName(item.id).subscribe({
      next: () =>
        this.programNames.update((list) => list.filter((x) => x.id !== item.id)),
      error: (err) => this.error.set(err.error?.message ?? 'ไม่สามารถลบชื่อ program ได้'),
    });
  }

  addCustomerName() {
    const name = this.newCustomerName.trim();
    if (!name || !this.canWrite()) return;
    this.saving.set(true);
    this.error.set('');
    this.api.createSettingCustomerName(name).subscribe({
      next: (item) => {
        this.customerNames.update((list) =>
          [...list, item].sort((a, b) => a.name.localeCompare(b.name)),
        );
        this.newCustomerName = '';
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'ไม่สามารถเพิ่มชื่อลูกค้าได้');
        this.saving.set(false);
      },
    });
  }

  deleteCustomerName(item: SettingCustomerName) {
    if (!this.canWrite() || !confirm(`ลบชื่อลูกค้า "${item.name}"?`)) return;
    this.api.deleteSettingCustomerName(item.id).subscribe({
      next: () =>
        this.customerNames.update((list) => list.filter((x) => x.id !== item.id)),
      error: (err) => this.error.set(err.error?.message ?? 'ไม่สามารถลบชื่อลูกค้าได้'),
    });
  }
}
