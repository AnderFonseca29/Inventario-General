import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { MembresiaService } from '../../core/services/membresia.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { DialogoService } from '../../core/services/dialogo.service';
import {
  Cliente,
  EstadoMembresia,
  ETIQUETA_ESTADO_MEMBRESIA,
  MembresiaCliente,
  PlanMembresia,
} from '../../core/models/membresia.model';
import { IconComponent } from '../../shared/icons';
import { aNumero } from '../../core/utils/numeros';
import { formatearFecha } from '../../core/utils/fechas';

type Tab = 'clientes' | 'planes' | 'membresias';
type Modo = 'cliente' | 'plan' | 'membresia' | 'renovar';

@Component({
  selector: 'app-membresia',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Membresía</div>
        <div class="page-subtitle">
          Clientes, planes de membresía y afiliaciones con vigencia.
        </div>
      </div>
    </div>

    <div class="segmented memb-tabs">
      <button [class.active]="activa() === 'clientes'" (click)="cambiarTab('clientes')">
        Clientes
      </button>
      <button [class.active]="activa() === 'planes'" (click)="cambiarTab('planes')">
        Planes
      </button>
      <button
        [class.active]="activa() === 'membresias'"
        (click)="cambiarTab('membresias')"
      >
        Membresías
      </button>
    </div>

    @if (activa() !== 'membresias') {
      <div class="card">
        <div class="table-toolbar">
          <div class="control-icon search">
            <app-icon name="search" />
            <input
              class="form-control"
              [placeholder]="'Buscar ' + (activa() === 'clientes' ? 'clientes' : 'planes') + '…'"
              [value]="busqueda()"
              (input)="busqueda.set($any($event.target).value)"
            />
          </div>
          <div class="toolbar-actions">
            <button class="btn btn-ghost btn-sm" (click)="refrescar()" title="Actualizar">
              <app-icon name="refresh" /> Actualizar
            </button>
            @if (puedeAdministrar()) {
              <button class="btn btn-primary btn-sm" (click)="abrirCrear()">
                <app-icon name="plus" /> Nuevo
              </button>
            }
          </div>
        </div>

        <div class="table-wrap">
          @if (cargando()) {
            @for (i of [1, 2, 3]; track i) {
              <div class="skeleton-row">
                <div style="flex:1">
                  <div class="skeleton" style="width:25%;margin-bottom:8px"></div>
                  <div class="skeleton" style="width:45%"></div>
                </div>
                <div class="skeleton" style="width:80px"></div>
              </div>
            }
          } @else if (activa() === 'clientes') {
            @if (clientes().length === 0) {
              <div class="empty">
                <app-icon name="users" />
                <div class="empty-title">Sin clientes</div>
                <div>Registra tu primer cliente.</div>
              </div>
            } @else {
              <table class="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Documento</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Membresías</th>
                    <th>Activo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of clientes(); track c.id) {
                    <tr>
                      <td><span class="cell-strong">{{ c.nombre }}</span></td>
                      <td><span class="cell-muted">{{ c.documento ?? '—' }}</span></td>
                      <td><span class="cell-muted">{{ c.telefono ?? '—' }}</span></td>
                      <td><span class="cell-muted">{{ c.email ?? '—' }}</span></td>
                      <td><span class="badge badge-info">{{ c._count?.membresias ?? 0 }}</span></td>
                      <td>
                        <span
                          class="badge"
                          [class.badge-success]="c.activo"
                          [class.badge-muted]="!c.activo"
                        >
                          {{ c.activo ? 'Sí' : 'No' }}
                        </span>
                      </td>
                      <td class="actions">
                        @if (puedeAdministrar()) {
                          <button class="btn btn-ghost btn-sm" (click)="editarCliente(c)" title="Editar">
                            <app-icon name="edit" />
                          </button>
                          <button class="btn btn-danger btn-sm" (click)="eliminarCliente(c)" title="Eliminar">
                            <app-icon name="trash" />
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          } @else {
            @if (planes().length === 0) {
              <div class="empty">
                <app-icon name="spark" />
                <div class="empty-title">Sin planes</div>
                <div>Crea tu primer plan de membresía.</div>
              </div>
            } @else {
              <table class="table">
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Duración</th>
                    <th>Precio</th>
                    <th>Membresías</th>
                    <th>Activo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of planes(); track p.id) {
                    <tr>
                      <td>
                        <span class="cell-strong">{{ p.nombre }}</span>
                        @if (p.descripcion) {
                          <div class="cell-muted">{{ p.descripcion }}</div>
                        }
                      </td>
                      <td><span class="code-pill">{{ p.duracionDias }} días</span></td>
                      <td><span class="cell-muted">{{ dinero(p.precio) }}</span></td>
                      <td><span class="badge badge-info">{{ p._count?.membresias ?? 0 }}</span></td>
                      <td>
                        <span
                          class="badge"
                          [class.badge-success]="p.activo"
                          [class.badge-muted]="!p.activo"
                        >
                          {{ p.activo ? 'Sí' : 'No' }}
                        </span>
                      </td>
                      <td class="actions">
                        @if (puedeAdministrar()) {
                          <button class="btn btn-ghost btn-sm" (click)="editarPlan(p)" title="Editar">
                            <app-icon name="edit" />
                          </button>
                          <button class="btn btn-danger btn-sm" (click)="eliminarPlan(p)" title="Eliminar">
                            <app-icon name="trash" />
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          }
        </div>
      </div>
    } @else {
      <div class="card">
        <div class="table-toolbar">
          <select
            class="form-control memb-filter"
            [value]="filtroEstado()"
            (change)="cambiarFiltro($any($event.target).value)"
          >
            <option value="">Todos los estados</option>
            @for (e of estados; track e) {
              <option [value]="e">{{ etiquetaEstado(e) }}</option>
            }
          </select>
          <div class="toolbar-actions">
            <button class="btn btn-ghost btn-sm" (click)="refrescar()" title="Actualizar">
              <app-icon name="refresh" /> Actualizar
            </button>
            @if (puedeAfiliar()) {
              <button class="btn btn-primary btn-sm" (click)="abrirCrearMembresia()">
                <app-icon name="plus" /> Nueva membresía
              </button>
            }
          </div>
        </div>

        <div class="table-wrap">
          @if (cargando()) {
            @for (i of [1, 2, 3]; track i) {
              <div class="skeleton-row">
                <div style="flex:1">
                  <div class="skeleton" style="width:25%;margin-bottom:8px"></div>
                  <div class="skeleton" style="width:45%"></div>
                </div>
                <div class="skeleton" style="width:80px"></div>
              </div>
            }
          } @else if (membresias().length === 0) {
            <div class="empty">
              <app-icon name="calendar" />
              <div class="empty-title">Sin membresías</div>
              <div>Afiliar un cliente a un plan.</div>
            </div>
          } @else {
            <table class="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Plan</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (m of membresias(); track m.id) {
                  <tr>
                    <td>
                      <span class="cell-strong">{{ m.cliente?.nombre ?? '—' }}</span>
                      @if (m.cliente?.documento) {
                        <div class="cell-muted">{{ m.cliente?.documento }}</div>
                      }
                    </td>
                    <td><span class="cell-muted">{{ m.plan?.nombre ?? '—' }}</span></td>
                    <td><span class="cell-muted">{{ fecha(m.fechaInicio) }}</span></td>
                    <td><span class="cell-muted">{{ fecha(m.fechaFin) }}</span></td>
                    <td>
                      <span [class]="claseEstado(m.estado)">
                        {{ etiquetaEstado(m.estado) }}
                      </span>
                    </td>
                    <td class="actions">
                      @if (puedeAfiliar()) {
                        @if (m.estado === 'ACTIVA' || m.estado === 'VENCIDA') {
                          <button class="btn btn-ghost btn-sm" (click)="abrirRenovar(m)" title="Renovar">
                            <app-icon name="refresh" />
                          </button>
                        }
                        @if (m.estado === 'ACTIVA') {
                          <button class="btn btn-danger btn-sm" (click)="cancelar(m)" title="Cancelar">
                            <app-icon name="close" />
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
    }

    @if (modalAbierto()) {
      <div class="modal-backdrop" (click)="cerrar()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ tituloModal() }}</h3>
            <button class="icon-btn" (click)="cerrar()"><app-icon name="close" /></button>
          </div>

          <form [formGroup]="form" (ngSubmit)="guardar()">
            <div class="modal-body">
              @if (errorModal()) {
                <div class="alert alert-error">
                  <app-icon name="warning" /><span>{{ errorModal() }}</span>
                </div>
              }

              <div class="form-grid">
                @switch (modo()) {
                  @case ('cliente') {
                    <div class="form-group full">
                      <label for="nombre">Nombre</label>
                      <input id="nombre" class="form-control" formControlName="nombre"
                        [class.is-invalid]="form.get('nombre')?.touched && form.get('nombre')?.invalid" />
                    </div>
                    <div class="form-group">
                      <label for="documento">Documento</label>
                      <input id="documento" class="form-control" formControlName="documento" />
                    </div>
                    <div class="form-group">
                      <label for="telefono">Teléfono</label>
                      <input id="telefono" class="form-control" formControlName="telefono" />
                    </div>
                    <div class="form-group">
                      <label for="email">Email</label>
                      <input id="email" type="email" class="form-control" formControlName="email" />
                    </div>
                    <div class="form-group">
                      <label for="direccion">Dirección</label>
                      <input id="direccion" class="form-control" formControlName="direccion" />
                    </div>
                    <label class="check full">
                      <input type="checkbox" formControlName="activo" /> Activo
                    </label>
                  }
                  @case ('plan') {
                    <div class="form-group full">
                      <label for="nombre">Nombre</label>
                      <input id="nombre" class="form-control" formControlName="nombre"
                        [class.is-invalid]="form.get('nombre')?.touched && form.get('nombre')?.invalid" />
                    </div>
                    <div class="form-group full">
                      <label for="descripcion">Descripción</label>
                      <input id="descripcion" class="form-control" formControlName="descripcion" />
                    </div>
                    <div class="form-group">
                      <label for="precio">Precio</label>
                      <input id="precio" type="number" min="0" class="form-control" formControlName="precio" />
                    </div>
                    <div class="form-group">
                      <label for="duracionDias">Duración (días)</label>
                      <input id="duracionDias" type="number" min="1" class="form-control" formControlName="duracionDias"
                        [class.is-invalid]="form.get('duracionDias')?.touched && form.get('duracionDias')?.invalid" />
                    </div>
                    <label class="check full">
                      <input type="checkbox" formControlName="activo" /> Activo
                    </label>
                  }
                  @case ('membresia') {
                    <div class="form-group full">
                      <label for="clienteId">Cliente</label>
                      <select id="clienteId" class="form-control" formControlName="clienteId"
                        [class.is-invalid]="form.get('clienteId')?.touched && form.get('clienteId')?.invalid">
                        <option value="">— Selecciona —</option>
                        @for (c of clientes(); track c.id) {
                          <option [value]="c.id">{{ c.nombre }}</option>
                        }
                      </select>
                    </div>
                    <div class="form-group full">
                      <label for="planId">Plan</label>
                      <select id="planId" class="form-control" formControlName="planId"
                        [class.is-invalid]="form.get('planId')?.touched && form.get('planId')?.invalid">
                        <option value="">— Selecciona —</option>
                        @for (p of planes(); track p.id) {
                          <option [value]="p.id">{{ p.nombre }} ({{ p.duracionDias }} días)</option>
                        }
                      </select>
                    </div>
                    <div class="form-group full">
                      <label for="fechaInicio">Inicio (opcional)</label>
                      <input id="fechaInicio" type="date" class="form-control" formControlName="fechaInicio" />
                    </div>
                  }
                  @case ('renovar') {
                    <p class="memb-nota">
                      Renovar a <strong>{{ renovandoNombre() }}</strong>. La membresía anterior
                      quedará como vencida.
                    </p>
                    <div class="form-group full">
                      <label for="planId">Plan</label>
                      <select id="planId" class="form-control" formControlName="planId">
                        <option value="">Mantener el mismo plan</option>
                        @for (p of planes(); track p.id) {
                          <option [value]="p.id">{{ p.nombre }} ({{ p.duracionDias }} días)</option>
                        }
                      </select>
                    </div>
                    <div class="form-group full">
                      <label for="fechaInicio">Inicio (opcional)</label>
                      <input id="fechaInicio" type="date" class="form-control" formControlName="fechaInicio" />
                    </div>
                  }
                }
              </div>
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
  styleUrl: './membresia.component.scss',
})
export class MembresiaComponent {
  private readonly service = inject(MembresiaService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  private readonly fb = inject(FormBuilder);

  readonly clientes = signal<Cliente[]>([]);
  readonly planes = signal<PlanMembresia[]>([]);
  readonly membresias = signal<MembresiaCliente[]>([]);

  readonly activa = signal<Tab>('clientes');
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly busqueda = signal('');
  readonly filtroEstado = signal<EstadoMembresia | ''>('');

  readonly modalAbierto = signal(false);
  readonly modo = signal<Modo>('cliente');
  readonly editandoId = signal<string | null>(null);
  readonly renovandoId = signal<string | null>(null);
  readonly renovandoNombre = signal('');
  readonly errorModal = signal<string | null>(null);

  readonly estados: EstadoMembresia[] = [
    'ACTIVA',
    'VENCIDA',
    'SUSPENDIDA',
    'CANCELADA',
  ];

  form: FormGroup = this.fb.group({});

  readonly puedeAdministrar = () => this.auth.hasPermiso('membresia.administrar');
  readonly puedeAfiliar = () => this.auth.hasPermiso('membresia.afiliar');

  readonly tituloModal = computed(() => {
    switch (this.modo()) {
      case 'cliente':
        return this.editandoId() ? 'Editar cliente' : 'Nuevo cliente';
      case 'plan':
        return this.editandoId() ? 'Editar plan' : 'Nuevo plan';
      case 'membresia':
        return 'Nueva membresía';
      default:
        return 'Renovar membresía';
    }
  });

  constructor() {
    this.cargar();
  }

  // ------------------------------- Utilidades ------------------------------

  dinero(valor: unknown): string {
    if (valor == null || valor === '') return '—';
    return Number(valor).toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  fecha(valor: string): string {
    if (!valor) return '—';
    return formatearFecha(valor);
  }

  etiquetaEstado(estado: EstadoMembresia): string {
    return ETIQUETA_ESTADO_MEMBRESIA[estado] ?? estado;
  }

  claseEstado(estado: EstadoMembresia): string {
    switch (estado) {
      case 'ACTIVA':
        return 'badge badge-success';
      case 'VENCIDA':
        return 'badge badge-warn';
      case 'SUSPENDIDA':
        return 'badge badge-info';
      default:
        return 'badge badge-muted';
    }
  }

  // --------------------------------- Carga ---------------------------------

  cambiarTab(tab: Tab): void {
    if (this.activa() === tab) return;
    this.activa.set(tab);
    this.busqueda.set('');
    this.cargar();
  }

  cambiarFiltro(valor: string): void {
    this.filtroEstado.set(valor as EstadoMembresia | '');
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.fuente().subscribe({
      next: () => this.cargando.set(false),
      error: (err: unknown) => {
        this.toast.error(this.mensaje(err));
        this.cargando.set(false);
      },
    });
  }

  refrescar(): void {
    this.cargar();
  }

  private fuente(): Observable<unknown> {
    const buscar = this.busqueda().trim();
    switch (this.activa()) {
      case 'clientes':
        return this.service.listarClientes(buscar || undefined);
      case 'planes':
        return this.service.listarPlanes(buscar || undefined);
      default:
        return this.service.listarMembresias(
          this.filtroEstado() || undefined,
        );
    }
  }

  // --------------------------------- Modal ---------------------------------

  private base(controles: Record<string, unknown>): void {
    const grupo = this.fb.group({});
    for (const [key, inicial] of Object.entries(controles)) {
      grupo.addControl(key, this.fb.control(inicial));
    }
    this.form = grupo;
  }

  abrirCrear(): void {
    this.editandoId.set(null);
    this.errorModal.set(null);
    if (this.activa() === 'clientes') {
      this.modo.set('cliente');
      this.base({
        nombre: ['', Validators.required],
        documento: '',
        telefono: '',
        email: '',
        direccion: '',
        activo: true,
      });
    } else {
      this.modo.set('plan');
      this.base({
        nombre: ['', Validators.required],
        descripcion: '',
        precio: 0,
        duracionDias: [30, Validators.required],
        activo: true,
      });
    }
    this.modalAbierto.set(true);
  }

  editarCliente(c: Cliente): void {
    this.modo.set('cliente');
    this.editandoId.set(c.id);
    this.errorModal.set(null);
    this.base({
      nombre: [c.nombre, Validators.required],
      documento: c.documento ?? '',
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      direccion: c.direccion ?? '',
      activo: c.activo,
    });
    this.modalAbierto.set(true);
  }

  editarPlan(p: PlanMembresia): void {
    this.modo.set('plan');
    this.editandoId.set(p.id);
    this.errorModal.set(null);
    this.base({
      nombre: [p.nombre, Validators.required],
      descripcion: p.descripcion ?? '',
      precio: aNumero(p.precio) ?? 0,
      duracionDias: [p.duracionDias, Validators.required],
      activo: p.activo,
    });
    this.modalAbierto.set(true);
  }

  abrirCrearMembresia(): void {
    this.modo.set('membresia');
    this.editandoId.set(null);
    this.errorModal.set(null);
    this.base({
      clienteId: ['', Validators.required],
      planId: ['', Validators.required],
      fechaInicio: '',
    });
    this.modalAbierto.set(true);
  }

  abrirRenovar(m: MembresiaCliente): void {
    this.modo.set('renovar');
    this.renovandoId.set(m.id);
    this.renovandoNombre.set(m.cliente?.nombre ?? '');
    this.errorModal.set(null);
    this.base({ planId: '', fechaInicio: '' });
    this.modalAbierto.set(true);
  }

  cerrar(): void {
    this.modalAbierto.set(false);
    this.editandoId.set(null);
    this.renovandoId.set(null);
    this.errorModal.set(null);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.errorModal.set(null);
    const peticion = this.peticionGuardar();
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.editandoId.set(null);
        this.renovandoId.set(null);
        this.toast.exito('Operación realizada');
        this.cargar();
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.errorModal.set(this.mensaje(err));
      },
    });
  }

  private peticionGuardar(): Observable<unknown> {
    const v = this.form.getRawValue() as Record<string, unknown>;
    const id = this.editandoId();
    switch (this.modo()) {
      case 'cliente': {
        const dto = {
          nombre: String(v['nombre']).trim(),
          documento: this.limpiar(v['documento']),
          telefono: this.limpiar(v['telefono']),
          email: this.limpiar(v['email']),
          direccion: this.limpiar(v['direccion']),
          activo: Boolean(v['activo']),
        };
        return id
          ? this.service.actualizarCliente(id, dto)
          : this.service.crearCliente(dto);
      }
      case 'plan': {
        const dto = {
          nombre: String(v['nombre']).trim(),
          descripcion: this.limpiar(v['descripcion']),
          precio: aNumero(v['precio']) ?? 0,
          duracionDias: Number(v['duracionDias']),
          activo: Boolean(v['activo']),
        };
        return id
          ? this.service.actualizarPlan(id, dto)
          : this.service.crearPlan(dto);
      }
      case 'membresia':
        return this.service.crearMembresia({
          clienteId: String(v['clienteId']),
          planId: String(v['planId']),
          fechaInicio: this.limpiar(v['fechaInicio']),
        });
      default: {
        const renovando = this.renovandoId()!;
        return this.service.renovarMembresia(renovando, {
          planId: this.limpiar(v['planId']),
          fechaInicio: this.limpiar(v['fechaInicio']),
        });
      }
    }
  }

  eliminarCliente(c: Cliente): void {
    void this.confirmarEliminarCliente(c);
  }

  private async confirmarEliminarCliente(c: Cliente): Promise<void> {
    const ok = await this.dialogo.confirmar({
      titulo: 'Eliminar cliente',
      mensaje: `¿Eliminar el cliente ${c.nombre}?`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    this.service.eliminarCliente(c.id).subscribe({
      next: () => {
        this.toast.exito('Cliente eliminado');
        this.cargar();
      },
      error: (err: unknown) => this.toast.error(this.mensaje(err)),
    });
  }

  eliminarPlan(p: PlanMembresia): void {
    void this.confirmarEliminarPlan(p);
  }

  private async confirmarEliminarPlan(p: PlanMembresia): Promise<void> {
    const ok = await this.dialogo.confirmar({
      titulo: 'Eliminar plan',
      mensaje: `¿Eliminar el plan ${p.nombre}?`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    this.service.eliminarPlan(p.id).subscribe({
      next: () => {
        this.toast.exito('Plan eliminado');
        this.cargar();
      },
      error: (err: unknown) => this.toast.error(this.mensaje(err)),
    });
  }

  cancelar(m: MembresiaCliente): void {
    void this.confirmarCancelar(m);
  }

  private async confirmarCancelar(m: MembresiaCliente): Promise<void> {
    const ok = await this.dialogo.confirmar({
      titulo: 'Cancelar membresía',
      mensaje: `¿Cancelar la membresía de ${m.cliente?.nombre ?? 'el cliente'}?`,
      textoConfirmar: 'Cancelar membresía',
      peligro: true,
    });
    if (!ok) return;
    this.service.cancelarMembresia(m.id).subscribe({
      next: () => {
        this.toast.exito('Membresía cancelada');
        this.cargar();
      },
      error: (err: unknown) => this.toast.error(this.mensaje(err)),
    });
  }

  private limpiar(valor: unknown): string | undefined {
    if (typeof valor !== 'string') return undefined;
    const texto = valor.trim();
    return texto === '' ? undefined : texto;
  }

  private mensaje(err: unknown): string {
    const e = err as {
      error?: { message?: string | string[] };
      message?: string;
    };
    const msg = e?.error?.message ?? e?.message ?? 'Ocurrió un error';
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
}
