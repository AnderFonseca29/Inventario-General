import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  InventarioService,
} from '../../core/services/inventario.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Bodega, Producto } from '../../core/models/catalogo.model';
import {
  Documento,
  DocumentoResumen,
  ETIQUETA_ESTADO,
  ETIQUETA_MOVIMIENTO,
  EstadoDocumento,
  Existencia,
  Movimiento,
  TipoMovimiento,
  TipoMovimientoManual,
} from '../../core/models/inventario.model';
import { IconComponent } from '../../shared/icons';
import { aNumero } from '../../core/utils/numeros';

@Component({
  selector: 'app-inventario',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Inventario</div>
        <div class="page-subtitle">
          Existencias, movimientos y documentos de inventario.
        </div>
      </div>
      @if (puedeOperar()) {
        <button class="btn btn-primary" (click)="abrirNuevo()">
          <app-icon name="plus" /> Nuevo documento
        </button>
      }
    </div>

    <div class="segmented inv-tabs">
      <button [class.active]="activa() === 'existencias'" (click)="cambiarTab('existencias')">
        Existencias
      </button>
      <button [class.active]="activa() === 'movimientos'" (click)="cambiarTab('movimientos')">
        Movimientos
      </button>
      <button [class.active]="activa() === 'documentos'" (click)="cambiarTab('documentos')">
        Documentos
      </button>
    </div>

    <div class="card">
      <div class="table-toolbar">
        @switch (activa()) {
          @case ('existencias') {
            <div class="filtros">
              <select class="form-control" [value]="fBodega()" (change)="fBodega.set($any($event.target).value); cargar()">
                <option value="">Todas las bodegas</option>
                @for (b of bodegas(); track b.id) {
                  <option [value]="b.id">{{ b.nombre }}</option>
                }
              </select>
              <div class="control-icon search">
                <app-icon name="search" />
                <input class="form-control" placeholder="Buscar producto…"
                  [value]="fBuscar()" (input)="fBuscar.set($any($event.target).value)" (keyup.enter)="cargar()" />
              </div>
            </div>
          }
          @case ('movimientos') {
            <div class="filtros">
              <select class="form-control" [value]="fBodega()" (change)="fBodega.set($any($event.target).value); cargar()">
                <option value="">Todas las bodegas</option>
                @for (b of bodegas(); track b.id) {
                  <option [value]="b.id">{{ b.nombre }}</option>
                }
              </select>
            </div>
          }
          @case ('documentos') {
            <div class="filtros">
              <select class="form-control" [value]="fEstado()" (change)="fEstado.set($any($event.target).value); cargar()">
                <option value="">Todos los estados</option>
                <option value="BORRADOR">Borrador</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="ANULADO">Anulado</option>
              </select>
            </div>
          }
        }
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
        } @else if (vacio()) {
          <div class="empty">
            <app-icon name="box" />
            <div class="empty-title">Sin registros</div>
            <div>No hay información para mostrar en esta vista.</div>
          </div>
        } @else {
          @switch (activa()) {
            @case ('existencias') {
              <table class="table">
                <thead>
                  <tr><th>Producto</th><th>SKU</th><th>Bodega</th><th class="ta-right">Cantidad</th></tr>
                </thead>
                <tbody>
                  @for (e of existencias(); track e.id) {
                    <tr>
                      <td><span class="cell-strong">{{ e.producto.nombre }}</span></td>
                      <td><span class="code-pill">{{ e.producto.sku }}</span></td>
                      <td class="cell-muted">{{ e.bodega.nombre }}</td>
                      <td class="ta-right"><span class="qty">{{ numero(e.cantidad) }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            }
            @case ('movimientos') {
              <table class="table">
                <thead>
                  <tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th>Bodega</th><th class="ta-right">Cantidad</th><th>Usuario</th></tr>
                </thead>
                <tbody>
                  @for (m of movimientos(); track m.id) {
                    <tr>
                      <td class="cell-muted">{{ fecha(m.creadoEn) }}</td>
                      <td><span [class]="'badge ' + claseTipo(m.tipo)">{{ etiquetaTipo(m.tipo) }}</span></td>
                      <td><span class="cell-strong">{{ m.producto.nombre }}</span></td>
                      <td class="cell-muted">{{ m.bodega.nombre }}</td>
                      <td class="ta-right"><span class="qty" [class.neg]="+m.cantidad < 0">{{ numero(m.cantidad) }}</span></td>
                      <td class="cell-muted">{{ m.usuario?.nombre }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
            @case ('documentos') {
              <table class="table">
                <thead>
                  <tr><th>Consecutivo</th><th>Tipo</th><th>Estado</th><th>Origen</th><th>Destino</th><th>Ítems</th><th>Fecha</th><th></th></tr>
                </thead>
                <tbody>
                  @for (d of documentos(); track d.id) {
                    <tr>
                      <td><span class="code-pill">{{ d.consecutivo }}</span></td>
                      <td><span [class]="'badge ' + claseTipo(d.tipo)">{{ etiquetaTipo(d.tipo) }}</span></td>
                      <td><span [class]="'badge ' + claseEstado(d.estado)">{{ etiquetaEstado(d.estado) }}</span></td>
                      <td class="cell-muted">{{ d.bodega?.nombre ?? '—' }}</td>
                      <td class="cell-muted">{{ d.bodegaDestino?.nombre ?? '—' }}</td>
                      <td><span class="badge badge-muted">{{ d._count.detalles }}</span></td>
                      <td class="cell-muted">{{ fecha(d.creadoEn) }}</td>
                      <td class="actions">
                        <button class="btn btn-ghost btn-sm" (click)="verDetalle(d)" title="Ver detalle">
                          <app-icon name="eye" />
                        </button>
                        @if (d.estado === 'BORRADOR' && puedeConfirmar()) {
                          <button class="btn btn-ghost btn-sm" (click)="confirmar(d)" title="Confirmar">
                            <app-icon name="check" />
                          </button>
                        }
                        @if (d.estado !== 'ANULADO' && puedeAnular()) {
                          <button class="btn btn-danger btn-sm" (click)="anular(d)" title="Anular">
                            <app-icon name="close" />
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          }
        }
      </div>
    </div>

    @if (modalDoc()) {
      <div class="modal-backdrop" (click)="cerrarDoc()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ detalle() ? detalle()!.consecutivo : 'Nuevo documento' }}</h3>
            <button class="icon-btn" (click)="cerrarDoc()"><app-icon name="close" /></button>
          </div>

          @if (detalle(); as doc) {
            <div class="modal-body">
              <div class="detalle-grid">
                <div><span class="detalle-label">Tipo</span><span [class]="'badge ' + claseTipo(doc.tipo)">{{ etiquetaTipo(doc.tipo) }}</span></div>
                <div><span class="detalle-label">Estado</span><span [class]="'badge ' + claseEstado(doc.estado)">{{ etiquetaEstado(doc.estado) }}</span></div>
                <div><span class="detalle-label">Origen</span><span>{{ doc.bodega?.nombre ?? '—' }}</span></div>
                <div><span class="detalle-label">Destino</span><span>{{ doc.bodegaDestino?.nombre ?? '—' }}</span></div>
                <div><span class="detalle-label">Creado por</span><span>{{ doc.usuario?.nombre }}</span></div>
                <div><span class="detalle-label">Fecha</span><span>{{ fecha(doc.creadoEn) }}</span></div>
              </div>
              @if (doc.observaciones) {
                <p class="obs">{{ doc.observaciones }}</p>
              }
              <table class="table table-sm">
                <thead>
                  <tr><th>Producto</th><th class="ta-right">Cantidad</th><th class="ta-right">Costo</th></tr>
                </thead>
                <tbody>
                  @for (det of doc.detalles; track det.id) {
                    <tr>
                      <td>{{ det.nombreSnapshot || det.producto?.nombre }}</td>
                      <td class="ta-right">{{ numero(det.cantidad) }}</td>
                      <td class="ta-right cell-muted">{{ dinero(det.costoUnitario) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="modal-footer">
              @if (doc.estado === 'BORRADOR' && puedeConfirmar()) {
                <button class="btn btn-primary" (click)="confirmar(doc, true)">Confirmar</button>
              }
              @if (doc.estado !== 'ANULADO' && puedeAnular()) {
                <button class="btn btn-danger" (click)="anular(doc, true)">Anular</button>
              }
              <button class="btn btn-ghost" (click)="cerrarDoc()">Cerrar</button>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="guardar()">
              <div class="modal-body">
                @if (errorModal()) {
                  <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
                }
                <div class="form-row">
                  <div class="form-group">
                    <label for="tipo">Tipo de documento</label>
                    <select id="tipo" class="form-control" formControlName="tipo" (change)="onTipoChange()">
                      @for (t of tiposManuales; track t) {
                        <option [value]="t">{{ etiquetaTipo(t) }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="bodegaId">{{ esTransferencia() ? 'Bodega origen' : 'Bodega' }}</label>
                    <select id="bodegaId" class="form-control" formControlName="bodegaId">
                      <option value="">Selecciona…</option>
                      @for (b of bodegas(); track b.id) {
                        <option [value]="b.id">{{ b.nombre }}</option>
                      }
                    </select>
                  </div>
                  @if (esTransferencia()) {
                    <div class="form-group">
                      <label for="bodegaDestinoId">Bodega destino</label>
                      <select id="bodegaDestinoId" class="form-control" formControlName="bodegaDestinoId">
                        <option value="">Selecciona…</option>
                        @for (b of bodegas(); track b.id) {
                          <option [value]="b.id">{{ b.nombre }}</option>
                        }
                      </select>
                    </div>
                  }
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
                      <input class="form-control" type="number" step="any" formControlName="cantidad"
                        [placeholder]="esAjuste() ? '± cantidad' : 'Cantidad'" />
                      <input class="form-control" type="number" step="any" formControlName="costoUnitario" placeholder="Costo (opcional)" />
                      <button type="button" class="btn btn-danger btn-sm" (click)="quitarLinea(i)" [disabled]="detalles.length === 1">
                        <app-icon name="trash" />
                      </button>
                    </div>
                  }
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="cerrarDoc()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  {{ guardando() ? 'Guardando…' : 'Crear documento' }}
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './inventario.component.scss',
})
export class InventarioComponent {
  private readonly inventario = inject(InventarioService);
  private readonly catalogos = inject(CatalogosService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly tiposManuales: TipoMovimientoManual[] = [
    'ENTRADA',
    'SALIDA',
    'AJUSTE',
    'TRANSFERENCIA',
  ];

  readonly bodegas = signal<Bodega[]>([]);
  readonly productos = signal<Producto[]>([]);

  readonly activa = signal('existencias');
  readonly existencias = signal<Existencia[]>([]);
  readonly movimientos = signal<Movimiento[]>([]);
  readonly documentos = signal<DocumentoResumen[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);

  readonly fBodega = signal('');
  readonly fBuscar = signal('');
  readonly fEstado = signal('');

  readonly modalDoc = signal(false);
  readonly detalle = signal<Documento | null>(null);
  readonly errorModal = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    tipo: ['ENTRADA' as TipoMovimientoManual, [Validators.required]],
    bodegaId: ['', [Validators.required]],
    bodegaDestinoId: [''],
    observaciones: [''],
    detalles: this.fb.array([this.nuevaLinea()]),
  });

  readonly puedeOperar = () => this.auth.hasPermiso('inventario.operar');
  readonly puedeConfirmar = () => this.auth.hasPermiso('inventario.confirmar');
  readonly puedeAnular = () => this.auth.hasPermiso('inventario.anular');

  esTransferencia(): boolean {
    return this.form.controls.tipo.value === 'TRANSFERENCIA';
  }

  esAjuste(): boolean {
    return this.form.controls.tipo.value === 'AJUSTE';
  }

  readonly vacio = computed(() => {
    switch (this.activa()) {
      case 'movimientos':
        return this.movimientos().length === 0;
      case 'documentos':
        return this.documentos().length === 0;
      default:
        return this.existencias().length === 0;
    }
  });

  get detalles(): FormArray {
    return this.form.controls.detalles;
  }

  constructor() {
    this.catalogos.listarBodegas().subscribe({ next: (r) => this.bodegas.set(r) });
    this.catalogos.listarProductos().subscribe({ next: (r) => this.productos.set(r) });
    this.cargar();
  }

  private nuevaLinea() {
    return this.fb.nonNullable.group({
      productoId: ['', [Validators.required]],
      cantidad: [1 as number, [Validators.required]],
      costoUnitario: [''],
    });
  }

  cambiarTab(key: string): void {
    if (this.activa() === key) return;
    this.activa.set(key);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    const key = this.activa();
    if (key === 'movimientos') {
      this.inventario
        .listarMovimientos({ bodegaId: this.fBodega() || undefined })
        .subscribe({
          next: (r) => {
            this.movimientos.set(r);
            this.cargando.set(false);
          },
          error: (e) => this.fallo(e),
        });
      return;
    }
    if (key === 'documentos') {
      this.inventario
        .listarDocumentos((this.fEstado() || undefined) as EstadoDocumento | undefined)
        .subscribe({
          next: (r) => {
            this.documentos.set(r);
            this.cargando.set(false);
          },
          error: (e) => this.fallo(e),
        });
      return;
    }
    this.inventario
      .listarExistencias({
        bodegaId: this.fBodega() || undefined,
        buscar: this.fBuscar() || undefined,
        soloConStock: true,
      })
      .subscribe({
        next: (r) => {
          this.existencias.set(r);
          this.cargando.set(false);
        },
        error: (e) => this.fallo(e),
      });
  }

  private fallo(err: unknown): void {
    this.toast.error(this.mensaje(err));
    this.cargando.set(false);
  }

  // --------------------------------- Modal ---------------------------------

  abrirNuevo(): void {
    this.detalle.set(null);
    this.errorModal.set(null);
    this.form.reset({
      tipo: 'ENTRADA',
      bodegaId: '',
      bodegaDestinoId: '',
      observaciones: '',
    });
    this.detalles.clear();
    this.detalles.push(this.nuevaLinea());
    this.modalDoc.set(true);
  }

  cerrarDoc(): void {
    this.modalDoc.set(false);
    this.detalle.set(null);
  }

  onTipoChange(): void {
    if (!this.esTransferencia()) {
      this.form.controls.bodegaDestinoId.setValue('');
    }
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
      this.errorModal.set('Completa el tipo, la bodega y el detalle');
      return;
    }
    const valor = this.form.getRawValue();
    if (valor.tipo === 'TRANSFERENCIA') {
      if (!valor.bodegaDestinoId) {
        this.errorModal.set('Selecciona la bodega destino');
        return;
      }
      if (valor.bodegaDestinoId === valor.bodegaId) {
        this.errorModal.set('La bodega destino debe ser diferente');
        return;
      }
    }
    const detalles = valor.detalles
      .filter((d) => d.productoId)
      .map((d) => ({
        productoId: d.productoId,
        cantidad: aNumero(d.cantidad) ?? 0,
        costoUnitario:
          d.costoUnitario === '' || d.costoUnitario == null
            ? undefined
            : aNumero(d.costoUnitario),
      }));
    if (detalles.length === 0) {
      this.errorModal.set('Agrega al menos un producto');
      return;
    }

    this.guardando.set(true);
    this.errorModal.set(null);
    this.inventario
      .crearDocumento({
        tipo: valor.tipo,
        bodegaId: valor.bodegaId,
        bodegaDestinoId:
          valor.tipo === 'TRANSFERENCIA' ? valor.bodegaDestinoId : undefined,
        observaciones: valor.observaciones || undefined,
        detalles,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.modalDoc.set(false);
          this.toast.exito('Documento creado en borrador');
          this.activa.set('documentos');
          this.cargar();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorModal.set(this.mensaje(err));
        },
      });
  }

  verDetalle(doc: DocumentoResumen): void {
    this.detalle.set(null);
    this.errorModal.set(null);
    this.modalDoc.set(true);
    this.inventario.obtenerDocumento(doc.id).subscribe({
      next: (d) => this.detalle.set(d),
      error: (err) => {
        this.modalDoc.set(false);
        this.toast.error(this.mensaje(err));
      },
    });
  }

  confirmar(doc: DocumentoResumen, enModal = false): void {
    this.inventario.confirmarDocumento(doc.id).subscribe({
      next: () => {
        this.toast.exito('Documento confirmado');
        if (enModal) this.modalDoc.set(false);
        this.cargar();
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  anular(doc: DocumentoResumen, enModal = false): void {
    if (!confirm(`¿Anular el documento ${doc.consecutivo}?`)) return;
    this.inventario.anularDocumento(doc.id).subscribe({
      next: () => {
        this.toast.exito('Documento anulado');
        if (enModal) this.modalDoc.set(false);
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

  etiquetaTipo(tipo: TipoMovimiento): string {
    return ETIQUETA_MOVIMIENTO[tipo] ?? tipo;
  }

  etiquetaEstado(estado: EstadoDocumento): string {
    return ETIQUETA_ESTADO[estado] ?? estado;
  }

  claseTipo(tipo: TipoMovimiento): string {
    switch (tipo) {
      case 'ENTRADA':
        return 'badge-success';
      case 'SALIDA':
        return 'badge-danger';
      case 'TRANSFERENCIA':
        return 'badge-info';
      case 'AJUSTE':
        return 'badge-warn';
      default:
        return 'badge-muted';
    }
  }

  claseEstado(estado: EstadoDocumento): string {
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
