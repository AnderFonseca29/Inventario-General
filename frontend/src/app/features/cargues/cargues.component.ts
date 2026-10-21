import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarguesService } from '../../core/services/cargues.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Bodega, Producto } from '../../core/models/catalogo.model';
import {
  Cargue,
  CargueResumen,
  EstadoCargue,
  ETIQUETA_ESTADO_CARGUE,
  VendedorOpcion,
} from '../../core/models/cargues.model';
import { IconComponent } from '../../shared/icons';

@Component({
  selector: 'app-cargues',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Cargues</div>
        <div class="page-subtitle">
          Cargues de productos desde bodega hacia vendedores.
        </div>
      </div>
      @if (puedeCrear()) {
        <button class="btn btn-primary" (click)="abrirNuevo()">
          <app-icon name="plus" /> Nuevo cargue
        </button>
      }
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="filtros">
          <select class="form-control" [value]="fEstado()" (change)="onEstadoChange($event)">
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="CONFIRMADO">Confirmado</option>
            <option value="ANULADO">Anulado</option>
          </select>
          <div class="control-icon search">
            <app-icon name="search" />
            <input class="form-control" placeholder="Buscar consecutivo o vendedor…"
              [value]="fBuscar()" (input)="fBuscar.set($any($event.target).value)"
              (keyup.enter)="cargar()" />
          </div>
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
                <div class="skeleton" style="width:50%"></div>
              </div>
              <div class="skeleton" style="width:80px"></div>
            </div>
          }
        } @else if (cargues().length === 0) {
          <div class="empty">
            <app-icon name="truck" />
            <div class="empty-title">Sin cargues</div>
            <div>No hay cargues registrados con los filtros actuales.</div>
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Consecutivo</th>
                <th>Vendedor</th>
                <th>Bodega origen</th>
                <th class="ta-right">Ítems</th>
                <th class="ta-right">Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (c of cargues(); track c.id) {
                <tr>
                  <td><span class="code-pill">{{ c.consecutivo }}</span></td>
                  <td>
                    <span class="cell-strong">{{ c.vendedor?.nombre }}</span>
                    <div class="cell-muted">{{ c.vendedor?.email }}</div>
                  </td>
                  <td class="cell-muted">{{ c.bodegaOrigen?.nombre ?? '—' }}</td>
                  <td class="ta-right">
                    <span class="badge badge-muted">{{ c._count?.detalles ?? 0 }}</span>
                  </td>
                  <td class="ta-right"><span class="qty">{{ dinero(c.totalCosto) }}</span></td>
                  <td><span [class]="'badge ' + claseEstado(c.estado)">{{ etiquetaEstado(c.estado) }}</span></td>
                  <td class="cell-muted">{{ fecha(c.creadoEn) }}</td>
                  <td class="actions">
                    <button class="btn btn-ghost btn-sm" (click)="verDetalle(c)" title="Ver detalle">
                      <app-icon name="eye" />
                    </button>
                    @if (c.estado === 'BORRADOR' && puedeConfirmar()) {
                      <button class="btn btn-ghost btn-sm" (click)="confirmar(c)" title="Confirmar">
                        <app-icon name="check" />
                      </button>
                    }
                    @if (c.estado !== 'ANULADO' && puedeAnular()) {
                      <button class="btn btn-danger btn-sm" (click)="anular(c)" title="Anular">
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
            <h3>{{ detalle() ? detalle()!.consecutivo : 'Nuevo cargue' }}</h3>
            <button class="icon-btn" (click)="cerrar()"><app-icon name="close" /></button>
          </div>

          @if (detalle(); as cargue) {
            <div class="modal-body">
              <div class="detalle-grid">
                <div>
                  <span class="detalle-label">Estado</span>
                  <span [class]="'badge ' + claseEstado(cargue.estado)">{{ etiquetaEstado(cargue.estado) }}</span>
                </div>
                <div>
                  <span class="detalle-label">Vendedor</span>
                  <span>{{ cargue.vendedor?.nombre }}</span>
                </div>
                <div>
                  <span class="detalle-label">Bodega origen</span>
                  <span>{{ cargue.bodegaOrigen?.nombre ?? '—' }}</span>
                </div>
                <div>
                  <span class="detalle-label">Creado por</span>
                  <span>{{ cargue.usuario?.nombre }}</span>
                </div>
                <div>
                  <span class="detalle-label">Fecha</span>
                  <span>{{ fecha(cargue.creadoEn) }}</span>
                </div>
                <div>
                  <span class="detalle-label">Confirmado</span>
                  <span>{{ fecha(cargue.confirmadoEn) }}</span>
                </div>
              </div>
              @if (cargue.observaciones) {
                <p class="obs">{{ cargue.observaciones }}</p>
              }
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="ta-right">Cantidad</th>
                    <th class="ta-right">Costo</th>
                    <th class="ta-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (det of cargue.detalles; track det.id) {
                    <tr>
                      <td>{{ det.nombreSnapshot || det.producto?.nombre }}</td>
                      <td class="ta-right">{{ numero(det.cantidad) }}</td>
                      <td class="ta-right cell-muted">{{ dinero(det.costoUnitario) }}</td>
                      <td class="ta-right"><span class="qty">{{ dinero(det.subtotal) }}</span></td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="ta-right cell-muted">Total</td>
                    <td class="ta-right"><span class="qty">{{ dinero(cargue.totalCosto) }}</span></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="modal-footer">
              @if (cargue.estado === 'BORRADOR' && puedeConfirmar()) {
                <button class="btn btn-primary" (click)="confirmar(cargue, true)">Confirmar</button>
              }
              @if (cargue.estado !== 'ANULADO' && puedeAnular()) {
                <button class="btn btn-danger" (click)="anular(cargue, true)">Anular</button>
              }
              <button class="btn btn-ghost" (click)="cerrar()">Cerrar</button>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="guardar()">
              <div class="modal-body">
                @if (errorModal()) {
                  <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
                }
                <div class="form-row">
                  <div class="form-group">
                    <label for="bodegaOrigenId">Bodega origen</label>
                    <select id="bodegaOrigenId" class="form-control" formControlName="bodegaOrigenId">
                      <option value="">Selecciona…</option>
                      @for (b of bodegas(); track b.id) {
                        <option [value]="b.id">{{ b.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="vendedorId">Vendedor</label>
                    <select id="vendedorId" class="form-control" formControlName="vendedorId">
                      <option value="">Selecciona…</option>
                      @for (v of vendedores(); track v.id) {
                        <option [value]="v.id">{{ v.nombre }} · {{ v.email }}</option>
                      }
                    </select>
                    @if (vendedores().length === 0) {
                      <small class="hint">No hay usuarios disponibles como vendedor.</small>
                    }
                  </div>
                  <div class="form-group full">
                    <label for="observaciones">Observaciones (opcional)</label>
                    <input id="observaciones" class="form-control" formControlName="observaciones" />
                  </div>
                </div>

                <div class="lineas-head">
                  <label>Detalle</label>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="agregarLinea()">
                    <app-icon name="plus" /> Agregar
                  </button>
                </div>

                <div formArrayName="detalles" class="lineas">
                  @for (linea of detalles.controls; track $index; let i = $index) {
                    <div [formGroupName]="i" class="linea">
                      <select class="form-control" formControlName="productoId">
                        <option value="">Producto…</option>
                        @for (p of productos(); track p.id) {
                          <option [value]="p.id">{{ p.sku }} · {{ p.nombre }}</option>
                        }
                      </select>
                      <input class="form-control" type="number" step="any" min="0"
                        formControlName="cantidad" placeholder="Cantidad" />
                      <input class="form-control" type="number" step="any" min="0"
                        formControlName="costoUnitario" placeholder="Costo (opcional)" />
                      <button type="button" class="btn btn-danger btn-sm" (click)="quitarLinea(i)"
                        [disabled]="detalles.length === 1">
                        <app-icon name="trash" />
                      </button>
                    </div>
                  }
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="cerrar()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  {{ guardando() ? 'Guardando…' : 'Crear cargue' }}
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './cargues.component.scss',
})
export class CarguesComponent {
  private readonly carguesSrv = inject(CarguesService);
  private readonly catalogos = inject(CatalogosService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly bodegas = signal<Bodega[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly vendedores = signal<VendedorOpcion[]>([]);

  readonly cargues = signal<CargueResumen[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);

  readonly fEstado = signal<EstadoCargue | ''>('');
  readonly fBuscar = signal('');

  readonly modalAbierto = signal(false);
  readonly detalle = signal<Cargue | null>(null);
  readonly errorModal = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    bodegaOrigenId: ['', [Validators.required]],
    vendedorId: ['', [Validators.required]],
    observaciones: [''],
    detalles: this.fb.array([this.nuevaLinea()]),
  });

  readonly puedeCrear = () => this.auth.hasPermiso('cargues.crear');
  readonly puedeConfirmar = () => this.auth.hasPermiso('cargues.confirmar');
  readonly puedeAnular = () => this.auth.hasPermiso('cargues.anular');

  get detalles(): FormArray {
    return this.form.controls.detalles;
  }

  constructor() {
    this.catalogos.listarBodegas().subscribe({ next: (r) => this.bodegas.set(r) });
    this.catalogos.listarProductos().subscribe({ next: (r) => this.productos.set(r) });
    if (this.puedeCrear()) {
      this.carguesSrv.listarVendedores().subscribe({
        next: (r) => this.vendedores.set(r),
        error: () => this.vendedores.set([]),
      });
    }
    this.cargar();
  }

  private nuevaLinea() {
    return this.fb.nonNullable.group({
      productoId: ['', [Validators.required]],
      cantidad: [1 as number, [Validators.required]],
      costoUnitario: [''],
    });
  }

  onEstadoChange(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.fEstado.set((valor || '') as EstadoCargue | '');
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.carguesSrv
      .listar({
        estado: this.fEstado() || undefined,
        buscar: this.fBuscar() || undefined,
      })
      .subscribe({
        next: (r) => {
          this.cargues.set(r);
          this.cargando.set(false);
        },
        error: (e) => {
          this.toast.error(this.mensaje(e));
          this.cargando.set(false);
        },
      });
  }

  // --------------------------------- Modal ---------------------------------

  abrirNuevo(): void {
    this.detalle.set(null);
    this.errorModal.set(null);
    this.form.reset({ bodegaOrigenId: '', vendedorId: '', observaciones: '' });
    this.detalles.clear();
    this.detalles.push(this.nuevaLinea());
    this.modalAbierto.set(true);
  }

  cerrar(): void {
    this.modalAbierto.set(false);
    this.detalle.set(null);
  }

  agregarLinea(): void {
    this.detalles.push(this.nuevaLinea());
  }

  quitarLinea(i: number): void {
    if (this.detalles.length > 1) this.detalles.removeAt(i);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorModal.set('Completa la bodega, el vendedor y el detalle');
      return;
    }
    const valor = this.form.getRawValue();
    const lineas = valor.detalles
      .filter((d) => d.productoId)
      .map((d) => ({
        productoId: d.productoId,
        cantidad: Number(d.cantidad),
        costoUnitario:
          d.costoUnitario === '' || d.costoUnitario == null
            ? undefined
            : Number(d.costoUnitario),
      }));
    if (lineas.length === 0) {
      this.errorModal.set('Agrega al menos un producto');
      return;
    }
    if (lineas.some((d) => !(d.cantidad > 0))) {
      this.errorModal.set('La cantidad debe ser mayor a cero');
      return;
    }

    this.guardando.set(true);
    this.errorModal.set(null);
    this.carguesSrv
      .crear({
        bodegaOrigenId: valor.bodegaOrigenId,
        vendedorId: valor.vendedorId,
        observaciones: valor.observaciones || undefined,
        detalles: lineas,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.modalAbierto.set(false);
          this.toast.exito('Cargue creado en borrador');
          this.cargar();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorModal.set(this.mensaje(err));
        },
      });
  }

  verDetalle(cargue: CargueResumen): void {
    this.detalle.set(null);
    this.errorModal.set(null);
    this.modalAbierto.set(true);
    this.carguesSrv.obtener(cargue.id).subscribe({
      next: (c) => this.detalle.set(c),
      error: (err) => {
        this.modalAbierto.set(false);
        this.toast.error(this.mensaje(err));
      },
    });
  }

  confirmar(cargue: CargueResumen, enModal = false): void {
    this.carguesSrv.confirmar(cargue.id).subscribe({
      next: () => {
        this.toast.exito('Cargue confirmado: stock descontado de la bodega');
        if (enModal) this.modalAbierto.set(false);
        this.cargar();
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  anular(cargue: CargueResumen, enModal = false): void {
    if (!confirm(`¿Anular el cargue ${cargue.consecutivo}?`)) return;
    this.carguesSrv.anular(cargue.id).subscribe({
      next: () => {
        this.toast.exito('Cargue anulado');
        if (enModal) this.modalAbierto.set(false);
        this.cargar();
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  // ------------------------------- Formato ---------------------------------

  numero(valor: unknown): string {
    if (valor == null || valor === '') return '0';
    return Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 4 });
  }

  dinero(valor: unknown): string {
    if (valor == null || valor === '') return '—';
    return Number(valor).toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  fecha(valor: string | null): string {
    if (!valor) return '—';
    return new Date(valor).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  etiquetaEstado(estado: EstadoCargue): string {
    return ETIQUETA_ESTADO_CARGUE[estado] ?? estado;
  }

  claseEstado(estado: EstadoCargue): string {
    switch (estado) {
      case 'CONFIRMADO':
        return 'badge-success';
      case 'ANULADO':
        return 'badge-danger';
      default:
        return 'badge-muted';
    }
  }

  private mensaje(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message ?? e?.message ?? 'Ocurrió un error';
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
}
