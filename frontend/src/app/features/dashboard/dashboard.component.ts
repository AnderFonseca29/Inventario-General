import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { RolesService } from '../../core/services/roles.service';
import { EmpresasService } from '../../core/services/empresas.service';
import { ResumenService } from '../../core/services/resumen.service';
import { Empresa } from '../../core/models/empresa.model';
import { MiResumen } from '../../core/models/resumen.model';
import { IconComponent } from '../../shared/icons';

interface Acceso {
  titulo: string;
  descripcion: string;
  ruta: string;
  icono: string;
  permiso?: string;
  soloSuperAdmin?: boolean;
}

interface ModuloPermisos {
  modulo: string;
  total: number;
  porcentaje: number;
}

interface Kpi {
  label: string;
  valor: string | number;
  icono: string;
  tint: string;
  sub: string;
}

const ACCESOS: Acceso[] = [
  {
    titulo: 'Usuarios',
    descripcion: 'Crea y administra las cuentas de tu empresa.',
    ruta: '/app/usuarios',
    icono: 'users',
    permiso: 'usuarios.ver',
  },
  {
    titulo: 'Roles y permisos',
    descripcion: 'Define qué puede hacer cada tipo de usuario.',
    ruta: '/app/roles',
    icono: 'shield',
    permiso: 'roles.ver',
  },
  {
    titulo: 'Mi empresa',
    descripcion: 'Actualiza los datos y la información de tu empresa.',
    ruta: '/app/mi-empresa',
    icono: 'building',
    permiso: 'empresa.configurar',
  },
  {
    titulo: 'Empresas',
    descripcion: 'Administra las empresas registradas en la plataforma.',
    ruta: '/app/empresas',
    icono: 'building',
    soloSuperAdmin: true,
  },
];

