import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Program, InstallList, UserRecord, AuditLog, PermissionMatrix, Role } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  private opts = { withCredentials: true as const };

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
}
