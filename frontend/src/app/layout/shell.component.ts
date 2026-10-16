import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { IconComponent } from '../shared/icons';

interface NavItem {
  label: string;
  icono: string;
  ruta?: string;
  permiso?: string;
  soloSuperAdmin?: boolean;
  pronto?: boolean;
}

interface NavSeccion {
  titulo: string;
  items: NavItem[];
}

const NAV: NavSeccion[] = [
  {
    titulo: 'Principal',
    items: [{ label: 'Inicio', icono: 'dashboard', ruta: '/dashboard' }],
  },
  {
    titulo: 'Administración',
    items: [
      { label: 'Usuarios', icono: 'users', ruta: '/usuarios', permiso: 'usuarios.ver' },
      { label: 'Roles y permisos', icono: 'shield', ruta: '/roles', permiso: 'roles.ver' },
      { label: 'Mi empresa', icono: 'building', ruta: '/mi-empresa', permiso: 'empresa.configurar' },
      { label: 'Empresas', icono: 'building', ruta: '/empresas', soloSuperAdmin: true },
    ],
  },
  {
    titulo: 'Operación',
    items: [
      { label: 'Catálogos', icono: 'box', permiso: 'catalogos.ver', pronto: true },
      { label: 'Inventario', icono: 'box', permiso: 'inventario.ver', pronto: true },
      { label: 'Cargues', icono: 'truck', permiso: 'cargues.ver.todos', pronto: true },
      { label: 'Botellones', icono: 'bottle', permiso: 'botellones.ver.todos', pronto: true },
      { label: 'Producción', icono: 'factory', permiso: 'produccion.ver', pronto: true },
      { label: 'Mermas', icono: 'warning', permiso: 'mermas.registrar', pronto: true },
      { label: 'Reportes', icono: 'report', permiso: 'reportes.ver', pronto: true },
      { label: 'Auditoría', icono: 'audit', permiso: 'auditoria.ver', pronto: true },
    ],
  },
];

