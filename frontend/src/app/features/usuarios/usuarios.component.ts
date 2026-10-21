import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '../../core/services/usuarios.service';
import { RolesService } from '../../core/services/roles.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Rol } from '../../core/models/rol.model';
import { Usuario } from '../../core/models/usuario.model';
import { IconComponent } from '../../shared/icons';
import { FechaColPipe } from '../../shared/fecha-col.pipe';

type Filtro = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, IconComponent, FechaColPipe],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Usuarios</div>
        <div class="page-subtitle">
          {{ usuarios().length }} cuentas en tu empresa ·
          {{ activos() }} activas
        </div>
      </div>
      @if (puedeCrear()) {
        <button class="btn btn-primary" (click)="abrirCrear()">
          <app-icon name="plus" /> Nuevo usuario
        </button>
      }
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="control-icon search">
          <app-icon name="search" />
          <input
            class="form-control"
            placeholder="Buscar por nombre o correo…"
            [value]="busqueda()"
            (input)="busqueda.set($any($event.target).value)"
          />
        </div>
        <div class="segmented">
          <button [class.active]="filtro() === 'todos'" (click)="filtro.set('todos')">Todos</button>
          <button [class.active]="filtro() === 'activos'" (click)="filtro.set('activos')">Activos</button>
          <button [class.active]="filtro() === 'inactivos'" (click)="filtro.set('inactivos')">Inactivos</button>
        </div>
        <button class="btn btn-ghost btn-sm" (click)="cargar()" title="Actualizar">
          <app-icon name="refresh" /> Actualizar
        </button>
      </div>

      <div class="table-wrap">
        @if (cargando()) {
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="skeleton-row">
              <div class="skeleton skeleton-circle"></div>
              <div style="flex:1">
                <div class="skeleton" style="width:40%;margin-bottom:8px"></div>
                <div class="skeleton" style="width:60%"></div>
              </div>
              <div class="skeleton" style="width:90px"></div>
            </div>
          }
        } @else if (filtrados().length === 0) {
          <div class="empty">
            <app-icon name="users" />
            <div class="empty-title">
              {{ usuarios().length === 0 ? 'Sin usuarios' : 'Sin resultados' }}
            </div>
            <div>
              {{ usuarios().length === 0 ? 'Crea el primer usuario de tu empresa.' : 'Ajusta la búsqueda o el filtro.' }}
            </div>
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Roles</th>
                <th>Estado</th>
                <th>Último ingreso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (u of filtrados(); track u.id) {
                <tr>
                  <td>
                    <div class="cell-main">
                      <span class="avatar" [class.avatar-muted]="!u.activo">{{ iniciales(u.nombre) }}</span>
                      <div>
                        <div class="cell-strong">{{ u.nombre }}</div>
                        <div class="cell-muted">{{ u.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    @for (r of u.roles; track r.id) {
                      <span class="badge badge-muted">{{ r.nombre }}</span>
                    }
                  </td>
                  <td>
                    @if (u.activo) {
                      <span class="badge badge-success"><span class="dot"></span>Activo</span>
                    } @else {
                      <span class="badge badge-danger"><span class="dot"></span>Inactivo</span>
                    }
                  </td>
                  <td class="cell-muted">
                    {{ u.ultimoLogin ? (u.ultimoLogin | fechaCol: 'short') : 'Nunca' }}
                  </td>
                  <td class="actions">
                    @if (puedeEditar()) {
                      <button class="btn btn-ghost btn-sm" (click)="resetPass(u)" title="Cambiar contraseña">
                        <app-icon name="key" />
                      </button>
                      <button class="btn btn-ghost btn-sm" (click)="abrirEditar(u)" title="Editar">
                        <app-icon name="edit" />
                      </button>
                    }
                    @if (puedeDesactivar() && u.activo) {
                      <button class="btn btn-danger btn-sm" (click)="desactivar(u)" title="Desactivar">
                        <app-icon name="trash" />
                      </button>
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
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editando() ? 'Editar usuario' : 'Nuevo usuario' }}</h3>
            <button class="icon-btn" (click)="cerrar()"><app-icon name="close" /></button>
          </div>

          <form [formGroup]="form" (ngSubmit)="guardar()">
            <div class="modal-body">
              @if (errorModal()) {
                <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
              }

              <div class="form-group">
                <label for="nombre">Nombre completo</label>
                <input id="nombre" class="form-control" formControlName="nombre"
                  [class.is-invalid]="form.controls.nombre.touched && form.controls.nombre.invalid" />
                @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
                  <div class="form-error">Mínimo 2 caracteres</div>
                }
              </div>

              @if (!editando()) {
                <div class="form-row">
                  <div class="form-group">
                    <label for="email">Correo electrónico</label>
                    <input id="email" type="email" class="form-control" formControlName="email"
                      [class.is-invalid]="form.controls.email.touched && form.controls.email.invalid" />
                    @if (form.controls.email.touched && form.controls.email.invalid) {
                      <div class="form-error">Correo inválido</div>
                    }
                  </div>
                  <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input id="password" type="password" class="form-control" formControlName="password"
                      [class.is-invalid]="form.controls.password.touched && form.controls.password.invalid" />
                    @if (form.controls.password.touched && form.controls.password.invalid) {
                      <div class="form-error">Mínimo 8 caracteres</div>
                    }
                  </div>
                </div>
              }

              <div class="form-group">
                <label>Roles</label>
                @if (roles().length === 0) {
                  <div class="form-hint">No se pudieron cargar los roles disponibles.</div>
                }
                <div class="checks">
                  @for (r of roles(); track r.id) {
                    <label class="check">
                      <input type="checkbox" [checked]="rolesSeleccionados().has(r.id)" (change)="toggleRol(r.id)" />
                      {{ r.nombre }}
                    </label>
                  }
                </div>
                @if (sinRoles()) {
                  <div class="form-error">Selecciona al menos un rol</div>
                }
              </div>

              @if (editando()) {
                <label class="check" style="max-width: 230px">
                  <input type="checkbox" formControlName="activo" />
                  Usuario activo
                </label>
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
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent {
  private readonly usuariosService = inject(UsuariosService);
  private readonly rolesService = inject(RolesService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly usuarios = signal<Usuario[]>([]);
  readonly roles = signal<Rol[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorModal = signal<string | null>(null);
  readonly modalAbierto = signal(false);
  readonly editando = signal<Usuario | null>(null);
  readonly rolesSeleccionados = signal<Set<string>>(new Set());
  readonly sinRoles = signal(false);
  readonly busqueda = signal('');
  readonly filtro = signal<Filtro>('todos');

  readonly puedeCrear = () => this.auth.hasPermiso('usuarios.crear');
  readonly puedeEditar = () => this.auth.hasPermiso('usuarios.editar');
  readonly puedeDesactivar = () => this.auth.hasPermiso('usuarios.desactivar');

  readonly activos = computed(() => this.usuarios().filter((u) => u.activo).length);

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const f = this.filtro();
    return this.usuarios().filter((u) => {
      if (f === 'activos' && !u.activo) return false;
      if (f === 'inactivos' && u.activo) return false;
      if (!q) return true;
      return (
        u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    });
  });

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    activo: [true],
  });

  constructor() {
    this.cargar();
    if (this.auth.hasPermiso('roles.ver')) {
      this.rolesService.listar().subscribe({
        next: (roles) => this.roles.set(roles),
        error: () => this.roles.set([]),
      });
    }
  }

  cargar(): void {
    this.cargando.set(true);
    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (err) => {
        this.toast.error(this.mensaje(err));
        this.cargando.set(false);
      },
    });
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  }

  toggleRol(id: string): void {
    const set = new Set(this.rolesSeleccionados());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.rolesSeleccionados.set(set);
    this.sinRoles.set(false);
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.rolesSeleccionados.set(new Set());
    this.errorModal.set(null);
    this.sinRoles.set(false);
    this.form.reset({ nombre: '', email: '', password: '', activo: true });
    this.form.controls.email.enable();
    this.form.controls.password.enable();
    this.modalAbierto.set(true);
  }

  abrirEditar(u: Usuario): void {
    this.editando.set(u);
    this.rolesSeleccionados.set(new Set(u.roles.map((r) => r.id)));
    this.errorModal.set(null);
    this.sinRoles.set(false);
    this.form.reset({ nombre: u.nombre, email: u.email, password: '', activo: u.activo });
    this.form.controls.email.disable();
    this.form.controls.password.disable();
    this.modalAbierto.set(true);
  }

  cerrar(): void {
    this.modalAbierto.set(false);
    this.editando.set(null);
  }

  guardar(): void {
    const editando = this.editando();
    const rolIds = [...this.rolesSeleccionados()];

    if (this.form.controls.nombre.invalid) {
      this.form.controls.nombre.markAsTouched();
      return;
    }
    if (!editando && this.form.controls.email.invalid) {
      this.form.controls.email.markAsTouched();
      return;
    }
    if (!editando && this.form.controls.password.invalid) {
      this.form.controls.password.markAsTouched();
      return;
    }
    if (rolIds.length === 0) {
      this.sinRoles.set(true);
      return;
    }

    this.guardando.set(true);
    this.errorModal.set(null);
    const valor = this.form.getRawValue();

    if (editando) {
      this.usuariosService
        .actualizar(editando.id, { nombre: valor.nombre, activo: valor.activo, roles: rolIds })
        .subscribe({
          next: () => this.exitoGuardado('Usuario actualizado correctamente'),
          error: (err) => this.errorGuardado(err),
        });
    } else {
      this.usuariosService
        .crear({
          nombre: valor.nombre,
          email: valor.email,
          password: valor.password,
          roles: rolIds,
          activo: true,
        })
        .subscribe({
          next: () => this.exitoGuardado('Usuario creado correctamente'),
          error: (err) => this.errorGuardado(err),
        });
    }
  }

  private exitoGuardado(msg: string): void {
    this.guardando.set(false);
    this.modalAbierto.set(false);
    this.editando.set(null);
    this.toast.exito(msg);
    this.cargar();
  }

  private errorGuardado(err: unknown): void {
    this.guardando.set(false);
    this.errorModal.set(this.mensaje(err));
  }

  desactivar(u: Usuario): void {
    if (!confirm(`¿Desactivar a ${u.nombre}? No podrá iniciar sesión.`)) return;
    this.usuariosService.desactivar(u.id).subscribe({
      next: () => {
        this.toast.exito('Usuario desactivado');
        this.cargar();
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  resetPass(u: Usuario): void {
    const nueva = prompt(`Nueva contraseña para ${u.nombre} (mínimo 8 caracteres):`);
    if (!nueva) return;
    if (nueva.length < 8) {
      this.toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    this.usuariosService.resetPassword(u.id, nueva).subscribe({
      next: () => this.toast.exito('Contraseña actualizada'),
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  private mensaje(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message ?? e?.message ?? 'Ocurrió un error';
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
}
