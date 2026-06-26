export interface Role {
  id: number;
  name: string;
  label: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  role: Role;
  status: 'active' | 'inactive';
}

export interface MenuPermissions {
  [key: string]: boolean;
}

export interface AuthResponse {
  user: User;
  menus: MenuPermissions;
}

export type InstallMethod = 'offline' | 'docker' | 'online';

export interface SettingOs {
  id: number;
  name: string;
  sortOrder?: number;
  createdAt?: string;
}

export interface SettingProgramName {
  id: number;
  name: string;
  sortOrder?: number;
  createdAt?: string;
}

export interface SettingCustomerName {
  id: number;
  name: string;
  sortOrder?: number;
  createdAt?: string;
}

export interface Program {
  id: number;
  name: string;
  osId?: number | null;
  os?: SettingOs | null;
  version?: string | null;
  githubUrl: string;
  methods: InstallMethod[];
  icon: string;
  iconBg: string;
  iconFg: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  isDelete: number;
  isActive: number;
  deletedBy?: string;
  deletedAt?: string;
}

export interface InstallListItem {
  id?: number;
  listId?: number;
  programId: number;
  method: InstallMethod;
  program?: Program;
}

export interface CustomerInstall {
  customerId: number;
  itemId: number;
  isInstalled: boolean;
}

export interface InstallListCustomer {
  id?: number;
  listId?: number;
  customerName: string;
  installerName?: string | null;
  installedAt: string;
  testCaseUrl?: string | null;
}

export interface InstallListDocument {
  id: number;
  listId: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: string | null;
  createdAt: string;
  url: string;
}

export interface InstallList {
  id: number;
  name: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  isDelete: number;
  deletedBy?: string;
  deletedAt?: string;
  items?: InstallListItem[];
  customers?: InstallListCustomer[];
  customerInstalls?: CustomerInstall[];
  documents?: InstallListDocument[];
  issues?: Issue[];
  programCount?: number;
  customerCount?: number;
  incompleteCustomerCount?: number;
  issueCount?: number;
}

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface IssueAttachment {
  id: number;
  issueId: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileType: 'image' | 'file';
  fileSize: number;
  url: string;
  createdAt: string;
}

export interface Issue {
  id: number;
  installListId: number;
  installList?: InstallList;
  customerName?: string | null;
  title: string;
  description?: string | null;
  status: IssueStatus;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  isDelete: number;
  deletedBy?: string;
  deletedAt?: string;
  attachments?: IssueAttachment[];
  comments?: IssueComment[];
}

export interface IssueComment {
  id: number;
  issueId: number;
  body: string;
  createdBy?: string;
  createdAt: string;
}

export interface DashboardIncompleteList {
  id: number;
  name: string;
  incompleteCustomerCount: number;
  customerCount: number;
  progressPercent: number;
  updatedAt: string;
}

export interface DashboardStats {
  totalLists: number;
  activeLists: number;
  totalPrograms: number;
  activePrograms: number;
  inactivePrograms: number;
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  closedIssues: number;
  totalUsers: number;
  totalCustomers: number;
  totalIncompleteCustomers: number;
  listsWithIncomplete: number;
  overallProgressPercent: number;
  completedCustomers: number;
  incompleteLists: DashboardIncompleteList[];
  recentLists: { id: number; name: string; updatedAt: string }[];
  recentIssues: DashboardIssueSummary[];
  pendingIssues: DashboardIssueSummary[];
  recentAuditLogs: DashboardAuditEntry[];
}

export interface DashboardIssueSummary {
  id: number;
  title: string;
  status: string;
  customerName?: string | null;
  installListName?: string;
  updatedAt: string;
}

export interface DashboardAuditEntry {
  id: number;
  action: 'create' | 'update' | 'delete';
  objectType: string;
  objectName?: string | null;
  details?: string | null;
  performedBy?: string | null;
  performedAt: string;
}

export interface AuditLog {
  id: number;
  action: 'create' | 'update' | 'delete';
  objectType: string;
  objectId?: number;
  objectName?: string;
  details?: string;
  performedBy?: string;
  performedAt: string;
}

export interface PermissionMatrix {
  menus: { key: string; label: string }[];
  roles: Role[];
  matrix: Record<number, Record<string, boolean>>;
}

export interface UserRecord extends User {
  isDelete?: number;
  deletedBy?: string;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