const COLLAPSE_KEY = 'inv_sidebar_collapsed';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="layout" [class.collapsed]="colapsado()">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-logo">IG</span>
          <span class="brand-text">
            Inventario General
            <small>Panel de gestión</small>
          </span>
        </div>

        <nav class="nav">
          @for (seccion of secciones(); track seccion.titulo) {
            @if (seccion.items.length) {
              <div class="nav-seccion">{{ seccion.titulo }}</div>
              @for (item of seccion.items; track item.label) {
                @if (item.pronto) {
                  <div class="nav-item disabled" [title]="item.label + ' (próximamente)'">
                    <app-icon [name]="item.icono" />
                    <span class="nav-label">{{ item.label }}</span>
                    <span class="pronto-tag">Pronto</span>
                  </div>
                } @else {
                  <a
                    class="nav-item"
                    [routerLink]="item.ruta"
                    routerLinkActive="active"
                    [title]="item.label"
                  >
                    <app-icon [name]="item.icono" />
                    <span class="nav-label">{{ item.label }}</span>
                  </a>
                }
              }
            }
          }
        </nav>

        <div class="sidebar-footer">
          <app-icon name="bolt" />
          <span class="nav-label">v1.0 · Fase 3</span>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <div class="topbar-left">
            <button class="icon-btn" (click)="toggleSidebar()" title="Menú">
              <app-icon name="menu" />
            </button>
            <div class="breadcrumb">
              <span class="crumb-root">Panel</span>
              <app-icon name="chevron" class="crumb-sep" />
              <span class="crumb-current">{{ tituloModulo() }}</span>
            </div>
          </div>

          <div class="topbar-right">
            <div class="clock">
              <app-icon name="clock" />
              <span>{{ hora() }}</span>
            </div>

            <div class="dropdown">
              <button class="icon-btn bell" (click)="toggleNotif($event)" title="Notificaciones">
                <app-icon name="bell" />
                <span class="dot-badge"></span>
              </button>
              @if (notifAbierto()) {
                <div class="dropdown-menu notif">
                  <div class="notif-head">Notificaciones</div>
                  <div class="empty-notif">
                    <app-icon name="bell" />
                    <span>Sin notificaciones por ahora</span>
                  </div>
                </div>
              }
            </div>

            <div class="dropdown">
              <button class="user-btn" (click)="toggleUser($event)">
                <span class="avatar avatar-sm">{{ iniciales() }}</span>
                <span class="user-meta">
                  <span class="user-name">{{ user()?.email }}</span>
                  <span class="user-role">{{ esSuperAdmin() ? 'Superadmin' : 'Empresa' }}</span>
                </span>
                <app-icon name="chevron" />
              </button>

              @if (userAbierto()) {
                <div class="dropdown-menu">
                  <div class="dd-user">
                    <span class="avatar">{{ iniciales() }}</span>
                    <div>
                      <div class="dd-email">{{ user()?.email }}</div>
                      <span class="badge" [class.badge-primary]="esSuperAdmin()" [class.badge-muted]="!esSuperAdmin()">
                        {{ esSuperAdmin() ? 'Superadministrador' : 'Usuario de empresa' }}
                      </span>
                    </div>
                  </div>
                  <div class="dropdown-divider"></div>
                  @if (puedeConfigEmpresa()) {
                    <a class="dropdown-item" routerLink="/mi-empresa" (click)="cerrarMenus()">
                      <app-icon name="building" /> Mi empresa
                    </a>
                  }
                  <button class="dropdown-item danger" (click)="salir()">
                    <app-icon name="logout" /> Cerrar sesión
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <main class="content">
          <router-outlet />
        </main>
      </div>

      @if (userAbierto() || notifAbierto()) {
        <div class="menu-overlay" (click)="cerrarMenus()"></div>
      }
    </div>
  `,
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly esSuperAdmin = this.auth.isSuperAdmin;
  readonly puedeConfigEmpresa = () => this.auth.hasPermiso('empresa.configurar');

  readonly userAbierto = signal(false);
  readonly notifAbierto = signal(false);

  readonly colapsado = signal(localStorage.getItem(COLLAPSE_KEY) === '1');

  private readonly url = signal(this.router.url);
  private readonly ahora = signal(new Date());

  readonly hora = computed(() =>
    this.ahora().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  );

  readonly iniciales = computed(() => {
    const email = this.user()?.email ?? '';
    return email.slice(0, 2).toUpperCase();
  });

  readonly secciones = computed<NavSeccion[]>(() =>
    NAV.map((seccion) => ({
      titulo: seccion.titulo,
      items: seccion.items.filter((item) => {
        if (item.soloSuperAdmin) return this.esSuperAdmin();
        if (item.permiso) return this.auth.hasPermiso(item.permiso);
        return true;
      }),
    })).filter((seccion) => seccion.items.length > 0),
  );

  readonly tituloModulo = computed(() => {
    const actual = this.url();
    for (const seccion of NAV) {
      for (const item of seccion.items) {
        if (item.ruta && actual.startsWith(item.ruta)) return item.label;
      }
    }
    return 'Inicio';
  });

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.url.set(this.router.url);
        this.cerrarMenus();
      });

    setInterval(() => this.ahora.set(new Date()), 1000);
  }

  toggleSidebar(): void {
    const nuevo = !this.colapsado();
    this.colapsado.set(nuevo);
    localStorage.setItem(COLLAPSE_KEY, nuevo ? '1' : '0');
  }

  toggleUser(event: Event): void {
    event.stopPropagation();
    this.notifAbierto.set(false);
    this.userAbierto.update((v) => !v);
  }

  toggleNotif(event: Event): void {
    event.stopPropagation();
    this.userAbierto.set(false);
    this.notifAbierto.update((v) => !v);
  }

  cerrarMenus(): void {
    this.userAbierto.set(false);
    this.notifAbierto.set(false);
  }

  salir(): void {
    this.cerrarMenus();
    this.auth.cerrarSesion();
  }
}
