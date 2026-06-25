import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  InstallList,
  Program,
  InstallMethod,
  InstallListItem,
  InstallListCustomer,
  Issue,
  IssueStatus,
} from '../../core/models';
import { MethodBadgeComponent } from '../../shared/method-badge/method-badge.component';
import { ISSUE_STATUS } from '../../core/constants';

interface GroupedProgram {
  program: Program;
  methods: InstallMethod[];
}

interface CustomerFormRow {
  customerName: string;
  installerName: string;
  installedAt: string;
  testCaseUrl: string;
}

interface InstallerOption {
  id: number;
  name: string;
  email: string;
}

interface ListDetail {
  items: InstallListItem[];
  customers: InstallListCustomer[];
  issues: Issue[];
}

@Component({
  selector: 'app-install-lists',
  imports: [FormsModule, DatePipe, MethodBadgeComponent],
  templateUrl: './install-lists.component.html',
  styleUrl: './install-lists.component.scss',
})
export class InstallListsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  lists = signal<InstallList[]>([]);
  programs = signal<Program[]>([]);
  installerUsers = signal<InstallerOption[]>([]);
  activeOnly = signal(true);
  search = '';
  showModal = signal(false);
  editing = signal<InstallList | null>(null);
  saving = signal(false);

  listName = '';
  selections = signal<Set<string>>(new Set());
  customerRows = signal<CustomerFormRow[]>([]);
  expandedId = signal<number | null>(null);
  loadingDetail = signal<number | null>(null);
  listDetails = signal<Map<number, ListDetail>>(new Map());
  readonly issueStatusMeta = ISSUE_STATUS;
  openInstallerPicker = signal<number | null>(null);
  installerFilter = signal('');

  @HostListener('document:click')
  closeInstallerPicker() {
    this.openInstallerPicker.set(null);
    this.installerFilter.set('');
  }

  ngOnInit() {
    this.load();
    this.loadInstallerUsers();
  }

  load() {
    this.api.getInstallLists(this.activeOnly(), this.search.trim() || undefined).subscribe((data) => {
      this.lists.set(data);
    });
  }

  toggleFilter(active: boolean) {
    this.activeOnly.set(active);
    this.load();
  }

  emptyCustomerRow(): CustomerFormRow {
    return { customerName: '', installerName: '', installedAt: '', testCaseUrl: '' };
  }

  loadInstallerUsers() {
    this.api.getUserSelectOptions().subscribe({
      next: (users) => this.installerUsers.set(users),
      error: () => this.installerUsers.set([]),
    });
  }

  selectInstaller(index: number, name: string | null) {
    this.customerRows.update((rows) =>
      rows.map((row, i) =>
        i === index ? { ...row, installerName: name ?? '' } : row,
      ),
    );
    this.openInstallerPicker.set(null);
    this.installerFilter.set('');
  }

  toggleInstallerPicker(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.openInstallerPicker.update((current) => (current === index ? null : index));
    this.installerFilter.set('');
  }

  filteredInstallerUsersForRow(row: CustomerFormRow, filter: string): InstallerOption[] {
    const q = filter.trim().toLowerCase();
    const users = this.installerOptionsForRow(row);
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)),
    );
  }

  installerOptionsForRow(row: CustomerFormRow): InstallerOption[] {
    const users = this.installerUsers();
    if (
      row.installerName &&
      !users.some((u) => u.name === row.installerName)
    ) {
      return [{ id: 0, name: row.installerName, email: '' }, ...users];
    }
    return users;
  }

  openCreate() {
    this.editing.set(null);
    this.listName = '';
    this.selections.set(new Set());
    this.customerRows.set([]);
    this.openInstallerPicker.set(null);
    this.installerFilter.set('');
    this.loadInstallerUsers();
    this.api.getActivePrograms().subscribe((progs) => {
      this.programs.set(progs);
      this.showModal.set(true);
    });
  }

  openEdit(list: InstallList) {
    this.editing.set(list);
    this.listName = list.name;
    this.loadInstallerUsers();
    this.api.getInstallList(list.id).subscribe((full) => {
      const sel = new Set<string>();
      full.items?.forEach((item) => {
        sel.add(`${item.programId}:${item.method}`);
      });
      this.selections.set(sel);
      this.customerRows.set(
        full.customers?.map((c) => ({
          customerName: c.customerName,
          installerName: c.installerName ?? '',
          installedAt: c.installedAt?.slice(0, 10) ?? '',
          testCaseUrl: c.testCaseUrl ?? '',
        })) ?? [],
      );
      this.api.getActivePrograms().subscribe((progs) => {
        this.programs.set(progs);
        this.showModal.set(true);
      });
    });
  }

  addCustomerRow() {
    this.customerRows.update((rows) => [...rows, this.emptyCustomerRow()]);
  }

  removeCustomerRow(index: number) {
    this.customerRows.update((rows) => rows.filter((_, i) => i !== index));
  }

  key(programId: number, method: InstallMethod): string {
    return `${programId}:${method}`;
  }

  isSelected(programId: number, method: InstallMethod): boolean {
    return this.selections().has(this.key(programId, method));
  }

  toggleSelection(programId: number, method: InstallMethod) {
    const k = this.key(programId, method);
    const next = new Set(this.selections());
    if (next.has(k)) next.delete(k);
    else next.add(k);
    this.selections.set(next);
  }

  private buildCustomersPayload() {
    return this.customerRows()
      .filter((c) => c.customerName.trim() && c.installerName.trim() && c.installedAt)
      .map((c) => ({
        customerName: c.customerName.trim(),
        installerName: c.installerName.trim(),
        installedAt: c.installedAt,
        testCaseUrl: c.testCaseUrl.trim() || undefined,
      }));
  }

  save() {
    if (!this.listName.trim()) return;
    this.saving.set(true);

    const payload = {
      name: this.listName,
      items: [...this.selections()].map((k) => {
        const [programId, method] = k.split(':');
        return { programId: +programId, method };
      }),
      customers: this.buildCustomersPayload(),
    };

    const obs = this.editing()
      ? this.api.updateInstallList(this.editing()!.id, payload)
      : this.api.createInstallList(payload);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.showModal.set(false);
        const expanded = this.expandedId();
        this.load();
        if (expanded) {
          this.api.getInstallList(expanded).subscribe((full) => {
            this.listDetails.update((m) =>
              new Map(m).set(expanded, {
                items: full.items ?? [],
                customers: full.customers ?? [],
                issues: full.issues ?? [],
              }),
            );
          });
        }
      },
      error: () => this.saving.set(false),
    });
  }

  deleteList(list: InstallList) {
    if (!confirm(`ลบ list "${list.name}"?`)) return;
    this.api.deleteInstallList(list.id).subscribe(() => this.load());
  }

  toggleExpand(list: InstallList) {
    if (this.expandedId() === list.id) {
      this.expandedId.set(null);
      return;
    }

    this.expandedId.set(list.id);
    this.loadingDetail.set(list.id);

    this.api.getInstallList(list.id).subscribe({
      next: (full) => {
        this.listDetails.update((m) =>
          new Map(m).set(list.id, {
            items: full.items ?? [],
            customers: full.customers ?? [],
            issues: full.issues ?? [],
          }),
        );
        this.loadingDetail.set(null);
      },
      error: () => this.loadingDetail.set(null),
    });
  }

  isExpanded(listId: number): boolean {
    return this.expandedId() === listId;
  }

  getDetail(listId: number): ListDetail {
    return (
      this.listDetails().get(listId) ?? { items: [], customers: [], issues: [] }
    );
  }

  groupedPrograms(listId: number): GroupedProgram[] {
    const items = this.getDetail(listId).items;
    const map = new Map<number, GroupedProgram>();

    for (const item of items) {
      if (!item.program) continue;
      const existing = map.get(item.programId);
      if (existing) {
        if (!existing.methods.includes(item.method)) {
          existing.methods.push(item.method);
        }
      } else {
        map.set(item.programId, { program: item.program, methods: [item.method] });
      }
    }

    return [...map.values()].sort((a, b) =>
      a.program.name.localeCompare(b.program.name),
    );
  }

  sortedCustomers(listId: number): InstallListCustomer[] {
    return [...this.getDetail(listId).customers].sort(
      (a, b) => new Date(b.installedAt).getTime() - new Date(a.installedAt).getTime(),
    );
  }

  sortedIssues(listId: number): Issue[] {
    return [...this.getDetail(listId).issues].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  issueStatusLabel(status: IssueStatus): string {
    return this.issueStatusMeta[status]?.label ?? status;
  }

  issueStatusStyle(status: IssueStatus) {
    const meta = this.issueStatusMeta[status];
    return meta ? { background: meta.bg, color: meta.fg } : {};
  }

  canViewIssues(): boolean {
    return this.auth.canAccess('issues');
  }

  viewIssues(list: InstallList, issueId?: number) {
    this.router.navigate(['/issues'], {
      queryParams: {
        installListId: list.id,
        ...(issueId ? { issueId } : {}),
      },
    });
  }

  issueImages(issue: Issue) {
    return (issue.attachments ?? []).filter((a) => a.fileType === 'image');
  }

  issueFiles(issue: Issue) {
    return (issue.attachments ?? []).filter((a) => a.fileType === 'file');
  }
}
