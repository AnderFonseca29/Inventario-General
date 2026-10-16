import { Routes } from '@angular/router';
import { authGuard, permisoGuard, superAdminGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/usuarios/usuarios.component').then(
            (m) => m.UsuariosComponent,
          ),
        canActivate: [permisoGuard('usuarios.ver')],
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/roles/roles.component').then(
            (m) => m.RolesComponent,
          ),
        canActivate: [permisoGuard('roles.ver')],
      },
      {
        path: 'mi-empresa',
        loadComponent: () =>
          import('./features/empresas/mi-empresa.component').then(
            (m) => m.MiEmpresaComponent,
          ),
        canActivate: [permisoGuard('empresa.configurar')],
      },
      {
        path: 'empresas',
        loadComponent: () =>
          import('./features/empresas/empresas.component').then(
            (m) => m.EmpresasComponent,
          ),
        canActivate: [superAdminGuard],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
