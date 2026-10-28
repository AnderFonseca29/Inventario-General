import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../core/services/reportes.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import {
  ReporteInventario,
  ReporteMembresias,
  ReporteMovimiento,
  ReporteProduccion,
  ReporteResumen,
} from '../../core/models/reportes.model';
import {
  ETIQUETA_ESTADO_MERMA,
  ETIQUETA_ESTADO_ORDEN,
  EstadoMerma,
  EstadoOrdenProduccion,
} from '../../core/models/produccion.model';
import {
  ETIQUETA_ESTADO_MEMBRESIA,
  EstadoMembresia,
} from '../../core/models/membresia.model';
import { IconComponent } from '../../shared/icons';

@Component({
  selector: 'app-reportes',
  imports: [FormsModule, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Reportes</div>
        <div class="page-subtitle">
          Indicadores de inventario, producción{{ esPropietario() ? ', membresías' : '' }} y operación.
        </div>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-ghost btn-sm" (click)="cargar()" title="Actualizar">
          <app-icon name="refresh" /> Actualizar
        </button>
      </div>
    </div>

    <div class="kpi-grid">
      @for (k of kpis(); track k.label) {
        <div class="kpi card">
          <div class="kpi-icon"><app-icon [name]="k.icono" /></div>
          <div>
            <div class="kpi-value">{{ k.valor }}</div>
            <div class="kpi-label">{{ k.label }}</div>
          </div>
        </div>
      }
    </div>

    <div class="card range-card">
      <div class="range-controls">
        <div class="form-group">
          <label for="desde">Desde</label>
          <input id="desde" type="date" class="form-control" [(ngModel)]="desde" />
        </div>
        <div class="form-group">
          <label for="hasta">Hasta</label>
          <input id="hasta" type="date" class="form-control" [(ngModel)]="hasta" />
        </div>
        <button class="btn btn-primary btn-sm" (click)="aplicarRango()">
          <app-icon name="search" /> Aplicar
        </button>
        <button class="btn btn-ghost btn-sm" (click)="limpiarRango()">Limpiar</button>
      </div>
    </div>

    <div class="report-grid">
      <div class="card">
        <div class="card-title">
          <app-icon name="box" /> Movimientos por tipo
        </div>
        <div class="table-wrap">
          @if (movimientos().length === 0) {
            <div class="empty small">
              <app-icon name="box" />
              <div>Sin movimientos en el rango.</div>
            </div>
          } @else {
            <table class="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th class="ta-right">Movimientos</th>
                  <th class="ta-right">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                @for (m of movimientos(); track m.tipo) {
                  <tr>
                    <td><span class="cell-strong">{{ etiquetaMovimiento(m.tipo) }}</span></td>
                    <td class="ta-right"><span class="badge badge-info">{{ m.movimientos }}</span></td>
                    <td class="ta-right"><span class="qty">{{ numero(m.cantidad) }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <app-icon name="factory" /> Producción
        </div>
        <div class="subtitle">Órdenes por estado</div>
        @if (produccion().ordenes.length === 0) {
          <div class="empty small"><app-icon name="factory" /><div>Sin órdenes.</div></div>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th class="ta-right">Órdenes</th>
                  <th class="ta-right">Planificado</th>
                  <th class="ta-right">Producido</th>
                </tr>
              </thead>
              <tbody>
                @for (o of produccion().ordenes; track o.estado) {
                  <tr>
                    <td>
                      <span class="badge" [class]="claseOrden(o.estado)">
                        {{ etiquetaOrden(o.estado) }}
                      </span>
                    </td>
                    <td class="ta-right"><span class="badge badge-info">{{ o.ordenes }}</span></td>
                    <td class="ta-right"><span class="qty">{{ numero(o.cantidadPlanificada) }}</span></td>
                    <td class="ta-right"><span class="qty">{{ numero(o.cantidadProducida) }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
        <div class="subtitle">Mermas por estado</div>
        @if (produccion().mermas.length === 0) {
          <div class="empty small"><app-icon name="warning" /><div>Sin mermas.</div></div>
        } @else {
          <div class="chips">
            @for (m of produccion().mermas; track m.estado) {
              <span class="chip">
                {{ etiquetaMerma(m.estado) }}
                <strong>{{ m.mermas }}</strong>
                <span class="cell-muted">({{ numero(m.cantidad) }})</span>
              </span>
            }
          </div>
        }
      </div>

      @if (esPropietario()) {
      <div class="card">
        <div class="card-title">
          <app-icon name="users" /> Membresías
        </div>
        <div class="subtitle">Por estado</div>
        @if (membresias().porEstado.length === 0) {
          <div class="empty small"><app-icon name="users" /><div>Sin membresías.</div></div>
        } @else {
          <div class="chips">
            @for (e of membresias().porEstado; track e.estado) {
              <span class="chip">
                {{ etiquetaMembresia(e.estado) }}
                <strong>{{ e.membresias }}</strong>
              </span>
            }
          </div>
        }
        <div class="subtitle">Activas por plan</div>
        @if (membresias().porPlan.length === 0) {
          <div class="empty small"><app-icon name="spark" /><div>Sin planes activos.</div></div>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th class="ta-right">Precio</th>
                  <th class="ta-right">Activas</th>
                </tr>
              </thead>
              <tbody>
                @for (p of membresias().porPlan; track p.planId) {
                  <tr>
                    <td><span class="cell-strong">{{ p.nombre }}</span></td>
                    <td class="ta-right"><span class="cell-muted">{{ dinero(p.precio) }}</span></td>
                    <td class="ta-right"><span class="badge badge-success">{{ p.activas }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
      }

      <div class="card">
        <div class="card-title">
          <app-icon name="trend-up" /> Inventario valorizado
        </div>
        <div class="subtitle">
          Total: <strong>{{ dinero(inventario().totalValor) }}</strong>
        </div>
        @if (inventario().porProducto.length === 0) {
          <div class="empty small"><app-icon name="box" /><div>Sin existencias.</div></div>
        } @else {
          <div class="bars">
            @for (p of topProductos(); track p.productoId) {
              <div class="bar-row">
                <div class="bar-label">
                  <span class="cell-strong">{{ p.nombre }}</span>
                  <span class="cell-muted">{{ p.sku }}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="ancho(p.valor)"></div>
                </div>
                <div class="bar-value">{{ dinero(p.valor) }}</div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent {
  private readonly service = inject(ReportesService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  // Las cifras de membresias son del dueno de la empresa.
  readonly esPropietario = this.auth.esPropietario;

  readonly resumen = signal<ReporteResumen>({
    productosActivos: 0,
    clientesActivos: 0,
    membresiasActivas: 0,
    planesActivos: 0,
    ordenesEnProceso: 0,
    mermasPendientes: 0,
    documentosBorrador: 0,
    carguesBorrador: 0,
    movimientosBotellonPendientes: 0,
    valorInventario: 0,
    unidadesInventario: 0,
  });
  readonly inventario = signal<ReporteInventario>({
    porProducto: [],
    porBodega: [],
    totalValor: 0,
  });
  readonly movimientos = signal<ReporteMovimiento[]>([]);
  readonly produccion = signal<ReporteProduccion>({ ordenes: [], mermas: [] });
  readonly membresias = signal<ReporteMembresias>({
    porEstado: [],
    porPlan: [],
    totalActivas: 0,
  });

  desde = '';
  hasta = '';

  readonly kpis = computed(() => {
    const r = this.resumen();
    const kpis = [
      { label: 'Valor inventario', valor: this.dinero(r.valorInventario), icono: 'trend-up' },
      { label: 'Productos activos', valor: r.productosActivos, icono: 'box' },
    ];
    // Clientes, membresias y planes solo los ve el dueno de la empresa.
    if (this.esPropietario()) {
      kpis.push(
        { label: 'Clientes activos', valor: r.clientesActivos, icono: 'users' },
        { label: 'Membresías activas', valor: r.membresiasActivas, icono: 'spark' },
      );
    }
    kpis.push(
      { label: 'Órdenes en proceso', valor: r.ordenesEnProceso, icono: 'factory' },
      { label: 'Mermas pendientes', valor: r.mermasPendientes, icono: 'warning' },
      { label: 'Docs. en borrador', valor: r.documentosBorrador, icono: 'box' },
      { label: 'Botellones pendientes', valor: r.movimientosBotellonPendientes, icono: 'bottle' },
    );
    return kpis;
  });

  readonly topProductos = computed(() => this.inventario().porProducto.slice(0, 8));

  private readonly maxValor = computed(() =>
    this.topProductos().reduce((max, p) => Math.max(max, p.valor), 0),
  );

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.service.resumen().subscribe({
      next: (r) => this.resumen.set(r),
      error: (err: unknown) => this.toast.error(this.mensaje(err)),
    });
    this.service.inventario().subscribe({ next: (r) => this.inventario.set(r) });
    // El detalle de membresias es exclusivo del dueno: los demas usuarios no
    // lo piden porque el backend responde 403.
    if (this.esPropietario()) {
      this.service.membresias().subscribe({ next: (r) => this.membresias.set(r) });
    }
    this.cargarRango();
  }

  private cargarRango(): void {
    const rango = { desde: this.desde || undefined, hasta: this.hasta || undefined };
    this.service.movimientos(rango).subscribe({
      next: (r) => this.movimientos.set(r ?? []),
      error: (err: unknown) => this.toast.error(this.mensaje(err)),
    });
    this.service.produccion(rango).subscribe({
      next: (r) => this.produccion.set(r),
    });
  }

  aplicarRango(): void {
    this.cargarRango();
  }

  limpiarRango(): void {
    this.desde = '';
    this.hasta = '';
    this.cargarRango();
  }

  ancho(valor: number): number {
    const max = this.maxValor();
    if (max <= 0) return 0;
    return Math.max(4, Math.round((valor / max) * 100));
  }

  numero(valor: number): string {
    return Number(valor).toLocaleString('es-CO', {
      maximumFractionDigits: 2,
    });
  }

  dinero(valor: number): string {
    return Number(valor).toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  etiquetaMovimiento(tipo: string): string {
    const mapa: Record<string, string> = {
      ENTRADA: 'Entrada',
      SALIDA: 'Salida',
      AJUSTE: 'Ajuste',
      TRANSFERENCIA: 'Transferencia',
      DEVOLUCION: 'Devolución',
      REVERSO: 'Reverso',
      CARGUE: 'Cargue',
      RECEPCION_MP: 'Recepción MP',
      CONSUMO_PRODUCCION: 'Consumo producción',
      PRODUCCION: 'Producción',
      MERMA: 'Merma',
    };
    return mapa[tipo] ?? tipo;
  }

  etiquetaOrden(estado: string): string {
    return ETIQUETA_ESTADO_ORDEN[estado as EstadoOrdenProduccion] ?? estado;
  }

  claseOrden(estado: string): string {
    switch (estado) {
      case 'COMPLETADA':
        return 'badge badge-success';
      case 'EN_PROCESO':
        return 'badge badge-info';
      case 'CANCELADA':
        return 'badge badge-muted';
      case 'PLANIFICADA':
        return 'badge badge-primary';
      default:
        return 'badge badge-warn';
    }
  }

  etiquetaMerma(estado: string): string {
    return ETIQUETA_ESTADO_MERMA[estado as EstadoMerma] ?? estado;
  }

  etiquetaMembresia(estado: string): string {
    return ETIQUETA_ESTADO_MEMBRESIA[estado as EstadoMembresia] ?? estado;
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
