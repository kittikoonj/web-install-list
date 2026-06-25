import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { UserRecord, Role } from '../../core/models';
import { RoleBadgeComponent } from '../../shared/role-badge/role-badge.component';
import { MENU_ITEMS } from '../../core/constants';

@Component({
  selector: 'app-users',
  imports: [FormsModule, RoleBadgeComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  users = signal<UserRecord[]>([]);
  roles = signal<Role[]>([]);
  search = '';
  roleFilter = '';
  showModal = signal(false);
  editing = signal<UserRecord | null>(null);
  saving = signal(false);
  changePassword = false;

  form = {
    name: '',
    email: '',
    password: '',
    roleId: 0,
    status: 'active' as 'active' | 'inactive',
  };

  readonly previewMenus = computed(() => {
    const role = this.roles().find((r) => r.id === this.form.roleId);
    if (!role) return [];
    if (role.name === 'super_admin') return MENU_ITEMS.map((m) => m.label);
    const permMap: Record<string, string[]> = {
      manager: ['Install Lists', 'Programs', 'Audit Log'],
      user: ['Install Lists'],
      viewer: ['Install Lists'],
    };
    return permMap[role.name] ?? [];
  });

  ngOnInit() {
    this.load();
    this.api.getRoles().subscribe((r) => this.roles.set(r));
  }

  load() {
    this.api
      .getUsers(
        this.search || undefined,
        this.roleFilter ? +this.roleFilter : undefined,
      )
      .subscribe((data) => this.users.set(data));
  }

  openCreate() {
    this.editing.set(null);
    this.changePassword = true;
    this.form = {
      name: '',
      email: '',
      password: '',
      roleId: this.roles()[0]?.id ?? 0,
      status: 'active',
    };
    this.showModal.set(true);
  }

  openEdit(user: UserRecord) {
    this.editing.set(user);
    this.changePassword = false;
    this.form = {
      name: user.name,
      email: user.email,
      password: '',
      roleId: user.roleId,
      status: user.status,
    };
    this.showModal.set(true);
  }

  save() {
    this.saving.set(true);
    const payload: Record<string, unknown> = {
      name: this.form.name,
      email: this.form.email,
      roleId: this.form.roleId,
      status: this.form.status,
    };
    if (this.changePassword && this.form.password) {
      payload['password'] = this.form.password;
    }

    const obs = this.editing()
      ? this.api.updateUser(this.editing()!.id, payload)
      : this.api.createUser({ ...payload, password: this.form.password });

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  deleteUser(user: UserRecord) {
    if (!confirm(`ลบ user "${user.name}"?`)) return;
    this.api.deleteUser(user.id).subscribe(() => this.load());
  }

  canWrite(): boolean {
    return this.auth.canWrite();
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
