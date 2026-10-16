import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolesService } from '../../core/services/roles.service';
import { PermisosService } from '../../core/services/permisos.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Permiso, Rol } from '../../core/models/rol.model';
import { IconComponent } from '../../shared/icons';

interface GrupoPermisos {
  modulo: string;
  permisos: Permiso[];
}

@Component({
  selector: 'app-roles',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Roles y permisos</div>
        <div class="page-subtitle">
          {{ roles().length }} roles · define qué acciones puede realizar cada
          tipo de usuario.
        </div>
      </div>
      @if (puedeAdministrar()) {
        <button class="btn btn-primary" (click)="abrirCrear()">
          <app-icon name="plus" /> Nuevo rol
        </button>
      }
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="control-icon search">
          <app-icon name="search" />
          <input
            class="form-control"
            placeholder="Buscar rol…"
            [value]="busqueda()"
            (input)="busqueda.set($any($event.target).value)"
          />
        </div>
        <button class="btn btn-ghost btn-sm" (click)="cargar()" title="Actualizar">
          <app-icon name="refresh" /> Actualizar
        </button>
      </div>

      <div class="table-wrap">
        @if (cargando()) {
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton-row">
              <div style="flex:1">
                <div class="skeleton" style="width:30%;margin-bottom:8px"></div>
                <div class="skeleton" style="width:55%"></div>
              </div>
              <div class="skeleton" style="width:90px"></div>
            </div>
          }
        } @else if (rolesFiltrados().length === 0) {
          <div class="empty">
            <app-icon name="shield" />
            <div class="empty-title">Sin roles</div>
            <div>Ajusta la búsqueda o crea un nuevo rol.</div>
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Rol</th>
                <th>Descripción</th>
                <th>Permisos</th>
                <th>Usuarios</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of rolesFiltrados(); track r.id) {
                <tr>
                  <td>
                    <div class="cell-main">
                      <span class="avatar avatar-sm" [class.tint-primary]="r.esSistema">{{ iniciales(r.nombre) }}</span>
                      <div>
                        <div class="cell-strong">{{ r.nombre }}</div>
                        @if (r.esSistema) {
                          <span class="badge badge-primary">Sistema</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="cell-muted">{{ r.descripcion || '—' }}</td>
                  <td><span class="badge badge-info">{{ r.permisos.length }} permisos</span></td>
                  <td>
                    <span class="badge badge-muted">{{ r._count?.usuarios ?? 0 }} usuarios</span>
                  </td>
                  <td class="actions">
                    @if (puedeAdministrar()) {
                      <button class="btn btn-ghost btn-sm" (click)="abrirEditar(r)" title="Editar">
                        <app-icon name="edit" />
                      </button>
                      @if (!r.esSistema) {
                        <button class="btn btn-danger btn-sm" (click)="eliminar(r)" title="Eliminar">
                          <app-icon name="trash" />
                        </button>
                      }
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    @if (modalAbierto()) {
      <div class="modal-backdrop" (click)="cerrar()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editando() ? 'Editar rol' : 'Nuevo rol' }}</h3>
            <button class="icon-btn" (click)="cerrar()"><app-icon name="close" /></button>
          </div>

          <form [formGroup]="form" (ngSubmit)="guardar()">
            <div class="modal-body">
              @if (errorModal()) {
                <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
              }

              <div class="form-row">
                <div class="form-group">
                  <label for="nombre">Nombre del rol</label>
                  <input id="nombre" class="form-control" formControlName="nombre"
                    [class.is-invalid]="form.controls.nombre.touched && form.controls.nombre.invalid" />
                  @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
                    <div class="form-error">Mínimo 2 caracteres</div>
                  }
                </div>
                <div class="form-group">
                  <label for="descripcion">Descripción (opcional)</label>
                  <input id="descripcion" class="form-control" formControlName="descripcion" />
                </div>
              </div>

              <div class="permiso-head">
                <label>Permisos</label>
                <div class="permiso-acciones">
                  <span class="badge badge-primary">{{ seleccionadas().size }} seleccionados</span>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="seleccionarTodo()">Todos</button>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="limpiar()">Limpiar</button>
                </div>
              </div>

              @for (g of grupos(); track g.modulo) {
                <div class="grupo">
                  <button type="button" class="grupo-head" (click)="toggleGrupo(g.modulo)">
                    <app-icon name="chevron" class="chev" [class.abierto]="!colapsados().has(g.modulo)" />
                    <span class="grupo-titulo">{{ g.modulo }}</span>
                    <span class="grupo-count">{{ contarSeleccionados(g.modulo) }}/{{ g.permisos.length }}</span>
                    <label class="grupo-all" (click)="$event.stopPropagation()">
                      <input type="checkbox" [checked]="todosModulo(g.modulo)" (change)="toggleModulo(g.modulo)" />
                    </label>
                  </button>

                  @if (!colapsados().has(g.modulo)) {
                    <div class="checks">
                      @for (p of g.permisos; track p.codigo) {
                        <label class="check">
                          <input type="checkbox" [checked]="seleccionadas().has(p.codigo)" (change)="togglePermiso(p.codigo)" />
                          {{ p.nombre }}
                        </label>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="cerrar()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                {{ guardando() ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styleUrl: './roles.component.scss',
})
export class RolesComponent {
  private readonly rolesService = inject(RolesService);
  private readonly permisosService = inject(PermisosService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly roles = signal<Rol[]>([]);
  readonly permisos = signal<Permiso[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorModal = signal<string | null>(null);
  readonly modalAbierto = signal(false);
  readonly editando = signal<Rol | null>(null);
  readonly seleccionadas = signal<Set<string>>(new Set());
  readonly colapsados = signal<Set<string>>(new Set());
  readonly busqueda = signal('');

  readonly puedeAdministrar = () => this.auth.hasPermiso('roles.administrar');

  readonly rolesFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.roles();
    return this.roles().filter((r) => r.nombre.toLowerCase().includes(q));
  });

  readonly grupos = computed<GrupoPermisos[]>(() => {
    const porModulo = new Map<string, Permiso[]>();
    for (const p of this.permisos()) {
      const lista = porModulo.get(p.modulo) ?? [];
      lista.push(p);
      porModulo.set(p.modulo, lista);
    }
    return [...porModulo.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([modulo, permisos]) => ({ modulo, permisos }));
  });

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
  });

  constructor() {
    this.cargar();
    this.permisosService.listar().subscribe({
      next: (permisos) => this.permisos.set(permisos),
      error: () => this.permisos.set([]),
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.rolesService.listar().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.cargando.set(false);
      },
      error: (err) => {
        this.toast.error(this.mensaje(err));
        this.cargando.set(false);
      },
    });
  }

  iniciales(nombre: string): string {
    return nombre.slice(0, 2).toUpperCase();
  }

  contarSeleccionados(modulo: string): number {
    const g = this.grupos().find((x) => x.modulo === modulo);
    if (!g) return 0;
    return g.permisos.filter((p) => this.seleccionadas().has(p.codigo)).length;
  }

  todosModulo(modulo: string): boolean {
    const g = this.grupos().find((x) => x.modulo === modulo);
    if (!g || g.permisos.length === 0) return false;
    return g.permisos.every((p) => this.seleccionadas().has(p.codigo));
  }

  toggleModulo(modulo: string): void {
    const g = this.grupos().find((x) => x.modulo === modulo);
    if (!g) return;
    const set = new Set(this.seleccionadas());
    const todos = this.todosModulo(modulo);
    for (const p of g.permisos) {
      if (todos) set.delete(p.codigo);
      else set.add(p.codigo);
    }
    this.seleccionadas.set(set);
  }

  toggleGrupo(modulo: string): void {
    const set = new Set(this.colapsados());
    if (set.has(modulo)) set.delete(modulo);
    else set.add(modulo);
    this.colapsados.set(set);
  }

  togglePermiso(codigo: string): void {
    const set = new Set(this.seleccionadas());
    if (set.has(codigo)) set.delete(codigo);
    else set.add(codigo);
    this.seleccionadas.set(set);
  }

  seleccionarTodo(): void {
    this.seleccionadas.set(new Set(this.permisos().map((p) => p.codigo)));
  }

  limpiar(): void {
    this.seleccionadas.set(new Set());
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.seleccionadas.set(new Set());
    this.colapsados.set(new Set());
    this.errorModal.set(null);
    this.form.reset({ nombre: '', descripcion: '' });
    this.form.controls.nombre.enable();
    this.modalAbierto.set(true);
  }

  abrirEditar(r: Rol): void {
    this.editando.set(r);
    this.seleccionadas.set(new Set(r.permisos.map((p) => p.permiso.codigo)));
    this.colapsados.set(new Set());
    this.errorModal.set(null);
    this.form.reset({ nombre: r.nombre, descripcion: r.descripcion ?? '' });
    if (r.esSistema) this.form.controls.nombre.disable();
    else this.form.controls.nombre.enable();
    this.modalAbierto.set(true);
  }

  cerrar(): void {
    this.modalAbierto.set(false);
    this.editando.set(null);
  }

  guardar(): void {
    if (this.form.controls.nombre.invalid) {
      this.form.controls.nombre.markAsTouched();
      return;
    }
    const permisos = [...this.seleccionadas()];
    if (permisos.length === 0) {
      this.errorModal.set('Selecciona al menos un permiso');
      return;
    }

    this.guardando.set(true);
    this.errorModal.set(null);
    const valor = this.form.getRawValue();
    const editando = this.editando();

    const peticion = editando
      ? this.rolesService.actualizar(editando.id, {
          nombre: editando.esSistema ? undefined : valor.nombre,
          descripcion: valor.descripcion,
          permisos,
        })
      : this.rolesService.crear({
          nombre: valor.nombre,
          descripcion: valor.descripcion,
          permisos,
        });

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.editando.set(null);
        this.form.controls.nombre.enable();
        this.toast.exito(editando ? 'Rol actualizado correctamente' : 'Rol creado correctamente');
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorModal.set(this.mensaje(err));
      },
    });
  }

  eliminar(r: Rol): void {
    if (!confirm(`¿Eliminar el rol ${r.nombre}?`)) return;
    this.rolesService.eliminar(r.id).subscribe({
      next: () => {
        this.toast.exito('Rol eliminado');
        this.cargar();
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  private mensaje(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message ?? e?.message ?? 'Ocurrió un error';
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
}
