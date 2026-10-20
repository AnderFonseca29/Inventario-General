import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModulosService } from '../../core/services/modulos.service';
import { ModulosStateService } from '../../core/services/modulos-state.service';
import { EmpresasService } from '../../core/services/empresas.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Empresa } from '../../core/models/empresa.model';
import { Modulo } from '../../core/models/modulo.model';
import { IconComponent } from '../../shared/icons';

const ICONOS_DISPONIBLES = [
  'box',
  'truck',
  'bottle',
  'factory',
  'report',
  'audit',
  'users',
  'user',
  'shield',
  'building',
  'dashboard',
  'settings',
  'calendar',
  'spark',
  'trend-up',
  'warning',
];

@Component({
  selector: 'app-modulos',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Módulos</div>
        <div class="page-subtitle">
          {{ modulos().length }} módulos · personaliza el menú de operación de tu
          empresa. Los módulos del sistema no se pueden eliminar.
        </div>
      </div>
      @if (puedeAdministrar() && empresaId()) {
        <button class="btn btn-primary" (click)="abrirCrear()">
          <app-icon name="plus" /> Nuevo módulo
        </button>
      }
    </div>

    @if (esSuperAdmin()) {
      <div class="card empresa-selector">
        <label for="empresa">Empresa</label>
        <select
          id="empresa"
          class="form-control"
          [value]="empresaId() ?? ''"
          (change)="seleccionarEmpresa($any($event.target).value)"
        >
          <option value="" disabled>Selecciona una empresa…</option>
          @for (e of empresas(); track e.id) {
            <option [value]="e.id">{{ e.nombre }}</option>
          }
        </select>
      </div>
    }

    <div class="card">
      <div class="table-toolbar">
        <div class="control-icon search">
          <app-icon name="search" />
          <input
            class="form-control"
            placeholder="Buscar módulo…"
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
        } @else if (!empresaId()) {
          <div class="empty">
            <app-icon name="building" />
            <div class="empty-title">Selecciona una empresa</div>
            <div>Elige a qué empresa deseas administrar los módulos.</div>
          </div>
        } @else if (modulosFiltrados().length === 0) {
          <div class="empty">
            <app-icon name="box" />
            <div class="empty-title">Sin módulos</div>
            <div>Ajusta la búsqueda o crea un nuevo módulo.</div>
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th class="th-orden">Orden</th>
                <th>Módulo</th>
                <th>Tipo</th>
                <th>Ruta</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (m of modulosFiltrados(); track m.id; let idx = $index) {
                <tr>
                  <td>
                    @if (puedeAdministrar() && sinBusqueda()) {
                      <div class="orden">
                        <button class="btn btn-ghost btn-sm" [disabled]="idx === 0" (click)="mover(m, -1)" title="Subir">
                          <app-icon name="chevron" class="arrow up" />
                        </button>
                        <button class="btn btn-ghost btn-sm" [disabled]="idx === modulosFiltrados().length - 1" (click)="mover(m, 1)" title="Bajar">
                          <app-icon name="chevron" class="arrow down" />
                        </button>
                      </div>
                    } @else {
                      <span class="cell-muted">—</span>
                    }
                  </td>
                  <td>
                    <div class="cell-main">
                      <span class="icon-preview"><app-icon [name]="m.icono" /></span>
                      <div>
                        <div class="cell-strong">{{ m.nombre }}</div>
                        <div class="cell-muted cell-sub">{{ m.clave }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    @if (m.tipo === 'SISTEMA') {
                      <span class="badge badge-primary">Sistema</span>
                    } @else {
                      <span class="badge badge-muted">Personalizado</span>
                    }
                  </td>
                  <td class="cell-muted">
                    {{ m.ruta || '—' }}
                    @if (!m.implementado) {
                      <span class="pronto-tag">Pronto</span>
                    }
                  </td>
                  <td>
                    @if (puedeAdministrar()) {
                      <button
                        class="badge"
                        [class.badge-success]="m.activo"
                        [class.badge-muted]="!m.activo"
                        (click)="toggleActivo(m)"
                        title="Activar / desactivar"
                      >
                        {{ m.activo ? 'Activo' : 'Inactivo' }}
                      </button>
                    } @else {
                      <span class="badge" [class.badge-success]="m.activo" [class.badge-muted]="!m.activo">
                        {{ m.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    }
                  </td>
                  <td class="actions">
                    @if (puedeAdministrar()) {
                      <button class="btn btn-ghost btn-sm" (click)="abrirEditar(m)" title="Editar">
                        <app-icon name="edit" />
                      </button>
                      @if (m.tipo !== 'SISTEMA') {
                        <button class="btn btn-danger btn-sm" (click)="eliminar(m)" title="Eliminar">
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
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editando() ? 'Editar módulo' : 'Nuevo módulo' }}</h3>
            <button class="icon-btn" (click)="cerrar()"><app-icon name="close" /></button>
          </div>

          <form [formGroup]="form" (ngSubmit)="guardar()">
            <div class="modal-body">
              @if (errorModal()) {
                <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
              }

              <div class="form-group">
                <label for="nombre">Nombre del módulo</label>
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

              <div class="form-row">
                <div class="form-group">
                  <label for="icono">Icono</label>
                  <div class="icono-field">
                    <span class="icon-preview"><app-icon [name]="form.controls.icono.value" /></span>
                    <select id="icono" class="form-control" formControlName="icono">
                      @for (ic of iconos; track ic) {
                        <option [value]="ic">{{ ic }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label for="orden">Orden</label>
                  <input id="orden" type="number" class="form-control" formControlName="orden" />
                </div>
              </div>

              <div class="form-group">
                <label for="ruta">
                  Ruta interna
                  @if (esSistema()) {
                    <span class="cell-muted">(fija para módulos del sistema)</span>
                  }
                </label>
                <input id="ruta" class="form-control" formControlName="ruta" placeholder="/mi-modulo" />
              </div>

              <label class="check">
                <input type="checkbox" formControlName="activo" />
                Módulo activo (visible en el menú)
              </label>
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
  styleUrl: './modulos.component.scss',
})
export class ModulosComponent {
  private readonly modulosService = inject(ModulosService);
  private readonly modulosState = inject(ModulosStateService);
  private readonly empresasService = inject(EmpresasService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly iconos = ICONOS_DISPONIBLES;

  readonly modulos = signal<Modulo[]>([]);
  readonly empresas = signal<Empresa[]>([]);
  readonly empresaId = signal<string | undefined>(undefined);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly errorModal = signal<string | null>(null);
  readonly modalAbierto = signal(false);
  readonly editando = signal<Modulo | null>(null);
  readonly busqueda = signal('');

  readonly esSuperAdmin = this.auth.isSuperAdmin;
  readonly puedeAdministrar = () =>
    this.auth.hasPermiso('modulos.administrar') || this.auth.isSuperAdmin();

  readonly modulosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.modulos();
    return this.modulos().filter(
      (m) =>
        m.nombre.toLowerCase().includes(q) ||
        m.clave.toLowerCase().includes(q),
    );
  });

  readonly sinBusqueda = computed(() => this.busqueda().trim().length === 0);
  readonly esSistema = computed(() => this.editando()?.tipo === 'SISTEMA');

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
    icono: ['box'],
    ruta: [''],
    orden: [0],
    activo: [true],
  });

  constructor() {
    if (this.esSuperAdmin()) {
      this.empresasService.listar().subscribe({
        next: (empresas) => {
          this.empresas.set(empresas);
          if (empresas.length > 0) {
            this.empresaId.set(empresas[0].id);
            this.cargar();
          }
        },
        error: (err) => this.toast.error(this.mensaje(err)),
      });
    } else {
      this.cargar();
    }
  }

  seleccionarEmpresa(id: string): void {
    if (!id || id === this.empresaId()) return;
    this.empresaId.set(id);
    this.cargar();
  }

  cargar(): void {
    if (!this.empresaId()) {
      this.modulos.set([]);
      return;
    }
    this.cargando.set(true);
    this.modulosService.listarGestion(this.empresaId()).subscribe({
      next: (modulos) => {
        this.modulos.set(modulos);
        this.cargando.set(false);
      },
      error: (err) => {
        this.toast.error(this.mensaje(err));
        this.cargando.set(false);
      },
    });
  }

  private refrescar(): void {
    this.cargar();
    this.modulosState.cargar();
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.errorModal.set(null);
    this.form.reset({
      nombre: '',
      descripcion: '',
      icono: 'box',
      ruta: '',
      orden: this.modulos().length + 1,
      activo: true,
    });
    this.form.controls.ruta.enable();
    this.modalAbierto.set(true);
  }

  abrirEditar(m: Modulo): void {
    this.editando.set(m);
    this.errorModal.set(null);
    this.form.reset({
      nombre: m.nombre,
      descripcion: m.descripcion ?? '',
      icono: m.icono,
      ruta: m.ruta ?? '',
      orden: m.orden,
      activo: m.activo,
    });
    if (m.tipo === 'SISTEMA') this.form.controls.ruta.disable();
    else this.form.controls.ruta.enable();
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
    this.guardando.set(true);
    this.errorModal.set(null);
    const valor = this.form.getRawValue();
    const editando = this.editando();
    const dto = {
      nombre: valor.nombre,
      descripcion: valor.descripcion || undefined,
      icono: valor.icono,
      ruta: valor.ruta || undefined,
      orden: Number(valor.orden) || 0,
      activo: valor.activo,
    };

    const peticion = editando
      ? this.modulosService.actualizar(editando.id, dto, this.empresaId())
      : this.modulosService.crear(dto, this.empresaId());

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.editando.set(null);
        this.toast.exito(
          editando ? 'Módulo actualizado correctamente' : 'Módulo creado correctamente',
        );
        this.refrescar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorModal.set(this.mensaje(err));
      },
    });
  }

  toggleActivo(m: Modulo): void {
    this.modulosService
      .actualizar(m.id, { activo: !m.activo }, this.empresaId())
      .subscribe({
        next: () => this.refrescar(),
        error: (err) => this.toast.error(this.mensaje(err)),
      });
  }

  mover(m: Modulo, delta: number): void {
    const lista = [...this.modulos()];
    const i = lista.findIndex((x) => x.id === m.id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= lista.length) return;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    this.modulos.set(lista);
    const items = lista.map((x, idx) => ({ id: x.id, orden: idx + 1 }));
    this.modulosService.reordenar(items, this.empresaId()).subscribe({
      next: () => this.refrescar(),
      error: (err) => {
        this.toast.error(this.mensaje(err));
        this.cargar();
      },
    });
  }

  eliminar(m: Modulo): void {
    if (!confirm(`¿Eliminar el módulo ${m.nombre}?`)) return;
    this.modulosService.eliminar(m.id, this.empresaId()).subscribe({
      next: () => {
        this.toast.exito('Módulo eliminado');
        this.refrescar();
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
