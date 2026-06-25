export const ICON_PALETTE = [
  { name: 'teal', bg: '#E1F5EE', fg: '#0F6E56' },
  { name: 'purple', bg: '#EEEDFE', fg: '#3C3489' },
  { name: 'blue', bg: '#E6F1FB', fg: '#0C447C' },
  { name: 'green', bg: '#EAF3DE', fg: '#27500A' },
  { name: 'red', bg: '#FCEBEB', fg: '#A32D2D' },
  { name: 'coral', bg: '#FAECE7', fg: '#993C1D' },
  { name: 'amber', bg: '#FAEEDA', fg: '#633806' },
  { name: 'pink', bg: '#FBEAF0', fg: '#993556' },
  { name: 'gray', bg: '#F1EFE8', fg: '#444441' },
];

export const METHOD_BADGE: Record<string, { bg: string; fg: string; label: string }> = {
  offline: { bg: '#F1EFE8', fg: '#444441', label: 'offline' },
  docker: { bg: '#E6F1FB', fg: '#0C447C', label: 'docker' },
  online: { bg: '#EAF3DE', fg: '#27500A', label: 'online' },
};

export const ROLE_BADGE: Record<string, { bg: string; fg: string }> = {
  super_admin: { bg: '#EEEDFE', fg: '#3C3489' },
  manager: { bg: '#E6F1FB', fg: '#0C447C' },
  user: { bg: '#EAF3DE', fg: '#27500A' },
  viewer: { bg: '#F1EFE8', fg: '#444441' },
};

export const ISSUE_STATUS: Record<
  string,
  { bg: string; fg: string; label: string }
> = {
  open: { bg: '#FCEBEB', fg: '#A32D2D', label: 'open' },
  in_progress: { bg: '#FAEEDA', fg: '#633806', label: 'in progress' },
  resolved: { bg: '#EAF3DE', fg: '#27500A', label: 'resolved' },
  closed: { bg: '#F1EFE8', fg: '#444441', label: 'closed' },
};

export const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', section: 'หลัก', route: '/dashboard', icon: 'ti-dashboard' },
  { key: 'install_lists', label: 'Install Lists', section: 'หลัก', route: '/install-lists', icon: 'ti-list-check' },
  { key: 'issues', label: 'Issues', section: 'หลัก', route: '/issues', icon: 'ti-bug' },
  { key: 'programs', label: 'Programs', section: 'หลัก', route: '/programs', icon: 'ti-apps' },
  { key: 'users', label: 'Users', section: 'จัดการ', route: '/users', icon: 'ti-users' },
  { key: 'roles', label: 'Roles', section: 'จัดการ', route: '/roles', icon: 'ti-shield' },
  { key: 'audit_log', label: 'Audit Log', section: 'ระบบ', route: '/audit-log', icon: 'ti-history' },
  { key: 'settings', label: 'ตั้งค่า', section: 'ระบบ', route: '/settings', icon: 'ti-settings', adminBadge: true },
];

export const ICON_CATEGORIES: Record<string, string[]> = {
  Database: [
    'ti-database', 'ti-database-export', 'ti-database-import', 'ti-server',
    'ti-table', 'ti-columns', 'ti-sql',
  ],
  Server: [
    'ti-server-2', 'ti-cloud', 'ti-cpu', 'ti-device-desktop',
    'ti-box', 'ti-package', 'ti-container',
  ],
  Dev: [
    'ti-code', 'ti-brand-git', 'ti-terminal-2', 'ti-api',
    'ti-git-branch', 'ti-bug', 'ti-test-pipe',
  ],
  Cloud: [
    'ti-cloud-upload', 'ti-cloud-download', 'ti-world', 'ti-network',
    'ti-router', 'ti-wifi', 'ti-cloud-computing',
  ],
  Network: [
    'ti-network', 'ti-access-point', 'ti-antenna', 'ti-link',
    'ti-share', 'ti-arrows-exchange', 'ti-plug',
  ],
  'อื่นๆ': [
    'ti-settings', 'ti-lock', 'ti-key', 'ti-shield',
    'ti-file', 'ti-folder', 'ti-tools', 'ti-puzzle',
  ],
};

export const ROLE_DESCRIPTIONS = [
  { role: 'Super Admin', desc: 'เข้าถึงทุกเมนู จัดการ users, roles, settings' },
  { role: 'Manager', desc: 'Install Lists, Issues, Programs, Audit Log' },
  { role: 'User', desc: 'Install Lists, Issues' },
  { role: 'Viewer', desc: 'ดู Install Lists, Issues' },
];
