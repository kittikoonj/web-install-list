import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  InstallList,
  Program,
  InstallMethod,
  InstallListItem,
  InstallListCustomer,
  InstallListDocument,
  CustomerInstall,
  Issue,
  IssueStatus,
} from '../../core/models';
import { MethodBadgeComponent } from '../../shared/method-badge/method-badge.component';
import { ISSUE_STATUS } from '../../core/constants';
import {
  ImageViewerComponent,
  ImageViewItem,
} from '../../shared/image-viewer/image-viewer.component';
import { TooltipDirective } from '../../shared/tooltip/tooltip.directive';

interface GroupedProgram {
  program: Program;
  methods: InstallMethod[];
}

interface CustomerFormRow {
  id: number;
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
  customerInstalls: CustomerInstall[];
  documents: InstallListDocument[];
}

@Component({
  selector: 'app-install-lists',
  imports: [FormsModule, DatePipe, NgSelectModule, MethodBadgeComponent, ImageViewerComponent, TooltipDirective],
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
  viewingImage = signal<ImageViewItem | null>(null);
  openInstallerPicker = signal<number | null>(null);
  installerFilter = signal('');
  uploadingDocuments = signal<number | null>(null);
  editDocuments = signal<InstallListDocument[]>([]);
  customerNameOptions = signal<string[]>([]);
  saveError = signal('');
  showPanel = signal(false);
  panelMode = signal<'customer' | 'issue' | null>(null);
  panelList = signal<InstallList | null>(null);
  panelSaving = signal(false);
  panelError = signal('');
  panelCustomer = signal<CustomerFormRow | null>(null);
  panelInstallerOpen = signal(false);
  panelInstallerFilter = signal('');
  issuePendingFiles = signal<File[]>([]);
  issueUploading = signal(false);
  readonly issueStatusOptions: IssueStatus[] = [
    'open',
    'in_progress',
    'resolved',
    'closed',
  ];
  issueForm = {
    customerName: null as string | null,
    title: '',
    description: '',
    status: 'open' as IssueStatus,
  };
  private nextCustomerRowId = 0;

  @HostListener('document:click')
  closeInstallerPicker() {
    this.openInstallerPicker.set(null);
    this.installerFilter.set('');
    this.panelInstallerOpen.set(false);
    this.panelInstallerFilter.set('');
  }

  ngOnInit() {
    this.load();
    this.loadInstallerUsers();
    this.loadCustomerNameOptions();
  }

  loadCustomerNameOptions() {
    this.api.lookupCustomerNames().subscribe((items) => {
      this.customerNameOptions.set(items.map((item) => item.name));
    });
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
    return {
      id: ++this.nextCustomerRowId,
      customerName: '',
      installerName: '',
      installedAt: new Date().toISOString().slice(0, 10),
      testCaseUrl: '',
    };
  }

  updateCustomerRow(index: number, patch: Partial<Omit<CustomerFormRow, 'id'>>) {
    this.customerRows.update((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
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
    this.closePanel();
    this.editing.set(null);
    this.listName = '';
    this.selections.set(new Set());
    this.customerRows.set([]);
    this.saveError.set('');
    this.editDocuments.set([]);
    this.openInstallerPicker.set(null);
    this.installerFilter.set('');
    this.loadCustomerNameOptions();
    this.loadInstallerUsers();
    this.api.getActivePrograms().subscribe((progs) => {
      this.programs.set(progs);
      this.showModal.set(true);
    });
  }

  openEdit(list: InstallList) {
    this.closePanel();
    this.editing.set(list);
    this.listName = list.name;
    this.loadInstallerUsers();
    this.loadCustomerNameOptions();
    this.api.getInstallList(list.id).subscribe((full) => {
      const sel = new Set<string>();
      full.items?.forEach((item) => {
        sel.add(`${item.programId}:${item.method}`);
      });
      this.selections.set(sel);
      this.editDocuments.set(full.documents ?? []);
      this.customerRows.set(
        full.customers?.map((c) => ({
          id: ++this.nextCustomerRowId,
          customerName: c.customerName,
          installerName: c.installerName ?? '',
          installedAt: c.installedAt?.slice(0, 10) ?? '',
          testCaseUrl: c.testCaseUrl ?? '',
        })) ?? [],
      );
      this.saveError.set('');
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
      .filter((c) => c.customerName.trim())
      .map((c) => ({
        customerName: c.customerName.trim(),
        installerName: c.installerName.trim(),
        installedAt: c.installedAt,
        testCaseUrl: c.testCaseUrl.trim() || undefined,
      }));
  }

  private validateCustomerRows(): string | null {
    for (let i = 0; i < this.customerRows().length; i++) {
      const row = this.customerRows()[i];
      const label = row.customerName.trim() || `แถวที่ ${i + 1}`;
      if (!row.customerName.trim()) {
        return `กรุณาระบุชื่อ Site / ลูกค้า (${label})`;
      }
      if (!row.installerName.trim()) {
        return `กรุณาเลือกผู้ติดตั้งสำหรับ "${row.customerName.trim()}"`;
      }
      if (!row.installedAt) {
        return `กรุณาระบุวันที่ติดตั้งสำหรับ "${row.customerName.trim()}"`;
      }
    }
    return null;
  }

  save() {
    if (!this.listName.trim()) {
      this.saveError.set('กรุณาระบุชื่อ list');
      return;
    }

    const customerError = this.validateCustomerRows();
    if (customerError) {
      this.saveError.set(customerError);
      return;
    }

    this.saveError.set('');
    this.saving.set(true);
    const savedListId = this.editing()?.id ?? null;

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
        const refreshId = savedListId ?? this.expandedId();
        this.load();
        if (refreshId) {
          this.api.getInstallList(refreshId).subscribe((full) => {
            this.listDetails.update((m) =>
              new Map(m).set(refreshId, this.buildListDetail(full)),
            );
            this.patchIncompleteCustomerCount(refreshId, this.buildListDetail(full));
          });
        }
      },
      error: (err) => {
        this.saving.set(false);
        const message =
          err?.error?.message ??
          (Array.isArray(err?.error?.message) ? err.error.message.join(', ') : null) ??
          'บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง';
        this.saveError.set(typeof message === 'string' ? message : 'บันทึกไม่สำเร็จ');
      },
    });
  }

  deleteList(list: InstallList) {
    if (!confirm(`ลบ list "${list.name}"?`)) return;
    this.api.deleteInstallList(list.id).subscribe(() => this.load());
  }

  cloneList(list: InstallList, event: MouseEvent) {
    event.stopPropagation();
    const name = prompt('ชื่อ list ใหม่', `${list.name} (Copy)`);
    if (!name?.trim()) return;
    this.api.cloneInstallList(list.id, name.trim()).subscribe(() => this.load());
  }

  exportList(list: InstallList, event: MouseEvent, format: 'csv' | 'json' = 'csv') {
    event.stopPropagation();
    this.api.exportInstallList(list.id, format).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${list.name.replace(/[^\w.-]+/g, '_')}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  toggleExpand(list: InstallList) {
    if (this.expandedId() === list.id) {
      this.expandedId.set(null);
      if (this.showPanel() && this.panelList()?.id === list.id) {
        this.closePanel();
      }
      return;
    }

    if (this.showPanel() && this.panelList()?.id !== list.id) {
      this.closePanel();
    }

    this.expandedId.set(list.id);
    this.loadingDetail.set(list.id);

    this.api.getInstallList(list.id).subscribe({
      next: (full) => {
        const detail = this.buildListDetail(full);
        this.listDetails.update((m) => new Map(m).set(list.id, detail));
        this.patchIncompleteCustomerCount(list.id, detail);
        this.loadingDetail.set(null);
      },
      error: () => this.loadingDetail.set(null),
    });
  }

  private buildListDetail(full: InstallList): ListDetail {
    return {
      items: full.items ?? [],
      customers: full.customers ?? [],
      issues: full.issues ?? [],
      customerInstalls: full.customerInstalls ?? [],
      documents: full.documents ?? [],
    };
  }

  isExpanded(listId: number): boolean {
    return this.expandedId() === listId;
  }

  getDetail(listId: number): ListDetail {
    return (
      this.listDetails().get(listId) ?? {
        items: [],
        customers: [],
        issues: [],
        customerInstalls: [],
        documents: [],
      }
    );
  }

  sortedDocuments(listId: number): InstallListDocument[] {
    return [...this.getDetail(listId).documents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  isDocumentImage(doc: InstallListDocument): boolean {
    return doc.mimeType.startsWith('image/');
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onDocumentsSelected(listId: number, event: Event) {
    if (!this.canWrite()) return;
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    input.value = '';
    this.uploadingDocuments.set(listId);

    this.api.uploadInstallListDocuments(listId, files).subscribe({
      next: (full) => {
        this.uploadingDocuments.set(null);
        this.listDetails.update((m) =>
          new Map(m).set(listId, this.buildListDetail(full)),
        );
        if (this.editing()?.id === listId) {
          this.editDocuments.set(full.documents ?? []);
        }
      },
      error: () => this.uploadingDocuments.set(null),
    });
  }

  deleteDocument(listId: number, doc: InstallListDocument, event?: MouseEvent) {
    event?.stopPropagation();
    if (!this.canWrite() || !confirm(`ลบเอกสาร "${doc.originalName}"?`)) return;

    this.api.deleteInstallListDocument(listId, doc.id).subscribe({
      next: (full) => {
        this.listDetails.update((m) =>
          new Map(m).set(listId, this.buildListDetail(full)),
        );
        if (this.editing()?.id === listId) {
          this.editDocuments.set(full.documents ?? []);
        }
      },
    });
  }

  viewDocumentImage(doc: InstallListDocument, event: MouseEvent) {
    event.stopPropagation();
    this.viewingImage.set({ url: doc.url, originalName: doc.originalName });
  }

  customerInstallProgress(
    listId: number,
    customerId: number,
  ): { done: number; total: number } {
    const items = this.getDetail(listId).items;
    const total = items.length;
    const done = items.filter((item) =>
      this.isCustomerItemInstalled(listId, customerId, item.id!),
    ).length;
    return { done, total };
  }

  isCustomerItemInstalled(listId: number, customerId: number, itemId: number): boolean {
    return this.getDetail(listId).customerInstalls.some(
      (ci) => ci.customerId === customerId && ci.itemId === itemId && ci.isInstalled,
    );
  }

  toggleCustomerInstalled(
    listId: number,
    customerId: number,
    item: InstallListItem,
    event: Event,
  ) {
    if (!item.id || !customerId || !this.canWrite()) return;
    const checked = (event.target as HTMLInputElement).checked;
    this.api.toggleCustomerItemInstalled(listId, customerId, item.id, checked).subscribe({
      next: (updated) => {
        let nextDetail: ListDetail | null = null;
        this.listDetails.update((m) => {
          const detail = m.get(listId);
          if (!detail) return m;
          const others = detail.customerInstalls.filter(
            (ci) => !(ci.customerId === customerId && ci.itemId === item.id),
          );
          const customerInstalls = updated.isInstalled
            ? [...others, updated]
            : others;
          nextDetail = { ...detail, customerInstalls };
          return new Map(m).set(listId, nextDetail);
        });
        if (nextDetail) {
          this.patchIncompleteCustomerCount(listId, nextDetail);
        }
      },
      error: () => {
        (event.target as HTMLInputElement).checked = !checked;
      },
    });
  }

  private computeIncompleteCustomerCount(detail: ListDetail): number {
    const itemCount = detail.items.length;
    if (!itemCount || !detail.customers.length) return 0;

    let incomplete = 0;
    for (const customer of detail.customers) {
      if (!customer.id) continue;
      const done = detail.items.filter((programItem) =>
        detail.customerInstalls.some(
          (ci) =>
            ci.customerId === customer.id &&
            ci.itemId === programItem.id &&
            ci.isInstalled,
        ),
      ).length;
      if (done < itemCount) incomplete++;
    }
    return incomplete;
  }

  private patchIncompleteCustomerCount(listId: number, detail: ListDetail) {
    const incompleteCustomerCount = this.computeIncompleteCustomerCount(detail);
    this.lists.update((rows) =>
      rows.map((list) =>
        list.id === listId ? { ...list, incompleteCustomerCount } : list,
      ),
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

  canWrite(): boolean {
    return this.auth.canWrite();
  }

  showSidePanel(): boolean {
    return this.showPanel() && this.panelMode() !== null;
  }

  panelTitle(): string {
    if (this.panelMode() === 'customer') return 'เพิ่มลูกค้า';
    if (this.panelMode() === 'issue') return 'เพิ่ม Issue';
    return '';
  }

  closePanel() {
    this.showPanel.set(false);
    this.panelMode.set(null);
    this.panelList.set(null);
    this.panelCustomer.set(null);
    this.panelError.set('');
    this.panelInstallerOpen.set(false);
    this.panelInstallerFilter.set('');
    this.issuePendingFiles.set([]);
    this.issueForm = {
      customerName: null,
      title: '',
      description: '',
      status: 'open',
    };
  }

  openCustomerPanel(list: InstallList, event?: MouseEvent) {
    event?.stopPropagation();
    if (!this.canWrite()) return;

    this.ensureListDetail(list);
    this.panelList.set(list);
    this.panelMode.set('customer');
    this.panelCustomer.set(this.emptyCustomerRow());
    this.panelError.set('');
    this.panelInstallerOpen.set(false);
    this.panelInstallerFilter.set('');
    this.loadCustomerNameOptions();
    this.loadInstallerUsers();
    this.showPanel.set(true);
  }

  openIssuePanel(list: InstallList, event?: MouseEvent) {
    event?.stopPropagation();
    if (!this.canWrite() || !this.canViewIssues()) return;

    this.ensureListDetail(list);
    this.panelList.set(list);
    this.panelMode.set('issue');
    this.panelError.set('');
    this.issuePendingFiles.set([]);
    this.issueForm = {
      customerName: null,
      title: '',
      description: '',
      status: 'open',
    };
    this.loadCustomerNameOptions();
    this.showPanel.set(true);
  }

  createIssue(list: InstallList, event: MouseEvent) {
    this.openIssuePanel(list, event);
  }

  private ensureListDetail(list: InstallList) {
    if (this.expandedId() !== list.id) {
      this.expandedId.set(list.id);
    }
    if (!this.listDetails().has(list.id)) {
      this.loadingDetail.set(list.id);
      this.api.getInstallList(list.id).subscribe({
        next: (full) => {
          const detail = this.buildListDetail(full);
          this.listDetails.update((m) => new Map(m).set(list.id, detail));
          this.patchIncompleteCustomerCount(list.id, detail);
          this.loadingDetail.set(null);
        },
        error: () => this.loadingDetail.set(null),
      });
    }
  }

  private refreshListDetail(listId: number) {
    this.api.getInstallList(listId).subscribe((full) => {
      const detail = this.buildListDetail(full);
      this.listDetails.update((m) => new Map(m).set(listId, detail));
      this.patchIncompleteCustomerCount(listId, detail);
    });
  }

  updatePanelCustomer(patch: Partial<Omit<CustomerFormRow, 'id'>>) {
    const current = this.panelCustomer();
    if (!current) return;
    this.panelCustomer.set({ ...current, ...patch });
  }

  togglePanelInstallerPicker(event: MouseEvent) {
    event.stopPropagation();
    this.panelInstallerOpen.update((open) => !open);
    this.panelInstallerFilter.set('');
  }

  selectPanelInstaller(name: string | null) {
    this.updatePanelCustomer({ installerName: name ?? '' });
    this.panelInstallerOpen.set(false);
    this.panelInstallerFilter.set('');
  }

  filteredPanelInstallers(): InstallerOption[] {
    const row = this.panelCustomer();
    if (!row) return this.installerUsers();
    const q = this.panelInstallerFilter().trim().toLowerCase();
    const users = this.installerOptionsForRow(row);
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)),
    );
  }

  issueCustomerOptions(listId: number): string[] {
    const fromList = this.getDetail(listId).customers.map((c) => c.customerName);
    return [...new Set([...fromList, ...this.customerNameOptions()])];
  }

  private validatePanelCustomer(row: CustomerFormRow): string | null {
    if (!row.customerName.trim()) return 'กรุณาระบุชื่อ Site / ลูกค้า';
    if (!row.installerName.trim()) {
      return `กรุณาเลือกผู้ติดตั้งสำหรับ "${row.customerName.trim()}"`;
    }
    if (!row.installedAt) {
      return `กรุณาระบุวันที่ติดตั้งสำหรับ "${row.customerName.trim()}"`;
    }
    return null;
  }

  saveCustomerPanel() {
    const list = this.panelList();
    const row = this.panelCustomer();
    if (!list || !row) return;

    const error = this.validatePanelCustomer(row);
    if (error) {
      this.panelError.set(error);
      return;
    }

    this.panelError.set('');
    this.panelSaving.set(true);

    this.api.getInstallList(list.id).subscribe({
      next: (full) => {
        const customers = [
          ...(full.customers ?? []).map((c) => ({
            customerName: c.customerName,
            installerName: c.installerName ?? '',
            installedAt: c.installedAt?.slice(0, 10) ?? c.installedAt,
            testCaseUrl: c.testCaseUrl ?? undefined,
          })),
          {
            customerName: row.customerName.trim(),
            installerName: row.installerName.trim(),
            installedAt: row.installedAt,
            testCaseUrl: row.testCaseUrl.trim() || undefined,
          },
        ];
        const items = (full.items ?? []).map((item) => ({
          programId: item.programId,
          method: item.method,
        }));

        this.api
          .updateInstallList(list.id, {
            name: full.name,
            items,
            customers,
          })
          .subscribe({
            next: () => {
              this.panelSaving.set(false);
              this.closePanel();
              this.load();
              this.refreshListDetail(list.id);
            },
            error: (err) => {
              this.panelSaving.set(false);
              this.panelError.set(this.extractErrorMessage(err));
            },
          });
      },
      error: (err) => {
        this.panelSaving.set(false);
        this.panelError.set(this.extractErrorMessage(err));
      },
    });
  }

  saveIssuePanel() {
    const list = this.panelList();
    if (!list || !this.issueForm.title.trim()) {
      this.panelError.set('กรุณาระบุหัวข้อ issue');
      return;
    }

    this.panelError.set('');
    this.panelSaving.set(true);

    this.api
      .createIssue({
        installListId: list.id,
        customerName: this.issueForm.customerName?.trim() || undefined,
        title: this.issueForm.title.trim(),
        description: this.issueForm.description.trim() || undefined,
        status: this.issueForm.status,
      })
      .subscribe({
        next: (issue) => this.uploadIssuePendingFiles(issue.id, list.id),
        error: (err) => {
          this.panelSaving.set(false);
          this.panelError.set(this.extractErrorMessage(err));
        },
      });
  }

  private uploadIssuePendingFiles(issueId: number, listId: number) {
    const files = this.issuePendingFiles();
    if (!files.length) {
      this.panelSaving.set(false);
      this.closePanel();
      this.load();
      this.refreshListDetail(listId);
      return;
    }

    this.issueUploading.set(true);
    this.api.uploadIssueAttachments(issueId, files).subscribe({
      next: () => {
        this.issueUploading.set(false);
        this.panelSaving.set(false);
        this.closePanel();
        this.load();
        this.refreshListDetail(listId);
      },
      error: (err) => {
        this.issueUploading.set(false);
        this.panelSaving.set(false);
        this.panelError.set(this.extractErrorMessage(err));
      },
    });
  }

  onIssueFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.issuePendingFiles.update((files) => [...files, ...Array.from(input.files!)]);
    input.value = '';
  }

  removeIssuePendingFile(index: number) {
    this.issuePendingFiles.update((files) => files.filter((_, i) => i !== index));
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private extractErrorMessage(err: { error?: { message?: string | string[] } }): string {
    const message = err?.error?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
    return 'บันทึกไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง';
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

  viewIssueImage(att: { url: string; originalName: string }, event: MouseEvent) {
    event.stopPropagation();
    this.viewingImage.set({ url: att.url, originalName: att.originalName });
  }

  closeImageView() {
    this.viewingImage.set(null);
  }
}
