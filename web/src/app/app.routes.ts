import { Routes } from '@angular/router';
import { authGuard, guestGuard, menuGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'install-lists', pathMatch: 'full' },
      {
        path: 'install-lists',
        loadComponent: () =>
          import('./pages/install-lists/install-lists.component').then(
            (m) => m.InstallListsComponent,
          ),
        canActivate: [menuGuard('install_lists')],
      },
      {
        path: 'programs',
        loadComponent: () =>
          import('./pages/programs/programs.component').then(
            (m) => m.ProgramsComponent,
          ),
        canActivate: [menuGuard('programs')],
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.component').then((m) => m.UsersComponent),
        canActivate: [menuGuard('users')],
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles/roles.component').then((m) => m.RolesComponent),
        canActivate: [menuGuard('roles')],
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./pages/audit-log/audit-log.component').then(
            (m) => m.AuditLogComponent,
          ),
        canActivate: [menuGuard('audit_log')],
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then(
            (m) => m.SettingsComponent,
          ),
        canActivate: [menuGuard('settings')],
      },
    ],
  },
  { path: '**', redirectTo: 'install-lists' },
];
