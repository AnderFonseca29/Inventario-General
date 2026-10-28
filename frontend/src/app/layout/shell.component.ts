import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  Data,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { ModulosStateService } from '../core/services/modulos-state.service';
import { Modulo } from '../core/models/modulo.model';
import { IconComponent } from '../shared/icons';
import { CambiarContrasenaComponent } from '../features/auth/cambiar-contrasena.component';

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
    items: [{ label: 'Inicio', icono: 'dashboard', ruta: '/app/dashboard' }],
  },
  {
    titulo: 'Administración',
    items: [
      { label: 'Usuarios', icono: 'users', ruta: '/app/usuarios', permiso: 'usuarios.ver' },
      { label: 'Roles y permisos', icono: 'shield', ruta: '/app/roles', permiso: 'roles.ver' },
      {
        label: 'Módulos',
        icono: 'settings',
        ruta: '/app/modulos',
        permiso: 'modulos.ver',
        paraSuperAdmin: true,
      },
      { label: 'Mi empresa', icono: 'building', ruta: '/app/mi-empresa', permiso: 'empresa.configurar' },
      { label: 'Empresas', icono: 'building', ruta: '/app/empresas', soloSuperAdmin: true },
    ],
  },
];

const SECCION_OPERACION = 'Operación';

// Permiso necesario para ver cada modulo de sistema en el menu. Un modulo sin
// mapeo (personalizado) se muestra a quien tenga acceso a la seccion. El valor
// puede ser una lista: basta con poseer alguno de los permisos.
const PERMISO_POR_CLAVE: Record<string, string | string[]> = {
  catalogo: 'catalogos.ver',
  inventario: 'inventario.ver',
  cargues: ['cargues.ver.propios', 'cargues.ver.todos'],
  produccion: 'produccion.ver',
  membresia: 'membresia.ver',
  reportes: 'reportes.ver',
  auditorias: 'auditoria.ver',
};

// Modulos reservados al dueno de la empresa: los demas usuarios no los ven en
// el menu ni pueden abrirlos por URL (el backend tambien los rechaza).
const MODULOS_SOLO_DUENO = new Set(['membresia']);

// Preferencia del menu lateral:
//  - 'auto': el menu se contrae solo al entrar a un formulario
//  - 'contraido' / 'expandido': el usuario decide y no se toca solo
type PreferenciaMenu = 'auto' | 'contraido' | 'expandido';

const COLLAPSE_KEY = 'inv_sidebar_collapsed';

