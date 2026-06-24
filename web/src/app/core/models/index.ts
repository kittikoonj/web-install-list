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

export interface Program {
  id: number;
  name: string;
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

export interface InstallListCustomer {
  id?: number;
  listId?: number;
  customerName: string;
  installerName?: string | null;
  installedAt: string;
  testCaseUrl?: string | null;
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
  programCount?: number;
  customerCount?: number;
}

export interface AuditLog {
  id: number;
  action: 'create' | 'update' | 'delete';
  objectType: string;
  objectId?: number;
  objectName?: string;
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
