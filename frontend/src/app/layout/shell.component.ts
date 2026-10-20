import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ModulosStateService } from '../core/services/modulos-state.service';
import { Modulo } from '../core/models/modulo.model';
import { IconComponent } from '../shared/icons';

interface NavItem {
  label: string;
  icono: string;
  ruta?: string;
  permiso?: string;
  soloSuperAdmin?: boolean;
  paraSuperAdmin?: boolean;
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
      {
        label: 'Módulos',
        icono: 'settings',
        ruta: '/modulos',
        permiso: 'modulos.ver',
        paraSuperAdmin: true,
      },
      { label: 'Mi empresa', icono: 'building', ruta: '/mi-empresa', permiso: 'empresa.configurar' },
      { label: 'Empresas', icono: 'building', ruta: '/empresas', soloSuperAdmin: true },
    ],
  },
];

const SECCION_OPERACION = 'Operación';

// Permiso necesario para ver cada modulo de sistema en el menu. Un modulo sin
// mapeo (personalizado) se muestra a quien tenga acceso a la seccion.
const PERMISO_POR_CLAVE: Record<string, string> = {
  catalogo: 'catalogos.ver',
  inventario: 'inventario.ver',
  produccion: 'produccion.ver',
  membresia: 'membresia.ver',
  reportes: 'reportes.ver',
  auditorias: 'auditoria.ver',
};

const COLLAPSE_KEY = 'inv_sidebar_collapsed';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="layout" [class.collapsed]="colapsado()" [class.movil-abierto]="movilAbierto()">
      <aside class="sidebar">
        <button class="drawer-close" (click)="cerrarDrawer()" title="Cerrar menú">
          <app-icon name="close" />
        </button>
        <div class="brand">
          <span class="brand-logo">ST</span>
          <span class="brand-text">
            Stockora
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
                    (click)="cerrarDrawer()"
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

          <div class="topsearch">
            <div class="control-icon">
              <app-icon name="search" />
              <input
                class="form-control"
                type="search"
                placeholder="Buscar módulo…"
                [value]="busqueda()"
                (input)="alBuscar($event)"
              />
            </div>
            @if (busqueda().trim().length > 0) {
              <div class="search-panel">
                @if (resultadosBusqueda().length === 0) {
                  <div class="search-empty">Sin resultados para “{{ busqueda() }}”</div>
                } @else {
                  @for (r of resultadosBusqueda(); track r.seccion + r.label) {
                    @if (r.ruta) {
                      <a class="dropdown-item" [routerLink]="r.ruta" (click)="limpiarBusqueda()">
                        <app-icon [name]="r.icono" />
                        <span class="search-label">{{ r.label }}</span>
                        <span class="search-sec">{{ r.seccion }}</span>
                      </a>
                    } @else {
                      <div class="dropdown-item disabled">
                        <app-icon [name]="r.icono" />
                        <span class="search-label">{{ r.label }}</span>
                        <span class="search-sec">Pronto</span>
                      </div>
                    }
                  }
                }
              </div>
            }
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

      <div class="sidebar-overlay" [class.visible]="movilAbierto()" (click)="cerrarDrawer()"></div>

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
  private readonly modulosState = inject(ModulosStateService);

  readonly user = this.auth.user;
  readonly esSuperAdmin = this.auth.isSuperAdmin;
  readonly esOperativo = this.auth.esOperativo;
  readonly puedeConfigEmpresa = () => this.auth.hasPermiso('empresa.configurar');

  readonly userAbierto = signal(false);
  readonly notifAbierto = signal(false);
  readonly movilAbierto = signal(false);
  readonly busqueda = signal('');

  // El usuario operativo (vendedor) solo ve Inicio: se oculta toda la seccion
  // de operacion. Para el resto se filtra cada modulo por su permiso.
  readonly modulosOperacion = computed<NavItem[]>(() => {
    if (this.esOperativo()) return [];
    return this.modulosState
      .menu()
      .filter((modulo) => {
        if (modulo.tipo !== 'SISTEMA') return true;
        const permiso = PERMISO_POR_CLAVE[modulo.clave];
        return permiso ? this.auth.hasPermiso(permiso) : false;
      })
      .map(toNavItem);
  });

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

  readonly secciones = computed<NavSeccion[]>(() => {
    const visibles = NAV.map((seccion) => {
      const items = seccion.items.filter((item) => {
        if (item.soloSuperAdmin) return this.esSuperAdmin();
        if (item.permiso) {
          if (this.auth.hasPermiso(item.permiso)) return true;
          return item.paraSuperAdmin ? this.esSuperAdmin() : false;
        }
        return true;
      });
      return { titulo: seccion.titulo, items };
    }).filter((seccion) => seccion.items.length > 0);

    const operacion = this.modulosOperacion();
    if (operacion.length === 0) {
      return visibles;
    }
    return [...visibles, { titulo: SECCION_OPERACION, items: operacion }];
  });

  readonly resultadosBusqueda = computed<(NavItem & { seccion: string })[]>(() => {
    const termino = this.busqueda().trim().toLowerCase();
    if (!termino) return [];
    return this.secciones()
      .flatMap((seccion) => seccion.items.map((item) => ({ ...item, seccion: seccion.titulo })))
      .filter((item) => item.label.toLowerCase().includes(termino))
      .slice(0, 8);
  });

  readonly tituloModulo = computed(() => {
    const actual = this.url();
    for (const seccion of this.secciones()) {
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
        this.cerrarDrawer();
      });

    setInterval(() => this.ahora.set(new Date()), 1000);

    this.modulosState.cargar();
  }

  toggleSidebar(): void {
    if (this.esMovil()) {
      this.movilAbierto.update((v) => !v);
      return;
    }
    const nuevo = !this.colapsado();
    this.colapsado.set(nuevo);
    localStorage.setItem(COLLAPSE_KEY, nuevo ? '1' : '0');
  }

  cerrarDrawer(): void {
    if (this.movilAbierto()) this.movilAbierto.set(false);
  }

  private esMovil(): boolean {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.esMovil() && this.movilAbierto()) this.movilAbierto.set(false);
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

  alBuscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
    this.cerrarMenus();
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  @HostListener('document:click', ['$event'])
  onClickFuera(event: MouseEvent): void {
    const objetivo = event.target as HTMLElement;
    if (!objetivo.closest('.topsearch')) this.busqueda.set('');
  }

  salir(): void {
    this.cerrarMenus();
    this.auth.cerrarSesion();
  }
}

function toNavItem(modulo: Modulo): NavItem {
  const implementado = modulo.implementado && !!modulo.ruta;
  return {
    label: modulo.nombre,
    icono: modulo.icono,
    ruta: implementado ? (modulo.ruta as string) : undefined,
    pronto: !implementado,
  };
}
