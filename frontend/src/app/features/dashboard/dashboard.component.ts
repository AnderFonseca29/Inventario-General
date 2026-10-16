import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { RolesService } from '../../core/services/roles.service';
import { EmpresasService } from '../../core/services/empresas.service';
import { Empresa } from '../../core/models/empresa.model';
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

const ACCESOS: Acceso[] = [
  {
    titulo: 'Usuarios',
    descripcion: 'Crea y administra las cuentas de tu empresa.',
    ruta: '/usuarios',
    icono: 'users',
    permiso: 'usuarios.ver',
  },
  {
    titulo: 'Roles y permisos',
    descripcion: 'Define qué puede hacer cada tipo de usuario.',
    ruta: '/roles',
    icono: 'shield',
    permiso: 'roles.ver',
  },
  {
    titulo: 'Mi empresa',
    descripcion: 'Actualiza los datos y la información de tu empresa.',
    ruta: '/mi-empresa',
    icono: 'building',
    permiso: 'empresa.configurar',
  },
  {
    titulo: 'Empresas',
    descripcion: 'Administra las empresas registradas en la plataforma.',
    ruta: '/empresas',
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
      <p>
        Este es el resumen de tu operación. Desde aquí puedes administrar el
        acceso de tu empresa y prepararte para los módulos operativos.
      </p>
      <div class="hero-tags">
        <span class="badge">{{ esSuperAdmin() ? 'Superadministrador' : 'Administrador de empresa' }}</span>
        <span class="badge">{{ user()?.permisos.length ?? 0 }} permisos activos</span>
        <span class="badge">Biblioteca de acceso · Fase 3</span>
      </div>
    </section>

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
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly rolesService = inject(RolesService);
  private readonly empresasService = inject(EmpresasService);

  readonly user = this.auth.user;
  readonly esSuperAdmin = this.auth.isSuperAdmin;
  readonly roadmap = ROADMAP;

  readonly empresas = signal<Empresa[]>([]);
  readonly empresa = signal<Empresa | null>(null);
  readonly totalUsuarios = signal(0);
  readonly totalRoles = signal(0);

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

  readonly kpis = computed(() => {
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

  inicialesEmpresa(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  }
}
