import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Program, InstallList, InstallListItem, InstallListDocument, CustomerInstall, UserRecord, AuditLog, PermissionMatrix, Role, Issue, DashboardStats, SettingOs, SettingProgramName, SettingCustomerName } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private opts = { withCredentials: true as const };

  // Dashboard
  getDashboardStats() {
    return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`, this.opts);
  }

  getHealth() {
    return this.http.get<{ status: string; db: string; uptime: number }>(`${this.base}/health`);
  }

  // Programs
  getPrograms(search?: string, includeDeleted = false) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (includeDeleted) params = params.set('includeDeleted', 'true');
    return this.http.get<Program[]>(`${this.base}/programs`, { ...this.opts, params });
  }

  getActivePrograms() {
    return this.http.get<Program[]>(`${this.base}/programs/active`, this.opts);
  }

  createProgram(data: Partial<Program>) {
    return this.http.post<Program>(`${this.base}/programs`, data, this.opts);
  }

  updateProgram(id: number, data: Partial<Program>) {
    return this.http.put<Program>(`${this.base}/programs/${id}`, data, this.opts);
  }

  deleteProgram(id: number) {
    return this.http.delete(`${this.base}/programs/${id}`, this.opts);
  }

  toggleProgramActive(id: number, isActive: boolean) {
    return this.http.patch<Program>(
      `${this.base}/programs/${id}/active`,
      { isActive },
      this.opts,
    );
  }

  // Install Lists
  getInstallLists(activeOnly = true, search?: string) {
    let params = new HttpParams().set('activeOnly', String(activeOnly));
    if (search) params = params.set('search', search);
    return this.http.get<InstallList[]>(`${this.base}/install-lists`, { ...this.opts, params });
  }

  getInstallList(id: number) {
    return this.http.get<InstallList>(`${this.base}/install-lists/${id}`, this.opts);
  }

  createInstallList(data: {
    name: string;
    items: { programId: number; method: string }[];
    customers?: { customerName: string; installerName: string; installedAt: string; testCaseUrl?: string }[];
  }) {
    return this.http.post<InstallList>(`${this.base}/install-lists`, data, this.opts);
  }

  updateInstallList(
    id: number,
    data: {
      name: string;
      items: { programId: number; method: string }[];
      customers?: { customerName: string; installerName: string; installedAt: string; testCaseUrl?: string }[];
    },
  ) {
    return this.http.put<InstallList>(`${this.base}/install-lists/${id}`, data, this.opts);
  }

  deleteInstallList(id: number) {
    return this.http.delete(`${this.base}/install-lists/${id}`, this.opts);
  }

  cloneInstallList(id: number, name?: string) {
    return this.http.post<InstallList>(
      `${this.base}/install-lists/${id}/clone`,
      { name },
      this.opts,
    );
  }

  exportInstallList(id: number, format: 'csv' | 'json' = 'csv') {
    return this.http.get(`${this.base}/install-lists/${id}/export`, {
      ...this.opts,
      params: new HttpParams().set('format', format),
      responseType: 'blob',
    });
  }

  toggleCustomerItemInstalled(
    listId: number,
    customerId: number,
    itemId: number,
    isInstalled: boolean,
  ) {
    return this.http.patch<CustomerInstall>(
      `${this.base}/install-lists/${listId}/customers/${customerId}/items/${itemId}/installed`,
      { isInstalled },
      this.opts,
    );
  }

  uploadInstallListDocuments(listId: number, files: File[]) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return this.http.post<InstallList>(
      `${this.base}/install-lists/${listId}/documents`,
      formData,
      this.opts,
    );
  }

  deleteInstallListDocument(listId: number, documentId: number) {
    return this.http.delete<InstallList>(
      `${this.base}/install-lists/${listId}/documents/${documentId}`,
      this.opts,
    );
  }

  // Issues
  getIssues(search?: string, installListId?: number, includeDeleted = false, status?: string) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (installListId) params = params.set('installListId', installListId);
    if (includeDeleted) params = params.set('includeDeleted', 'true');
    if (status) params = params.set('status', status);
    return this.http.get<Issue[]>(`${this.base}/issues`, { ...this.opts, params });
  }

  getIssue(id: number) {
    return this.http.get<Issue>(`${this.base}/issues/${id}`, this.opts);
  }

  createIssue(data: {
    installListId: number;
    title: string;
    description?: string;
    customerName?: string;
    status?: string;
  }) {
    return this.http.post<Issue>(`${this.base}/issues`, data, this.opts);
  }

  updateIssue(
    id: number,
    data: {
      installListId?: number;
      title?: string;
      description?: string;
      status?: string;
    },
  ) {
    return this.http.put<Issue>(`${this.base}/issues/${id}`, data, this.opts);
  }

  deleteIssue(id: number) {
    return this.http.delete(`${this.base}/issues/${id}`, this.opts);
  }

  uploadIssueAttachments(issueId: number, files: File[]) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return this.http.post<Issue>(`${this.base}/issues/${issueId}/attachments`, formData, this.opts);
  }

  deleteIssueAttachment(issueId: number, attachmentId: number) {
    return this.http.delete<Issue>(
      `${this.base}/issues/${issueId}/attachments/${attachmentId}`,
      this.opts,
    );
  }

  addIssueComment(issueId: number, body: string) {
    return this.http.post<Issue>(`${this.base}/issues/${issueId}/comments`, { body }, this.opts);
  }

  // Users
  getUserSelectOptions() {
    return this.http.get<{ id: number; name: string; email: string }[]>(
      `${this.base}/users/select-options`,
      this.opts,
    );
  }

  getUsers(search?: string, roleId?: number) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (roleId) params = params.set('roleId', roleId);
    return this.http.get<UserRecord[]>(`${this.base}/users`, { ...this.opts, params });
  }

  createUser(data: Record<string, unknown>) {
    return this.http.post<UserRecord>(`${this.base}/users`, data, this.opts);
  }

  updateUser(id: number, data: Record<string, unknown>) {
    return this.http.put<UserRecord>(`${this.base}/users/${id}`, data, this.opts);
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.base}/users/${id}`, this.opts);
  }

  // Roles
  getRoles() {
    return this.http.get<Role[]>(`${this.base}/roles`, this.opts);
  }

  getPermissions() {
    return this.http.get<PermissionMatrix>(`${this.base}/roles/permissions`, this.opts);
  }

  updatePermissions(updates: { roleId: number; menuKey: string; canAccess: boolean }[]) {
    return this.http.put<PermissionMatrix>(`${this.base}/roles/permissions`, { updates }, this.opts);
  }

  // Audit Logs
  getAuditLogs(filters: { from?: string; to?: string; action?: string; performedBy?: string }) {
    let params = new HttpParams();
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.action) params = params.set('action', filters.action);
    if (filters.performedBy) params = params.set('performedBy', filters.performedBy);
    return this.http.get<AuditLog[]>(`${this.base}/audit-logs`, { ...this.opts, params });
  }

  // Settings
  getSettings() {
    return this.http.get<Record<string, unknown>>(`${this.base}/settings`, this.opts);
  }

  getSettingOs() {
    return this.http.get<SettingOs[]>(`${this.base}/settings/os`, this.opts);
  }

  createSettingOs(name: string) {
    return this.http.post<SettingOs>(`${this.base}/settings/os`, { name }, this.opts);
  }

  deleteSettingOs(id: number) {
    return this.http.delete(`${this.base}/settings/os/${id}`, this.opts);
  }

  getSettingProgramNames() {
    return this.http.get<SettingProgramName[]>(`${this.base}/settings/program-names`, this.opts);
  }

  createSettingProgramName(name: string) {
    return this.http.post<SettingProgramName>(
      `${this.base}/settings/program-names`,
      { name },
      this.opts,
    );
  }

  deleteSettingProgramName(id: number) {
    return this.http.delete(`${this.base}/settings/program-names/${id}`, this.opts);
  }

  getSettingCustomerNames() {
    return this.http.get<SettingCustomerName[]>(`${this.base}/settings/customer-names`, this.opts);
  }

  createSettingCustomerName(name: string) {
    return this.http.post<SettingCustomerName>(
      `${this.base}/settings/customer-names`,
      { name },
      this.opts,
    );
  }

  deleteSettingCustomerName(id: number) {
    return this.http.delete(`${this.base}/settings/customer-names/${id}`, this.opts);
  }

  lookupOs() {
    return this.http.get<SettingOs[]>(`${this.base}/settings/lookup/os`, this.opts);
  }

  lookupProgramNames() {
    return this.http.get<SettingProgramName[]>(
      `${this.base}/settings/lookup/program-names`,
      this.opts,
    );
  }

  lookupCustomerNames() {
    return this.http.get<SettingCustomerName[]>(
      `${this.base}/settings/lookup/customer-names`,
      this.opts,
    );
  }
}