const ROADMAP = [
  { nombre: 'Seguridad y acceso', estado: 'listo' },
  { nombre: 'Catálogos', estado: 'pronto' },
  { nombre: 'Inventario', estado: 'pronto' },
  { nombre: 'Cargues', estado: 'pronto' },
  { nombre: 'Botellones', estado: 'pronto' },
  { nombre: 'Producción', estado: 'pronto' },
];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="hero anim-up">
      <h1>{{ saludo() }}, {{ nombreCorto() }}</h1>
      @if (esOperativo()) {
        <p>
          Este es tu resumen personal. Aquí ves únicamente tu actividad: tus
          cargues, tus movimientos de botellón y las membresías que afiliaste.
        </p>
      } @else {
        <p>
          Este es el resumen de tu operación. Desde aquí puedes administrar el
          acceso de tu empresa y prepararte para los módulos operativos.
        </p>
      }
      <div class="hero-tags">
        <span class="badge">{{ rolLabel() }}</span>
        <span class="badge">{{ user()?.permisos.length ?? 0 }} permisos activos</span>
        <span class="badge">Biblioteca de acceso · Fase 3</span>
      </div>
    </section>

    @if (esOperativo()) {
      <div class="stats-grid stagger">
        @for (k of kpis(); track k.label) {
          <div class="stat-card">
            <div class="stat-icon" [class]="k.tint">
              <app-icon [name]="k.icono" />
            </div>
            <div>
              <div class="stat-value">{{ k.valor }}</div>
              <div class="stat-label">{{ k.label }}</div>
              <div class="stat-sub">{{ k.sub }}</div>
            </div>
          </div>
        }
      </div>

      <div class="grid-main-side">
        <div class="card card-body anim-up">
          <div class="section-title"><app-icon name="truck" /> Mis cargues</div>
          @if (carguesRecientes().length === 0) {
            <div class="empty">
              <app-icon name="truck" />
              <div class="empty-title">Sin cargues</div>
              <div>Aún no tienes cargues registrados.</div>
            </div>
          } @else {
            <div class="table-wrap">
              <table class="table">
                <thead>
                  <tr>
                    <th>Consecutivo</th>
                    <th>Estado</th>
                    <th>Ítems</th>
                    <th>Costo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of carguesRecientes(); track c.id) {
                    <tr>
                      <td><span class="cell-strong">{{ c.consecutivo }}</span></td>
                      <td><span [class]="badgeEstado(c.estado)">{{ c.estado }}</span></td>
                      <td>{{ c.items }}</td>
                      <td>{{ moneda(c.totalCosto) }}</td>
                      <td><span class="cell-muted">{{ fecha(c.creadoEn) }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <div class="col">
          <div class="card card-body anim-up">
            <div class="section-title"><app-icon name="bottle" /> Mis botellones</div>
            @if (botellonPorTipo().length === 0) {
              <div class="empty">
                <app-icon name="bottle" />
                <div class="empty-title">Sin movimientos</div>
                <div>No has registrado movimientos de botellón.</div>
              </div>
            } @else {
              @for (b of botellonPorTipo(); track b.tipo) {
                <div class="bar-row">
                  <span class="bar-label">{{ b.tipo }}</span>
                  <div class="progress">
                    <div class="progress-bar" [style.width.%]="b.porcentaje"></div>
                  </div>
                  <span class="bar-count">{{ b.cantidad }}</span>
                </div>
              }
              @if (conciliacionesPendientes() > 0) {
                <div class="info-line warn">
                  <app-icon name="warning" />
                  <span>{{ conciliacionesPendientes() }} conciliación(es) pendiente(s)</span>
                </div>
              }
            }
          </div>

          <div class="card card-body anim-up">
            <div class="section-title"><app-icon name="users" /> Mis membresías</div>
            @if (membresiasRecientes().length === 0) {
              <div class="empty">
                <app-icon name="users" />
                <div class="empty-title">Sin membresías</div>
                <div>Aún no has afiliado membresías.</div>
              </div>
            } @else {
              <div class="table-wrap">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Plan</th>
                      <th>Estado</th>
                      <th>Vence</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of membresiasRecientes(); track m.id) {
                      <tr>
                        <td><span class="cell-strong">{{ m.cliente }}</span></td>
                        <td><span class="cell-muted">{{ m.plan }}</span></td>
                        <td><span [class]="badgeEstado(m.estado)">{{ m.estado }}</span></td>
                        <td><span class="cell-muted">{{ fechaCorta(m.fechaFin) }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      </div>
    } @else {
      <div class="stats-grid stagger">
        @for (k of kpis(); track k.label) {
          <div class="stat-card">
            <div class="stat-icon" [class]="k.tint">
              <app-icon [name]="k.icono" />
            </div>
            <div>
              <div class="stat-value">{{ k.valor }}</div>
              <div class="stat-label">{{ k.label }}</div>
              <div class="stat-sub">{{ k.sub }}</div>
            </div>
          </div>
        }
      </div>

      <div class="grid-main-side">
        <div class="card card-body anim-up">
          @if (esSuperAdmin()) {
            <div class="section-title"><app-icon name="building" /> Empresas recientes</div>
            @if (empresas().length === 0) {
              <div class="empty">
                <app-icon name="building" />
                <div class="empty-title">Sin empresas</div>
                <div>Crea la primera empresa para comenzar.</div>
              </div>
            } @else {
              <div class="table-wrap">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Estado</th>
                      <th>Usuarios</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (e of empresas().slice(0, 5); track e.id) {
                      <tr>
                        <td>
                          <div class="cell-main">
                            <span class="avatar avatar-sm">{{ inicialesEmpresa(e.nombre) }}</span>
                            <div>
                              <div class="cell-strong">{{ e.nombre }}</div>
                              <div class="cell-muted">{{ e.nit || 'Sin NIT' }}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          @switch (e.estado) {
                            @case ('ACTIVA') {
                              <span class="badge badge-success"><span class="dot"></span>Activa</span>
                            }
                            @case ('SUSPENDIDA') {
                              <span class="badge badge-warn"><span class="dot"></span>Suspendida</span>
                            }
                            @default {
                              <span class="badge badge-danger"><span class="dot"></span>Cancelada</span>
                            }
                          }
                        </td>
                        <td>{{ e._count?.usuarios ?? 0 }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          } @else {
            <div class="section-title"><app-icon name="shield" /> Permisos por módulo</div>
            @if (modulos().length === 0) {
              <div class="empty">
                <app-icon name="shield" />
                <div class="empty-title">Sin permisos asignados</div>
                <div>Contacta al administrador de tu empresa.</div>
              </div>
            } @else {
              @for (m of modulos(); track m.modulo) {
                <div class="bar-row">
                  <span class="bar-label">{{ m.modulo }}</span>
                  <div class="progress">
                    <div class="progress-bar" [style.width.%]="m.porcentaje"></div>
                  </div>
                  <span class="bar-count">{{ m.total }}</span>
                </div>
              }
            }
          }
        </div>

        <div class="col">
          @if (!esSuperAdmin() && empresa()) {
            <div class="card card-body anim-up">
              <div class="section-title"><app-icon name="building" /> Mi empresa</div>
              <div class="emp-head">
                <span class="avatar avatar-lg">{{ inicialesEmpresa(empresa()!.nombre) }}</span>
                <div>
                  <div class="emp-name">{{ empresa()!.nombre }}</div>
                  @if (empresa()!.estado === 'ACTIVA') {
                    <span class="badge badge-success"><span class="dot"></span>Activa</span>
                  } @else if (empresa()!.estado === 'SUSPENDIDA') {
                    <span class="badge badge-warn"><span class="dot"></span>Suspendida</span>
                  } @else {
                    <span class="badge badge-danger"><span class="dot"></span>Cancelada</span>
                  }
                </div>
              </div>
              <div class="divider"></div>
              <div class="info-line">
                <app-icon name="report" /><span>NIT: {{ empresa()!.nit || '—' }}</span>
              </div>
              <div class="info-line">
                <app-icon name="mail" /><span>{{ empresa()!.email || 'Sin correo' }}</span>
              </div>
              <div class="info-line">
                <app-icon name="phone" /><span>{{ empresa()!.telefono || 'Sin teléfono' }}</span>
              </div>
              <div class="info-line">
                <app-icon name="location" /><span>{{ empresa()!.direccion || 'Sin dirección' }}</span>
              </div>
            </div>
          }

          <div class="card card-body anim-up">
            <div class="section-title"><app-icon name="bolt" /> Estado del sistema</div>
            @for (r of roadmap; track r.nombre) {
              <div class="road-item">
                <span class="road-dot" [class.listo]="r.estado === 'listo'"></span>
                <span class="road-nombre">{{ r.nombre }}</span>
                @if (r.estado === 'listo') {
                  <span class="badge badge-success">Listo</span>
                } @else {
                  <span class="badge badge-muted">Próximamente</span>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <div class="section-title" style="margin-top:8px"><app-icon name="spark" /> Accesos rápidos</div>
      <div class="cards stagger">
        @for (a of accesos(); track a.ruta) {
          <a class="card card-hover access-card" [routerLink]="a.ruta">
            <div class="access-icon"><app-icon [name]="a.icono" /></div>
            <div class="access-title">{{ a.titulo }}</div>
            <div class="access-desc">{{ a.descripcion }}</div>
            <div class="access-cta">Entrar <app-icon name="arrow-right" /></div>
          </a>
        }
      </div>
    }
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly rolesService = inject(RolesService);
  private readonly empresasService = inject(EmpresasService);
  private readonly resumenService = inject(ResumenService);

  readonly user = this.auth.user;
  readonly esSuperAdmin = this.auth.isSuperAdmin;
  readonly esOperativo = this.auth.esOperativo;
  readonly roadmap = ROADMAP;

  readonly empresas = signal<Empresa[]>([]);
  readonly empresa = signal<Empresa | null>(null);
  readonly totalUsuarios = signal(0);
  readonly totalRoles = signal(0);
  readonly resumen = signal<MiResumen | null>(null);

  readonly nombreCorto = computed(() => {
    const email = this.user()?.email ?? '';
    const base = email.split('@')[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  });

  readonly saludo = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  readonly rolLabel = computed(() => {
    if (this.esSuperAdmin()) return 'Superadministrador';
    if (this.esOperativo()) return 'Vendedor';
    return 'Administrador de empresa';
  });

  readonly modulos = computed<ModuloPermisos[]>(() => {
    const permisos = this.user()?.permisos ?? [];
    if (permisos.length === 0) return [];
    const conteo = new Map<string, number>();
    for (const p of permisos) {
      const modulo = p.split('.')[0];
      conteo.set(modulo, (conteo.get(modulo) ?? 0) + 1);
    }
    const max = Math.max(...conteo.values());
    return [...conteo.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([modulo, total]) => ({
        modulo,
        total,
        porcentaje: Math.round((total / max) * 100),
      }));
  });

  // ------------------------- Resumen personal (vendedor) -------------------

  readonly carguesRecientes = computed(
    () => this.resumen()?.cargues.recientes ?? [],
  );
  readonly membresiasRecientes = computed(
    () => this.resumen()?.membresias.recientes ?? [],
  );
  readonly conciliacionesPendientes = computed(
    () => this.resumen()?.conciliacionesPendientes ?? 0,
  );

  readonly botellonPorTipo = computed(() => {
    const tipos = this.resumen()?.botellones.porTipo ?? [];
    const max = Math.max(...tipos.map((t) => t.cantidad), 1);
    return tipos.map((t) => ({
      ...t,
      porcentaje: Math.max(6, Math.round((t.cantidad / max) * 100)),
    }));
  });

  private readonly carguesBorrador = computed(
    () =>
      this.resumen()?.cargues.porEstado.find((e) => e.estado === 'BORRADOR')
        ?.cantidad ?? 0,
  );

  readonly kpis = computed<Kpi[]>(() => {
    if (this.esOperativo()) {
      const r = this.resumen();
      return [
        {
          label: 'Mis cargues',
          valor: r?.cargues.total ?? 0,
          icono: 'truck',
          tint: 'tint-primary',
          sub: 'Registrados por ti',
        },
        {
          label: 'Por confirmar',
          valor: this.carguesBorrador(),
          icono: 'clock',
          tint: 'tint-warn',
          sub: 'En borrador',
        },
        {
          label: 'Botellones',
          valor: r?.botellones.total ?? 0,
          icono: 'bottle',
          tint: 'tint-accent',
          sub: 'Movimientos registrados',
        },
        {
          label: 'Membresías activas',
          valor: r?.membresias.activas ?? 0,
          icono: 'users',
          tint: 'tint-success',
          sub: 'Afiliadas por ti',
        },
      ];
    }

    if (this.esSuperAdmin()) {
      const total = this.empresas().length;
      const activas = this.empresas().filter((e) => e.estado === 'ACTIVA').length;
      const suspendidas = this.empresas().filter((e) => e.estado === 'SUSPENDIDA').length;
      const usuarios = this.empresas().reduce(
        (acc, e) => acc + (e._count?.usuarios ?? 0),
        0,
      );
      return [
        { label: 'Empresas', valor: total, icono: 'building', tint: 'tint-primary', sub: 'Total en la plataforma' },
        { label: 'Activas', valor: activas, icono: 'check', tint: 'tint-success', sub: 'Operando normalmente' },
        { label: 'Suspendidas', valor: suspendidas, icono: 'warning', tint: 'tint-warn', sub: 'Requieren revisión' },
        { label: 'Usuarios', valor: usuarios, icono: 'users', tint: 'tint-accent', sub: 'Suma de todas las empresas' },
      ];
    }
    return [
      { label: 'Usuarios', valor: this.totalUsuarios(), icono: 'users', tint: 'tint-primary', sub: 'En tu empresa' },
      { label: 'Roles', valor: this.totalRoles(), icono: 'shield', tint: 'tint-accent', sub: 'Configurados' },
      { label: 'Permisos activos', valor: this.user()?.permisos.length ?? 0, icono: 'key', tint: 'tint-success', sub: 'Asignados a tu cuenta' },
      {
        label: 'Estado empresa',
        valor: this.empresa()?.estado === 'ACTIVA' ? 'Activa' : (this.empresa()?.estado ?? '—'),
        icono: 'building',
        tint: 'tint-warn',
        sub: 'Situación actual',
      },
    ];
  });

  readonly accesos = computed(() =>
    ACCESOS.filter((a) => {
      if (a.soloSuperAdmin) return this.esSuperAdmin();
      if (a.permiso) return this.auth.hasPermiso(a.permiso);
      return true;
    }),
  );

  constructor() {
    if (this.esOperativo()) {
      this.resumenService.miResumen().subscribe({
        next: (r) => this.resumen.set(r),
        error: () => undefined,
      });
      return;
    }

    const peticiones: Record<string, Observable<unknown>> = {};

    if (this.esSuperAdmin()) {
      peticiones['empresas'] = this.empresasService.listar();
    } else {
      if (this.auth.hasPermiso('usuarios.ver')) {
        peticiones['usuarios'] = this.usuariosService.listar();
      }
      if (this.auth.hasPermiso('roles.ver')) {
        peticiones['roles'] = this.rolesService.listar();
      }
      if (this.auth.hasPermiso('empresa.configurar')) {
        peticiones['empresa'] = this.empresasService.miEmpresa();
      }
    }

    if (Object.keys(peticiones).length === 0) return;

    forkJoin(peticiones).subscribe({
      next: (res: Record<string, unknown>) => {
        if (res['empresas']) {
          this.empresas.set(res['empresas'] as Empresa[]);
        }
        if (res['usuarios']) {
          this.totalUsuarios.set((res['usuarios'] as unknown[]).length);
        }
        if (res['roles']) {
          this.totalRoles.set((res['roles'] as unknown[]).length);
        }
        if (res['empresa']) {
          this.empresa.set(res['empresa'] as Empresa);
        }
      },
      error: () => undefined,
    });
  }

  fecha(valor: string): string {
    if (!valor) return '—';
    return new Date(valor).toLocaleString('es-CO');
  }

  fechaCorta(valor: string): string {
    if (!valor) return '—';
    return new Date(valor).toLocaleDateString('es-CO');
  }

  moneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(valor ?? 0);
  }

  badgeEstado(estado: string): string {
    switch (estado) {
      case 'CONFIRMADO':
      case 'ACTIVA':
        return 'badge badge-success';
      case 'ANULADO':
      case 'VENCIDA':
        return 'badge badge-danger';
      case 'BORRADOR':
      case 'CANCELADA':
        return 'badge badge-muted';
      case 'SUSPENDIDA':
        return 'badge badge-warn';
      default:
        return 'badge badge-info';
    }
  }

  inicialesEmpresa(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  }
}
