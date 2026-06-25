export const MENU_KEYS = [
  'install_lists',
  'issues',
  'programs',
  'users',
  'roles',
  'audit_log',
  'settings',
] as const;

export type MenuKey = (typeof MENU_KEYS)[number];

export const MENU_LABELS: Record<MenuKey, string> = {
  install_lists: 'Install Lists',
  issues: 'Issues',
  programs: 'Programs',
  users: 'Users',
  roles: 'Roles',
  audit_log: 'Audit Log',
  settings: 'ตั้งค่า',
};

export const SUPER_ADMIN_ROLE = 'super_admin';
