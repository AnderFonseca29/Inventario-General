import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../core/services/auditoria.service';
import { ToastService } from '../../core/services/toast.service';
import { AuditoriaRegistro } from '../../core/models/auditoria.model';
import { IconComponent } from '../../shared/icons';
import { formatearFechaHora } from '../../core/utils/fechas';

@Component({
  selector: 'app-auditorias',
  imports: [FormsModule, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Auditoría</div>
        <div class="page-subtitle">
          Trazabilidad de acciones y cambios realizados en la empresa.
        </div>
      </div>
      <div class="toolbar-actions">
        <button class="btn btn-ghost btn-sm" (click)="cargar()" title="Actualizar">
          <app-icon name="refresh" /> Actualizar
        </button>
      </div>
    </div>

    <div class="card aud-filters">
      <div class="control-icon search">
        <app-icon name="search" />
        <input
          class="form-control"
          placeholder="Buscar por acción, entidad o id…"
          [(ngModel)]="buscar"
          (keyup.enter)="cargar()"
        />
      </div>
      <div class="form-group">
        <label for="desde">Desde</label>
        <input id="desde" type="date" class="form-control" [(ngModel)]="desde" />
      </div>
      <div class="form-group">
        <label for="hasta">Hasta</label>
        <input id="hasta" type="date" class="form-control" [(ngModel)]="hasta" />
      </div>
      <div class="form-group">
        <label for="limite">Límite</label>
        <select id="limite" class="form-control" [(ngModel)]="limite">
          <option [ngValue]="50">50</option>
          <option [ngValue]="100">100</option>
          <option [ngValue]="200">200</option>
          <option [ngValue]="500">500</option>
        </select>
      </div>
      <button class="btn btn-primary btn-sm" (click)="cargar()">
        <app-icon name="search" /> Buscar
      </button>
      <button class="btn btn-ghost btn-sm" (click)="limpiar()">Limpiar</button>
    </div>

    <div class="card">
      <div class="table-wrap">
        @if (cargando()) {
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="skeleton-row">
              <div style="flex:1">
                <div class="skeleton" style="width:30%;margin-bottom:8px"></div>
                <div class="skeleton" style="width:55%"></div>
              </div>
              <div class="skeleton" style="width:60px"></div>
            </div>
          }
        } @else if (registros().length === 0) {
          <div class="empty">
            <app-icon name="audit" />
            <div class="empty-title">Sin registros</div>
            <div>No hay actividad para los filtros seleccionados.</div>
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>IP</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (r of registros(); track r.id) {
                <tr>
                  <td><span class="cell-muted">{{ fecha(r.creadoEn) }}</span></td>
                  <td>
                    <span class="cell-strong">{{ r.usuario?.nombre ?? 'Sistema' }}</span>
                    @if (r.usuario?.email) {
                      <div class="cell-muted">{{ r.usuario?.email }}</div>
                    }
                  </td>
                  <td><span class="code-pill">{{ r.accion }}</span></td>
                  <td>
                    <span class="cell-strong">{{ r.entidad }}</span>
                    @if (r.entidadId) {
                      <div class="cell-muted mono">{{ r.entidadId }}</div>
                    }
                  </td>
                  <td><span class="cell-muted">{{ r.ip ?? '—' }}</span></td>
                  <td class="actions">
                    <button class="btn btn-ghost btn-sm" (click)="ver(r)" title="Ver detalle">
                      <app-icon name="eye" />
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    @if (detalle()) {
      <div class="modal-backdrop" (click)="detalle.set(null)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Detalle de auditoría</h3>
            <button class="icon-btn" (click)="detalle.set(null)">
              <app-icon name="close" />
            </button>
          </div>
          <div class="modal-body">
            <dl class="aud-detalle">
              <dt>Acción</dt>
              <dd><span class="code-pill">{{ detalle()!.accion }}</span></dd>
              <dt>Entidad</dt>
              <dd>{{ detalle()!.entidad }}</dd>
              <dt>ID entidad</dt>
              <dd class="mono">{{ detalle()!.entidadId ?? '—' }}</dd>
              <dt>Usuario</dt>
              <dd>{{ detalle()!.usuario?.nombre ?? 'Sistema' }}</dd>
              <dt>Fecha</dt>
              <dd>{{ fecha(detalle()!.creadoEn) }}</dd>
              <dt>IP</dt>
              <dd>{{ detalle()!.ip ?? '—' }}</dd>
            </dl>
            @if (detalle()!.datosNuevos) {
              <div class="subtitle">Datos</div>
              <pre class="aud-json">{{ json(detalle()!.datosNuevos) }}</pre>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="detalle.set(null)">Cerrar</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './auditorias.component.scss',
})
export class AuditoriasComponent {
  private readonly service = inject(AuditoriaService);
  private readonly toast = inject(ToastService);

  readonly registros = signal<AuditoriaRegistro[]>([]);
  readonly cargando = signal(false);
  readonly detalle = signal<AuditoriaRegistro | null>(null);

  buscar = '';
  desde = '';
  hasta = '';
  limite = 100;

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.service
      .listar({
        buscar: this.buscar.trim() || undefined,
        desde: this.desde || undefined,
        hasta: this.hasta || undefined,
        limite: this.limite,
      })
      .subscribe({
        next: (r) => {
          this.registros.set(r ?? []);
          this.cargando.set(false);
        },
        error: (err: unknown) => {
          this.toast.error(this.mensaje(err));
          this.cargando.set(false);
        },
      });
  }

  limpiar(): void {
    this.buscar = '';
    this.desde = '';
    this.hasta = '';
    this.limite = 100;
    this.cargar();
  }

  ver(r: AuditoriaRegistro): void {
    this.detalle.set(r);
  }

  fecha(valor: string): string {
    if (!valor) return '—';
    return formatearFechaHora(valor);
  }

  json(valor: unknown): string {
    try {
      return JSON.stringify(valor, null, 2);
    } catch {
      return String(valor);
    }
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