function leerPreferencia(): PreferenciaMenu {
  const guardado = localStorage.getItem(COLLAPSE_KEY);
  if (guardado === '1') return 'contraido';
  if (guardado === '0') return 'expandido';
  return 'auto';
}

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    CambiarContrasenaComponent,
  ],
  template: `
    <div
      class="layout"
      [class.collapsed]="colapsado()"
      [class.expandido]="preferenciaMenu() === 'expandido'"
      [class.movil-abierto]="movilAbierto()"
      [class.formulario-abierto]="formularioAbierto()"
    >
      <aside class="sidebar" [attr.aria-hidden]="esMovil() ? !movilAbierto() : null">
        <button class="drawer-close" (click)="cerrarDrawer()" title="Cerrar menú" aria-label="Cerrar menú">
          <app-icon name="close" />
        </button>
        <div class="brand">
          <span class="brand-logo" aria-hidden="true">ST</span>
          <span class="brand-text">
            Stockora
            <small>Panel de gestión</small>
          </span>
        </div>

        <nav class="nav" aria-label="Navegación principal">
          @for (seccion of secciones(); track seccion.titulo) {
            @if (seccion.items.length) {
              <div class="nav-seccion">{{ seccion.titulo }}</div>
              @for (item of seccion.items; track item.label) {
                <a
                  class="nav-item"
                  [routerLink]="item.ruta"
                  routerLinkActive="active"
                  [title]="item.label"
                  (click)="cerrarDrawer()"
                  [attr.aria-current]="isActive(item) ? 'page' : null"
                >
                  <app-icon [name]="item.icono" />
                  <span class="nav-label">{{ item.label }}</span>
                </a>
              }
            }
          }
        </nav>

        <div class="sidebar-footer">
          <app-icon name="bolt" />
          <span class="nav-label">Versión 1.0</span>
        </div>
      </aside>


      <div class="main">
        <header class="topbar">
          <div class="topbar-left">
          <button
            class="icon-btn sidebar-toggle"
            (click)="toggleSidebar()"
            [title]="colapsado() ? 'Expandir el menú' : 'Contraer el menú'"
            [attr.aria-label]="colapsado() ? 'Expandir el menú' : 'Contraer el menú'"
            [attr.aria-expanded]="!esMovil() ? !colapsado() : movilAbierto()"
          >
            <app-icon [name]="colapsado() ? 'chevron' : 'menu'" />
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
                placeholder="Buscar módulo⬦"
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
                      <a class="dropdown-item" [routerLink]="r.ruta" (click)="busqueda.set('')">
                        <app-icon [name]="r.icono" />
                        <span class="search-label">{{ r.label }}</span>
                        <span class="search-sec">{{ r.seccion }}</span>
                      </a>
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
              <button class="icon-btn bell" (click)="toggleNotif($event)" title="Notificaciones" aria-label="Notificaciones" [attr.aria-expanded]="notifAbierto()">
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
              <button class="user-btn" (click)="toggleUser($event)" aria-haspopup="menu" [attr.aria-expanded]="userAbierto()">
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
                    <a class="dropdown-item" routerLink="/app/mi-empresa" (click)="cerrarMenus()">
                      <app-icon name="building" /> Mi empresa
                    </a>
                  }
                  <button class="dropdown-item" (click)="abrirCambioContrasena()">
                    <app-icon name="key" /> Cambiar contraseña
                  </button>
                  <button class="dropdown-item danger" (click)="salir()">
                    <app-icon name="logout" /> Cerrar sesión
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <main class="content" #contenido>
          <router-outlet />
        </main>
      </div>

      <div class="sidebar-overlay" [class.visible]="movilAbierto()" (click)="cerrarDrawer()" tabindex="-1" aria-hidden="true"></div>

      @if (userAbierto() || notifAbierto()) {
        <div class="menu-overlay" (click)="cerrarMenus()" tabindex="-1" aria-hidden="true"></div>
      }
    </div>

    <app-cambiar-contrasena [(abierto)]="modalContrasena" />
  `,
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnDestroy, AfterViewInit {
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
  readonly modalContrasena = signal(false);

  // El usuario operativo (vendedor) solo ve Inicio: se oculta toda la seccion
  // de operación. Para el resto se filtra cada módulo por su permiso.
  // Los módulos sin destino (no implementados o sin ruta) NO se muestran: en
  // producción el menú no debe tener entradas que no llevan a ninguna parte.
  // El administrador los sigue viendo en la pantalla de Módulos.
  readonly modulosOperacion = computed<NavItem[]>(() => {
    if (this.esOperativo()) return [];
    return this.modulosState
      .menu()
      .filter((modulo) => {
        if (modulo.tipo !== 'SISTEMA') return true;
        if (MODULOS_SOLO_DUENO.has(modulo.clave) && !this.auth.esPropietario()) {
          return false;
        }
        const permiso = PERMISO_POR_CLAVE[modulo.clave];
        if (!permiso) return false;
        return Array.isArray(permiso)
          ? this.auth.hasAlgunPermiso(permiso)
          : this.auth.hasPermiso(permiso);
      })
      .map(toNavItem)
      .filter((item) => !item.pronto);
  });

  private readonly url = signal(this.router.url);
  private readonly ahora = signal(new Date());

  readonly hora = computed(() =>
    this.ahora().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  );

  // Preferencia guardada del usuario sobre el menu lateral.
  readonly preferenciaMenu = signal<PreferenciaMenu>(leerPreferencia());

  // Datos de la ruta activa: las rutas marcadas con data layout 'form' son
  // paginas de formulario y contraen el menu lateral por si solas.
  private readonly datosRuta = signal<Data | undefined>(undefined);

  readonly esRutaFormulario = computed(
    () => this.datosRuta()?.['layout'] === 'form',
  );

  // Un modal con formulario esta abierto: lo detecta un MutationObserver sobre
  // el area de contenido, porque los modales usan .modal-backdrop.
  private readonly modalAbierto = signal(false);
  private observador?: MutationObserver;
  private readonly contenido = viewChild<ElementRef<HTMLElement>>('contenido');

  readonly formularioAbierto = computed(
    () => this.esRutaFormulario() || this.modalAbierto(),
  );

  // Estado efectivo del menu lateral. El usuario puede fijar la preferencia
  // con el boton: en modo 'auto' se contrae solo al abrir un formulario.
  readonly colapsado = computed(() => {
    const preferencia = this.preferenciaMenu();
    if (preferencia === 'contraido') return true;
    if (preferencia === 'expandido') return false;
    return this.formularioAbierto();
  });

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
        this.datosRuta.set(this.datosRutaActiva());
        this.cerrarMenus();
        this.cerrarDrawer();
      });

    setInterval(() => this.ahora.set(new Date()), 1000);

    this.modulosState.cargar();
  }

  ngAfterViewInit(): void {
    const el = this.contenido()?.nativeElement;
    if (!el) return;
    this.actualizarModal();
    this.observador = new MutationObserver(() => this.actualizarModal());
    this.observador.observe(el, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }

  private actualizarModal(): void {
    const el = this.contenido()?.nativeElement;
    if (!el) {
      this.modalAbierto.set(false);
      return;
    }
    this.modalAbierto.set(el.querySelector('.modal-backdrop') !== null);
  }

  toggleSidebar(): void {
    if (this.esMovil()) {
      this.movilAbierto.update((v) => !v);
      return;
    }
    // El boton invierte el estado visible del menu y deja fijada la
    // preferencia del usuario (deja de moverse solo).
    const nuevo: PreferenciaMenu = this.colapsado() ? 'expandido' : 'contraido';
    this.preferenciaMenu.set(nuevo);
    localStorage.setItem(COLLAPSE_KEY, nuevo === 'contraido' ? '1' : '0');
  }

  // Datos de la hoja de ruta mas profunda activa (las rutas hijas heredan los
  // datos de su padre).
  private datosRutaActiva(): Data | undefined {
    let activa = this.router.routerState.snapshot.root;
    while (activa.firstChild) {
      activa = activa.firstChild;
    }
    return activa.data;
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

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.movilAbierto()) this.cerrarDrawer();
    if (this.userAbierto() || this.notifAbierto()) this.cerrarMenus();
  }

  isActive(item: NavItem): boolean {
    if (!item.ruta) return false;
    return this.url().startsWith(item.ruta);
  }

  salir(): void {
    this.cerrarMenus();
    this.auth.cerrarSesion();
  }

  abrirCambioContrasena(): void {
    this.cerrarMenus();
    this.modalContrasena.set(true);
  }
}

function toNavItem(modulo: Modulo): NavItem {
  const implementado = modulo.implementado && !!modulo.ruta;
  return {
    label: modulo.nombre,
    icono: modulo.icono,
    ruta: implementado ? `/app${modulo.ruta as string}` : undefined,
    pronto: !implementado,
  };
}
