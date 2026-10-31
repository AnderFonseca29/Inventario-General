import { Routes } from '@angular/router';
import {
  authGuard,
  permisoAlgunoGuard,
  permisoGuard,
  permisoOSuperAdminGuard,
  propietarioGuard,
  superAdminGuard,
} from './core/guards/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/registro.component').then((m) => m.RegistroComponent),
  },
  {
    path: 'app',
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
        path: 'modulos',
        loadComponent: () =>
          import('./features/modulos/modulos.component').then(
            (m) => m.ModulosComponent,
          ),
        canActivate: [permisoOSuperAdminGuard('modulos.ver')],
      },
      {
        path: 'catalogos',
        loadComponent: () =>
          import('./features/catalogos/catalogos.component').then(
            (m) => m.CatalogosComponent,
          ),
        canActivate: [permisoGuard('catalogos.ver')],
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./features/inventario/inventario.component').then(
            (m) => m.InventarioComponent,
          ),
        canActivate: [permisoGuard('inventario.ver')],
      },
      {
        path: 'cargues',
        loadComponent: () =>
          import('./features/cargues/cargues.component').then(
            (m) => m.CarguesComponent,
          ),
        canActivate: [
          permisoAlgunoGuard(['cargues.ver.propios', 'cargues.ver.todos']),
        ],
      },
      {
        path: 'produccion',
        loadComponent: () =>
          import('./features/produccion/produccion.component').then(
            (m) => m.ProduccionComponent,
          ),
        canActivate: [permisoGuard('produccion.ver')],
      },
      {
        path: 'membresia',
        loadComponent: () =>
          import('./features/membresia/membresia.component').then(
            (m) => m.MembresiaComponent,
          ),
        canActivate: [permisoGuard('membresia.ver'), propietarioGuard],
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/reportes/reportes.component').then(
            (m) => m.ReportesComponent,
          ),
        canActivate: [permisoGuard('reportes.ver')],
      },
      {
        path: 'auditorias',
        loadComponent: () =>
          import('./features/auditorias/auditorias.component').then(
            (m) => m.AuditoriasComponent,
          ),
        canActivate: [permisoGuard('auditoria.ver')],
      },
      {
        path: 'mi-empresa',
        loadComponent: () =>
          import('./features/empresas/mi-empresa.component').then(
            (m) => m.MiEmpresaComponent,
          ),
        canActivate: [permisoGuard('empresa.configurar')],
        // Pagina de formulario: el menu lateral se contrae solo al entrar.
        data: { layout: 'form' },
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
  {
    path: 'derechos',
    loadComponent: () =>
      import('./features/legal/derechos.component').then(
        (m) => m.DerechosComponent,
      ),
  },
  {
    path: 'legal',
    loadComponent: () =>
      import('./features/legal/centro-legal.component').then(
        (m) => m.CentroLegalComponent,
      ),
  },
  {
    path: 'legal/:clave',
    loadComponent: () =>
      import('./features/legal/documento-legal.component').then(
        (m) => m.DocumentoLegalComponent,
      ),
  },
  {
    path: 'contacto',
    loadComponent: () =>
      import('./features/legal/contacto.component').then(
        (m) => m.ContactoComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/no-encontrado/no-encontrado.component').then(
        (m) => m.NoEncontradoComponent,
      ),
  },
];
