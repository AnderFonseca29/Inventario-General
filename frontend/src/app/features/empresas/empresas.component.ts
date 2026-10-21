import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmpresasService } from '../../core/services/empresas.service';
import { ToastService } from '../../core/services/toast.service';
import { Empresa, EstadoEmpresa } from '../../core/models/empresa.model';
import { IconComponent } from '../../shared/icons';
import { FechaColPipe } from '../../shared/fecha-col.pipe';

@Component({
  selector: 'app-empresas',
  imports: [ReactiveFormsModule, DatePipe, IconComponent, FechaColPipe],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Empresas</div>
        <div class="page-subtitle">
          Administración de las empresas de la plataforma (solo superadmin).
        </div>
      </div>
      <button class="btn btn-primary" (click)="abrirCrear()">
        <app-icon name="plus" /> Nueva empresa
      </button>
    </div>

    <div class="stats-grid stagger">
      <div class="stat-card">
        <div class="stat-icon tint-primary"><app-icon name="building" /></div>
        <div><div class="stat-value">{{ empresas().length }}</div><div class="stat-label">Empresas</div><div class="stat-sub">Total registradas</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon tint-success"><app-icon name="check" /></div>
        <div><div class="stat-value">{{ activas() }}</div><div class="stat-label">Activas</div><div class="stat-sub">Operando</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon tint-warn"><app-icon name="warning" /></div>
        <div><div class="stat-value">{{ suspendidas() }}</div><div class="stat-label">Suspendidas</div><div class="stat-sub">Requieren revisión</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon tint-accent"><app-icon name="users" /></div>
        <div><div class="stat-value">{{ totalUsuarios() }}</div><div class="stat-label">Usuarios</div><div class="stat-sub">Suma global</div></div>
      </div>
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="control-icon search">
          <app-icon name="search" />
          <input class="form-control" placeholder="Buscar por nombre o NIT…"
            [value]="busqueda()" (input)="busqueda.set($any($event.target).value)" />
        </div>
        <button class="btn btn-ghost btn-sm" (click)="cargar()" title="Actualizar">
          <app-icon name="refresh" /> Actualizar
        </button>
      </div>

      <div class="table-wrap">
        @if (cargando()) {
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton-row">
              <div class="skeleton skeleton-circle"></div>
              <div style="flex:1">
                <div class="skeleton" style="width:30%;margin-bottom:8px"></div>
                <div class="skeleton" style="width:50%"></div>
              </div>
              <div class="skeleton" style="width:80px"></div>
            </div>
          }
        } @else if (filtradas().length === 0) {
          <div class="empty">
            <app-icon name="building" />
            <div class="empty-title">{{ empresas().length === 0 ? 'Sin empresas' : 'Sin resultados' }}</div>
            <div>{{ empresas().length === 0 ? 'Crea la primera empresa de la plataforma.' : 'Ajusta la búsqueda.' }}</div>
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Usuarios</th>
                <th>Estado</th>
                <th>Creada</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (e of filtradas(); track e.id) {
                <tr>
                  <td>
                    <div class="cell-main">
                      <span class="avatar">{{ iniciales(e.nombre) }}</span>
                      <div>
                        <div class="cell-strong">{{ e.nombre }}</div>
                        <div class="cell-muted">NIT: {{ e.nit || '—' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="cell-muted">{{ e.email || '—' }}</td>
                  <td><span class="badge badge-muted">{{ e._count?.usuarios ?? 0 }}</span></td>
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
                  <td class="cell-muted">{{ e.createdAt | fechaCol: 'shortDate' }}</td>
                  <td class="actions">
                    @if (e.estado !== 'ACTIVA') {
                      <button class="btn btn-ghost btn-sm" (click)="cambiarEstado(e, 'ACTIVA')" title="Activar">
                        <app-icon name="check" />
                      </button>
                    }
                    @if (e.estado === 'ACTIVA') {
                      <button class="btn btn-ghost btn-sm" (click)="cambiarEstado(e, 'SUSPENDIDA')" title="Suspender">
                        <app-icon name="warning" />
                      </button>
                    }
                    @if (e.estado !== 'CANCELADA') {
                      <button class="btn btn-danger btn-sm" (click)="cambiarEstado(e, 'CANCELADA')" title="Cancelar">
                        <app-icon name="close" />
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
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Nueva empresa</h3>
            <button class="icon-btn" (click)="cerrar()"><app-icon name="close" /></button>
          </div>

          <form [formGroup]="form" (ngSubmit)="guardar()">
            <div class="modal-body">
              @if (errorModal()) {
                <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
              }

              <div class="seccion"><app-icon name="building" /> Datos de la empresa</div>

              <div class="form-row">
                <div class="form-group">
                  <label for="nombre">Nombre</label>
                  <input id="nombre" class="form-control" formControlName="nombre"
                    [class.is-invalid]="form.controls.nombre.touched && form.controls.nombre.invalid" />
                  @if (form.controls.nombre.touched && form.controls.nombre.invalid) {
                    <div class="form-error">Mínimo 2 caracteres</div>
                  }
                </div>
                <div class="form-group">
                  <label for="nit">NIT</label>
                  <input id="nit" class="form-control" formControlName="nit" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="email">Correo</label>
                  <input id="email" type="email" class="form-control" formControlName="email" />
                </div>
                <div class="form-group">
                  <label for="telefono">Teléfono</label>
                  <input id="telefono" class="form-control" formControlName="telefono" />
                </div>
              </div>

              <div class="form-group">
                <label for="direccion">Dirección</label>
                <input id="direccion" class="form-control" formControlName="direccion" />
              </div>

              <div class="seccion" style="margin-top:8px"><app-icon name="user" /> Administrador inicial</div>
              <p class="form-hint" style="margin:-4px 0 14px">
                Se creará el usuario administrador con acceso total a la empresa.
              </p>

              <div class="form-group">
                <label for="adminNombre">Nombre del administrador</label>
                <input id="adminNombre" class="form-control" formControlName="adminNombre"
                  [class.is-invalid]="form.controls.adminNombre.touched && form.controls.adminNombre.invalid" />
                @if (form.controls.adminNombre.touched && form.controls.adminNombre.invalid) {
                  <div class="form-error">Mínimo 2 caracteres</div>
                }
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="adminEmail">Correo del administrador</label>
                  <input id="adminEmail" type="email" class="form-control" formControlName="adminEmail"
                    [class.is-invalid]="form.controls.adminEmail.touched && form.controls.adminEmail.invalid" />
                  @if (form.controls.adminEmail.touched && form.controls.adminEmail.invalid) {
                    <div class="form-error">Correo inválido</div>
                  }
                </div>
                <div class="form-group">
                  <label for="adminPassword">Contraseña</label>
                  <input id="adminPassword" type="password" class="form-control" formControlName="adminPassword"
                    [class.is-invalid]="form.controls.adminPassword.touched && form.controls.adminPassword.invalid" />
                  @if (form.controls.adminPassword.touched && form.controls.adminPassword.invalid) {
                    <div class="form-error">Mínimo 8 caracteres</div>
                  }
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" (click)="cerrar()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                {{ guardando() ? 'Creando…' : 'Crear empresa' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styleUrl: './empresas.component.scss',
})
export class EmpresasComponent {
  private readonly empresasService = inject(EmpresasService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly empresas = signal<Empresa[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorModal = signal<string | null>(null);
  readonly modalAbierto = signal(false);
  readonly busqueda = signal('');

  readonly activas = computed(() => this.empresas().filter((e) => e.estado === 'ACTIVA').length);
  readonly suspendidas = computed(() => this.empresas().filter((e) => e.estado === 'SUSPENDIDA').length);
  readonly totalUsuarios = computed(() =>
    this.empresas().reduce((acc, e) => acc + (e._count?.usuarios ?? 0), 0),
  );

  readonly filtradas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.empresas();
    return this.empresas().filter(
      (e) => e.nombre.toLowerCase().includes(q) || (e.nit ?? '').toLowerCase().includes(q),
    );
  });

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    nit: [''],
    email: ['', [Validators.email]],
    telefono: [''],
    direccion: [''],
    adminNombre: ['', [Validators.required, Validators.minLength(2)]],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.empresasService.listar().subscribe({
      next: (empresas) => {
        this.empresas.set(empresas);
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

  abrirCrear(): void {
    this.errorModal.set(null);
    this.form.reset({
      nombre: '',
      nit: '',
      email: '',
      telefono: '',
      direccion: '',
      adminNombre: '',
      adminEmail: '',
      adminPassword: '',
    });
    this.modalAbierto.set(true);
  }

  cerrar(): void {
    this.modalAbierto.set(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.errorModal.set(null);

    this.empresasService
      .crear({
        nombre: v.nombre,
        nit: v.nit || undefined,
        razonSocial: undefined,
        email: v.email || undefined,
        telefono: v.telefono || undefined,
        direccion: v.direccion || undefined,
        admin: { nombre: v.adminNombre, email: v.adminEmail, password: v.adminPassword },
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.modalAbierto.set(false);
          this.toast.exito('Empresa creada con su administrador');
          this.cargar();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorModal.set(this.mensaje(err));
        },
      });
  }

  cambiarEstado(e: Empresa, estado: EstadoEmpresa): void {
    const etiqueta =
      estado === 'ACTIVA' ? 'activar' : estado === 'SUSPENDIDA' ? 'suspender' : 'cancelar';
    if (!confirm(`¿${etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)} la empresa ${e.nombre}?`)) return;
    this.empresasService.cambiarEstado(e.id, estado).subscribe({
      next: () => {
        this.toast.exito('Estado actualizado');
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
