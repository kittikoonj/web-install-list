import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { PermissionMatrix } from '../../core/models';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
  private readonly api = inject(ApiService);

  matrix = signal<PermissionMatrix | null>(null);
  pending = signal<Map<string, boolean>>(new Map());
  saving = signal(false);

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getPermissions().subscribe((data) => {
      this.matrix.set(data);
      this.pending.set(new Map());
    });
  }

  cellKey(roleId: number, menuKey: string): string {
    return `${roleId}:${menuKey}`;
  }

  isChecked(roleId: number, menuKey: string): boolean {
    const k = this.cellKey(roleId, menuKey);
    const pending = this.pending();
    if (pending.has(k)) return pending.get(k)!;
    return this.matrix()?.matrix[roleId]?.[menuKey] ?? false;
  }

  isLocked(roleName: string): boolean {
    return roleName === 'super_admin';
  }

  toggle(roleId: number, menuKey: string, roleName: string) {
    if (this.isLocked(roleName)) return;
    const k = this.cellKey(roleId, menuKey);
    const next = new Map(this.pending());
    const current = this.isChecked(roleId, menuKey);
    next.set(k, !current);
    this.pending.set(next);
  }

  save() {
    const updates: { roleId: number; menuKey: string; canAccess: boolean }[] = [];
    this.pending().forEach((canAccess, key) => {
      const [roleId, menuKey] = key.split(':');
      updates.push({ roleId: +roleId, menuKey, canAccess });
    });

    if (!updates.length) return;
    this.saving.set(true);
    this.api.updatePermissions(updates).subscribe({
      next: (data) => {
        this.matrix.set(data);
        this.pending.set(new Map());
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  hasChanges(): boolean {
    return this.pending().size > 0;
  }
}
