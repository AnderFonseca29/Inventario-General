import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProduccionService } from '../../core/services/produccion.service';
import { CatalogosService } from '../../core/services/catalogos.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { DialogoService } from '../../core/services/dialogo.service';
import { Bodega, Producto, Proveedor, Unidad } from '../../core/models/catalogo.model';
import {
  ETIQUETA_ESTADO_MERMA,
  ETIQUETA_ESTADO_ORDEN,
  EstadoMerma,
  EstadoOrdenProduccion,
  Formula,
  MateriaPrima,
  Merma,
  OrdenProduccion,
  Recepcion,
} from '../../core/models/produccion.model';
import { IconComponent } from '../../shared/icons';
import { aNumero } from '../../core/utils/numeros';
import { formatearFechaHora } from '../../core/utils/fechas';

type Tab = 'materias' | 'recepciones' | 'formulas' | 'ordenes' | 'mermas';
type Modo =
  | 'materia'
  | 'recepcion'
  | 'formula'
  | 'orden'
  | 'completar'
  | 'merma'
  | null;

@Component({
  selector: 'app-produccion',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Producción</div>
        <div class="page-subtitle">
          Materias primas, fórmulas y órdenes de producción.
        </div>
      </div>
      @switch (activa()) {
        @case ('materias') {
          @if (puedeOperar()) {
            <button class="btn btn-primary" (click)="abrirMateria()">
              <app-icon name="plus" /> Nueva materia prima
            </button>
          }
        }
        @case ('recepciones') {
          @if (puedeOperar()) {
            <button class="btn btn-primary" (click)="abrirRecepcion()">
              <app-icon name="plus" /> Registrar recepción
            </button>
          }
        }
        @case ('formulas') {
          @if (puedeOperar()) {
            <button class="btn btn-primary" (click)="abrirFormula()">
              <app-icon name="plus" /> Nueva fórmula
            </button>
          }
        }
        @case ('ordenes') {
          @if (puedeOperar()) {
            <button class="btn btn-primary" (click)="abrirOrden()">
              <app-icon name="plus" /> Nueva orden
            </button>
          }
        }
        @case ('mermas') {
          @if (puedeMerma()) {
            <button class="btn btn-primary" (click)="abrirMerma()">
              <app-icon name="plus" /> Registrar merma
            </button>
          }
        }
      }
    </div>

    <div class="segmented prod-tabs">
      <button [class.active]="activa() === 'materias'" (click)="cambiar('materias')">
        Materias primas
      </button>
      <button [class.active]="activa() === 'recepciones'" (click)="cambiar('recepciones')">
        Recepciones
      </button>
      <button [class.active]="activa() === 'formulas'" (click)="cambiar('formulas')">
        Fórmulas
      </button>
      <button [class.active]="activa() === 'ordenes'" (click)="cambiar('ordenes')">
        Órdenes
      </button>
      <button [class.active]="activa() === 'mermas'" (click)="cambiar('mermas')">
        Mermas
      </button>
    </div>

    <div class="card">
      <div class="table-toolbar">
        @if (activa() === 'materias') {
          <div class="control-icon search">
            <app-icon name="search" />
            <input class="form-control" placeholder="Buscar materia prima…"
              [value]="fBuscar()" (input)="fBuscar.set($any($event.target).value)"
              (keyup.enter)="cargar()" />
          </div>
        }
        @if (activa() === 'ordenes') {
          <select class="form-control" [value]="fEstadoOrden()"
            (change)="fEstadoOrden.set($any($event.target).value); cargar()">
            <option value="">Todos los estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="PLANIFICADA">Planificada</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COMPLETADA">Completada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        }
        @if (activa() === 'mermas') {
          <select class="form-control" [value]="fEstadoMerma()"
            (change)="fEstadoMerma.set($any($event.target).value); cargar()">
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="APROBADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>
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
            <app-icon name="factory" />
            <div class="empty-title">Sin registros</div>
            <div>No hay información para mostrar en esta vista.</div>
          </div>
        } @else {
          @switch (activa()) {
            @case ('materias') {
              <table class="table">
                <thead>
                  <tr><th>Materia prima</th><th>Unidad</th><th class="ta-right">Disponible</th><th class="ta-right">Reservado</th><th class="ta-right">Costo</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  @for (m of materias(); track m.id) {
                    <tr>
                      <td><span class="cell-strong">{{ m.nombre }}</span></td>
                      <td class="cell-muted">{{ m.unidad?.abreviatura ?? '—' }}</td>
                      <td class="ta-right"><span class="qty">{{ numero(m.disponible) }}</span></td>
                      <td class="ta-right"><span class="qty cell-muted">{{ numero(m.reservado) }}</span></td>
                      <td class="ta-right cell-muted">{{ dinero(m.costo) }}</td>
                      <td>
                        <span class="badge" [class.badge-success]="m.activo" [class.badge-muted]="!m.activo">
                          {{ m.activo ? 'Activa' : 'Inactiva' }}
                        </span>
                      </td>
                      <td class="actions">
                        @if (puedeOperar()) {
                          <button class="btn btn-ghost btn-sm" (click)="editarMateria(m)" title="Editar">
                            <app-icon name="edit" />
                          </button>
                          <button class="btn btn-danger btn-sm" (click)="eliminarMateria(m)" title="Eliminar">
                            <app-icon name="trash" />
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
            @case ('recepciones') {
              <table class="table">
                <thead>
                  <tr><th>Fecha</th><th>Materia prima</th><th>Proveedor</th><th>Lote</th><th class="ta-right">Cantidad</th><th class="ta-right">Costo unit.</th><th>Responsable</th></tr>
                </thead>
                <tbody>
                  @for (r of recepciones(); track r.id) {
                    <tr>
                      <td class="cell-muted">{{ fecha(r.recibidoEn) }}</td>
                      <td><span class="cell-strong">{{ r.materiaPrima.nombre }}</span></td>
                      <td class="cell-muted">{{ r.proveedor?.nombre ?? '—' }}</td>
                      <td class="cell-muted">{{ r.lote ?? '—' }}</td>
                      <td class="ta-right"><span class="qty">{{ numero(r.cantidad) }}</span></td>
                      <td class="ta-right cell-muted">{{ dinero(r.costoUnitario) }}</td>
                      <td class="cell-muted">{{ r.responsable?.nombre }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
            @case ('formulas') {
              <table class="table">
                <thead>
                  <tr><th>Producto</th><th>Fórmula</th><th>Versión</th><th>Insumos</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  @for (f of formulas(); track f.id) {
                    <tr>
                      <td>
                        <span class="cell-strong">{{ f.producto.nombre }}</span>
                        <div class="cell-muted">{{ f.producto.sku }}</div>
                      </td>
                      <td>{{ f.nombre }}</td>
                      <td><span class="badge badge-muted">v{{ f.version }}</span></td>
                      <td><span class="badge badge-info">{{ f.detalles.length }}</span></td>
                      <td>
                        <span class="badge" [class.badge-success]="f.activo" [class.badge-muted]="!f.activo">
                          {{ f.activo ? 'Activa' : 'Inactiva' }}
                        </span>
                      </td>
                      <td class="actions">
                        <button class="btn btn-ghost btn-sm" (click)="verFormula(f)" title="Ver detalle">
                          <app-icon name="eye" />
                        </button>
                        @if (puedeOperar()) {
                          <button class="btn btn-ghost btn-sm" (click)="editarFormula(f)" title="Editar">
                            <app-icon name="edit" />
                          </button>
                          <button class="btn btn-danger btn-sm" (click)="eliminarFormula(f)" title="Eliminar">
                            <app-icon name="trash" />
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
            @case ('ordenes') {
              <table class="table">
                <thead>
                  <tr><th>Consecutivo</th><th>Producto</th><th>Estado</th><th class="ta-right">A producir</th><th class="ta-right">Producida</th><th>Insumos</th><th>Fecha</th><th></th></tr>
                </thead>
                <tbody>
                  @for (o of ordenes(); track o.id) {
                    <tr>
                      <td><span class="code-pill">{{ o.consecutivo }}</span></td>
                      <td><span class="cell-strong">{{ o.producto.nombre }}</span></td>
                      <td><span [class]="'badge ' + claseOrden(o.estado)">{{ etiquetaOrden(o.estado) }}</span></td>
                      <td class="ta-right"><span class="qty">{{ numero(o.cantidadPlanificada) }}</span></td>
                      <td class="ta-right"><span class="qty">{{ numero(o.cantidadProducida) }}</span></td>
                      <td><span class="badge badge-muted">{{ o._count?.detalles ?? 0 }}</span></td>
                      <td class="cell-muted">{{ fecha(o.creadoEn) }}</td>
                      <td class="actions">
                        <button class="btn btn-ghost btn-sm" (click)="verOrden(o)" title="Ver detalle">
                          <app-icon name="eye" />
                        </button>
                        @if (o.estado === 'BORRADOR' && puedeOperar()) {
                          <button class="btn btn-ghost btn-sm" (click)="iniciarOrden(o)" title="Iniciar">
                            <app-icon name="bolt" />
                          </button>
                        }
                        @if (o.estado === 'EN_PROCESO' && puedeConfirmar()) {
                          <button class="btn btn-primary btn-sm btn-completar" (click)="abrirCompletar(o)" title="Cantidad que entra a bodega">
                            <app-icon name="check" /> Completar
                          </button>
                        }
                        @if ((o.estado === 'BORRADOR' || o.estado === 'EN_PROCESO') && puedeConfirmar()) {
                          <button class="btn btn-danger btn-sm" (click)="cancelarOrden(o)" title="Cancelar">
                            <app-icon name="close" />
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
            @case ('mermas') {
              <table class="table">
                <thead>
                  <tr><th>Fecha</th><th>Origen</th><th>Cantidad</th><th>Motivo</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  @for (m of mermas(); track m.id) {
                    <tr>
                      <td class="cell-muted">{{ fecha(m.creadoEn) }}</td>
                      <td>
                        <span class="cell-strong">
                          {{ m.materiaPrima?.nombre ?? m.producto?.nombre ?? '—' }}
                        </span>
                        <div class="cell-muted">
                          {{ m.materiaPrima ? 'Materia prima' : 'Producto' }}
                          @if (m.orden) { · {{ m.orden.consecutivo }} }
                        </div>
                      </td>
                      <td><span class="qty">{{ numero(m.cantidad) }}</span></td>
                      <td class="cell-muted">{{ m.motivo }}</td>
                      <td><span [class]="'badge ' + claseMerma(m.estado)">{{ etiquetaMerma(m.estado) }}</span></td>
                      <td class="actions">
                        @if (m.estado === 'PENDIENTE' && puedeAprobar()) {
                          <button class="btn btn-primary btn-sm" (click)="aprobarMerma(m)" title="Aprobar">
                            <app-icon name="check" />
                          </button>
                          <button class="btn btn-danger btn-sm" (click)="rechazarMerma(m)" title="Rechazar">
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

    @if (modo()) {
      <div class="modal-backdrop" (click)="cerrar()">
        <div class="modal" [class.modal-lg]="modo() === 'formula' || modo() === 'completar'" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ tituloModal() }}</h3>
            <button class="icon-btn" (click)="cerrar()"><app-icon name="close" /></button>
          </div>

          @if (modo() === 'materia') {
            <form [formGroup]="formMateria" (ngSubmit)="guardarMateria()">
              <div class="modal-body">
                @if (errorModal()) {
                  <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
                }
                <div class="form-row">
                  <div class="form-group full">
                    <label for="mp-nombre">Nombre</label>
                    <input id="mp-nombre" class="form-control" formControlName="nombre" />
                  </div>
                  <div class="form-group">
                    <label for="mp-unidad">Unidad</label>
                    <select id="mp-unidad" class="form-control" formControlName="unidadId">
                      <option value="">Selecciona…</option>
                      @for (u of unidades(); track u.id) {
                        <option [value]="u.id">{{ u.nombre }} ({{ u.abreviatura }})</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="mp-costo">Costo</label>
                    <input id="mp-costo" class="form-control" type="number" step="any" formControlName="costo" />
                  </div>
                  <div class="form-group full">
                    <label class="check">
                      <input type="checkbox" formControlName="activo" /> Activa
                    </label>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="cerrar()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  {{ guardando() ? 'Guardando…' : 'Guardar' }}
                </button>
              </div>
            </form>
          }

          @if (modo() === 'recepcion') {
            <form [formGroup]="formRecepcion" (ngSubmit)="guardarRecepcion()">
              <div class="modal-body">
                @if (errorModal()) {
                  <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
                }
                <div class="form-row">
                  <div class="form-group full">
                    <label for="rc-mp">Materia prima</label>
                    <select id="rc-mp" class="form-control" formControlName="materiaPrimaId">
                      <option value="">Selecciona…</option>
                      @for (m of materias(); track m.id) {
                        <option [value]="m.id">{{ m.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="rc-cant">Cantidad</label>
                    <input id="rc-cant" class="form-control" type="number" step="any" formControlName="cantidad" />
                  </div>
                  <div class="form-group">
                    <label for="rc-costo">Costo unitario</label>
                    <input id="rc-costo" class="form-control" type="number" step="any" formControlName="costoUnitario" />
                  </div>
                  <div class="form-group">
                    <label for="rc-prov">Proveedor</label>
                    <select id="rc-prov" class="form-control" formControlName="proveedorId">
                      <option value="">Sin proveedor</option>
                      @for (p of proveedores(); track p.id) {
                        <option [value]="p.id">{{ p.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="rc-lote">Lote</label>
                    <input id="rc-lote" class="form-control" formControlName="lote" />
                  </div>
                  <div class="form-group full">
                    <label for="rc-obs">Observaciones</label>
                    <input id="rc-obs" class="form-control" formControlName="observaciones" />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="cerrar()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  {{ guardando() ? 'Guardando…' : 'Registrar recepción' }}
                </button>
              </div>
            </form>
          }

          @if (modo() === 'formula') {
            <form [formGroup]="formFormula" (ngSubmit)="guardarFormula()">
              <div class="modal-body">
                @if (errorModal()) {
                  <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
                }
                <div class="form-row">
                  <div class="form-group">
                    <label for="fm-prod">Producto</label>
                    <select id="fm-prod" class="form-control" formControlName="productoId">
                      <option value="">Selecciona…</option>
                      @for (p of productos(); track p.id) {
                        <option [value]="p.id">{{ p.sku }} · {{ p.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="fm-nombre">Nombre</label>
                    <input id="fm-nombre" class="form-control" formControlName="nombre" />
                  </div>
                </div>

                <div class="lineas-head">
                  <label>Insumos (por unidad de producto)</label>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="agregarInsumo()">
                    <app-icon name="plus" /> Agregar
                  </button>
                </div>
                <div formArrayName="detalles" class="lineas">
                  @for (linea of insumos.controls; track $index; let i = $index) {
                    <div [formGroupName]="i" class="linea linea-formula">
                      <select class="form-control" formControlName="materiaPrimaId">
                        <option value="">Materia prima…</option>
                        @for (m of materias(); track m.id) {
                          <option [value]="m.id">{{ m.nombre }}</option>
                        }
                      </select>
                      <input class="form-control" type="number" step="any" formControlName="cantidad" placeholder="Cantidad" />
                      <button type="button" class="btn btn-danger btn-sm" (click)="quitarInsumo(i)" [disabled]="insumos.length === 1">
                        <app-icon name="trash" />
                      </button>
                    </div>
                  }
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="cerrar()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  {{ guardando() ? 'Guardando…' : 'Guardar fórmula' }}
                </button>
              </div>
            </form>
          }

          @if (modo() === 'orden') {
            <form [formGroup]="formOrden" (ngSubmit)="guardarOrden()">
              <div class="modal-body">
                @if (errorModal()) {
                  <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
                }
                <div class="form-row">
                  <div class="form-group">
                    <label for="or-prod">Producto</label>
                    <select id="or-prod" class="form-control" formControlName="productoId" (change)="onProductoOrden()">
                      <option value="">Selecciona…</option>
                      @for (p of productos(); track p.id) {
                        <option [value]="p.id">{{ p.sku }} · {{ p.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="or-formula">Fórmula</label>
                    <select id="or-formula" class="form-control" formControlName="formulaId">
                      <option value="">Sin fórmula (manual)</option>
                      @for (f of formulasProducto(); track f.id) {
                        <option [value]="f.id">{{ f.nombre }} (v{{ f.version }})</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="or-cant">Cantidad a producir</label>
                    <input id="or-cant" class="form-control" type="number" step="any" min="0" formControlName="cantidadPlanificada" placeholder="Ej. 100" />
                    <span class="campo-ayuda">Lo que planeas fabricar. Al completar la orden confirmas cuánto entra a la bodega.</span>
                  </div>
                  <div class="form-group full">
                    <label for="or-obs">Observaciones</label>
                    <input id="or-obs" class="form-control" formControlName="observaciones" />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="cerrar()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  {{ guardando() ? 'Guardando…' : 'Crear orden' }}
                </button>
              </div>
            </form>
          }

          @if (modo() === 'completar') {
            <form [formGroup]="formCompletar" (ngSubmit)="guardarCompletar()">
              <div class="modal-body">
                @if (errorModal()) {
                  <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
                }
                <div class="form-row">
                  <div class="form-group">
                    <label for="cp-bodega">Bodega de producción</label>
                    <select id="cp-bodega" class="form-control" formControlName="bodegaId">
                      <option value="">Selecciona…</option>
                      @for (b of bodegas(); track b.id) {
                        <option [value]="b.id">{{ b.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="cp-cant">Cantidad que entra a bodega</label>
                    <input id="cp-cant" class="form-control" type="number" step="any" min="0" formControlName="cantidadProducida" />
                    <span class="campo-ayuda">Se suma al stock de la bodega elegida.</span>
                  </div>
                </div>

                <div class="lineas-head">
                  <label>Consumo de materias primas</label>
                </div>
                <div formArrayName="consumos" class="lineas">
                  @for (linea of consumos.controls; track $index; let i = $index) {
                    <div [formGroupName]="i" class="linea linea-consumo">
                      <span class="cell-strong">{{ nombreInsumo(linea) }}</span>
                      <input class="form-control" type="number" step="any" formControlName="cantidadConsumida" placeholder="Consumido" />
                      <input class="form-control" type="number" step="any" formControlName="merma" placeholder="Merma" />
                    </div>
                  }
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="cerrar()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  {{ guardando() ? 'Procesando…' : 'Completar orden' }}
                </button>
              </div>
            </form>
          }

          @if (modo() === 'merma') {
            <form [formGroup]="formMerma" (ngSubmit)="guardarMerma()">
              <div class="modal-body">
                @if (errorModal()) {
                  <div class="alert alert-error"><app-icon name="warning" /><span>{{ errorModal() }}</span></div>
                }
                <div class="form-row">
                  <div class="form-group">
                    <label for="mr-tipo">Origen</label>
                    <select id="mr-tipo" class="form-control" [value]="destinoMerma()"
                      (change)="destinoMerma.set($any($event.target).value)">
                      <option value="materiaPrima">Materia prima</option>
                      <option value="producto">Producto</option>
                    </select>
                  </div>
                  @if (destinoMerma() === 'materiaPrima') {
                    <div class="form-group">
                      <label for="mr-mp">Materia prima</label>
                      <select id="mr-mp" class="form-control" formControlName="materiaPrimaId">
                        <option value="">Selecciona…</option>
                        @for (m of materias(); track m.id) {
                          <option [value]="m.id">{{ m.nombre }}</option>
                        }
                      </select>
                    </div>
                  } @else {
                    <div class="form-group">
                      <label for="mr-prod">Producto</label>
                      <select id="mr-prod" class="form-control" formControlName="productoId">
                        <option value="">Selecciona…</option>
                        @for (p of productos(); track p.id) {
                          <option [value]="p.id">{{ p.sku }} · {{ p.nombre }}</option>
                        }
                      </select>
                    </div>
                  }
                  <div class="form-group">
                    <label for="mr-cant">Cantidad</label>
                    <input id="mr-cant" class="form-control" type="number" step="any" formControlName="cantidad" />
                  </div>
                  <div class="form-group">
                    <label for="mr-orden">Orden (opcional)</label>
                    <select id="mr-orden" class="form-control" formControlName="ordenId">
                      <option value="">Sin orden</option>
                      @for (o of ordenes(); track o.id) {
                        <option [value]="o.id">{{ o.consecutivo }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group full">
                    <label for="mr-motivo">Motivo</label>
                    <input id="mr-motivo" class="form-control" formControlName="motivo" />
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="cerrar()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  {{ guardando() ? 'Guardando…' : 'Registrar merma' }}
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    }
  `,
  styleUrl: './produccion.component.scss',
})
export class ProduccionComponent {
  private readonly produccion = inject(ProduccionService);
  private readonly catalogos = inject(CatalogosService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  private readonly fb = inject(FormBuilder);

  readonly unidades = signal<Unidad[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly bodegas = signal<Bodega[]>([]);
  readonly proveedores = signal<Proveedor[]>([]);

  readonly activa = signal<Tab>('materias');
  readonly materias = signal<MateriaPrima[]>([]);
  readonly recepciones = signal<Recepcion[]>([]);
  readonly formulas = signal<Formula[]>([]);
  readonly ordenes = signal<OrdenProduccion[]>([]);
  readonly mermas = signal<Merma[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);

  readonly fBuscar = signal('');
  readonly fEstadoOrden = signal('');
  readonly fEstadoMerma = signal('');

  readonly modo = signal<Modo>(null);
  readonly errorModal = signal<string | null>(null);
  readonly editandoId = signal<string | null>(null);
  readonly destinoMerma = signal<'materiaPrima' | 'producto'>('materiaPrima');
  readonly ordenCompletar = signal<OrdenProduccion | null>(null);
  private readonly nombresInsumos = new Map<string, string>();

  readonly formMateria = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    unidadId: [''],
    costo: [0 as number],
    activo: [true],
  });

  readonly formRecepcion = this.fb.nonNullable.group({
    materiaPrimaId: ['', [Validators.required]],
    cantidad: [1 as number, [Validators.required]],
    costoUnitario: [''],
    proveedorId: [''],
    lote: [''],
    observaciones: [''],
  });

  readonly formFormula = this.fb.nonNullable.group({
    productoId: ['', [Validators.required]],
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    detalles: this.fb.array([this.nuevoInsumo()]),
  });

  readonly formOrden = this.fb.nonNullable.group({
    productoId: ['', [Validators.required]],
    formulaId: [''],
    cantidadPlanificada: [1 as number, [Validators.required]],
    observaciones: [''],
  });

  readonly formCompletar = this.fb.nonNullable.group({
    bodegaId: ['', [Validators.required]],
    cantidadProducida: [1 as number, [Validators.required]],
    consumos: this.fb.array([]),
  });

  readonly formMerma = this.fb.nonNullable.group({
    materiaPrimaId: [''],
    productoId: [''],
    ordenId: [''],
    cantidad: [1 as number, [Validators.required]],
    motivo: ['', [Validators.required, Validators.minLength(3)]],
  });

  readonly puedeOperar = () => this.auth.hasPermiso('produccion.operar');
  readonly puedeConfirmar = () => this.auth.hasPermiso('produccion.confirmar');
  readonly puedeMerma = () => this.auth.hasPermiso('mermas.registrar');
  readonly puedeAprobar = () => this.auth.hasPermiso('mermas.aprobar');

  readonly formulasProducto = computed(() => {
    const productoId = this.formOrden.controls.productoId.value;
    return this.formulas().filter((f) => f.producto.id === productoId);
  });

  readonly vacio = computed(() => {
    switch (this.activa()) {
      case 'recepciones':
        return this.recepciones().length === 0;
      case 'formulas':
        return this.formulas().length === 0;
      case 'ordenes':
        return this.ordenes().length === 0;
      case 'mermas':
        return this.mermas().length === 0;
      default:
        return this.materias().length === 0;
    }
  });

  readonly tituloModal = computed(() => {
    switch (this.modo()) {
      case 'materia':
        return this.editandoId() ? 'Editar materia prima' : 'Nueva materia prima';
      case 'recepcion':
        return 'Registrar recepción';
      case 'formula':
        return this.editandoId() ? 'Editar fórmula' : 'Nueva fórmula';
      case 'orden':
        return 'Nueva orden de producción';
      case 'completar':
        return `Completar ${this.ordenCompletar()?.consecutivo ?? 'orden'}`;
      case 'merma':
        return 'Registrar merma';
      default:
        return '';
    }
  });

  get insumos(): FormArray {
    return this.formFormula.controls.detalles;
  }

  get consumos(): FormArray {
    return this.formCompletar.controls.consumos;
  }

  constructor() {
    this.catalogos.listarUnidades().subscribe({ next: (r) => this.unidades.set(r) });
    this.catalogos.listarProductos().subscribe({ next: (r) => this.productos.set(r) });
    this.catalogos.listarBodegas().subscribe({ next: (r) => this.bodegas.set(r) });
    this.catalogos.listarProveedores().subscribe({ next: (r) => this.proveedores.set(r) });
    this.produccion.listarFormulas().subscribe({ next: (r) => this.formulas.set(r) });
    this.cargar();
  }

  private nuevoInsumo() {
    return this.fb.nonNullable.group({
      materiaPrimaId: ['', [Validators.required]],
      cantidad: [1 as number, [Validators.required]],
    });
  }

  cambiar(tab: Tab): void {
    if (this.activa() === tab) return;
    this.activa.set(tab);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    switch (this.activa()) {
      case 'recepciones':
        this.produccion.listarRecepciones().subscribe({
          next: (r) => this.listar(r, this.recepciones),
          error: (e) => this.fallo(e),
        });
        break;
      case 'formulas':
        this.produccion.listarFormulas().subscribe({
          next: (r) => this.listar(r, this.formulas),
          error: (e) => this.fallo(e),
        });
        break;
      case 'ordenes':
        this.produccion.listarOrdenes(this.fEstadoOrden() || undefined).subscribe({
          next: (r) => this.listar(r, this.ordenes),
          error: (e) => this.fallo(e),
        });
        break;
      case 'mermas':
        this.produccion.listarMermas(this.fEstadoMerma() || undefined).subscribe({
          next: (r) => this.listar(r, this.mermas),
          error: (e) => this.fallo(e),
        });
        break;
      default:
        this.produccion.listarMateriasPrimas(this.fBuscar() || undefined).subscribe({
          next: (r) => this.listar(r, this.materias),
          error: (e) => this.fallo(e),
        });
    }
  }

  private listar<T>(datos: T[], destino: { set(v: T[]): void }): void {
    destino.set(datos);
    this.cargando.set(false);
  }

  private fallo(err: unknown): void {
    this.toast.error(this.mensaje(err));
    this.cargando.set(false);
  }

  private recargarMaterias(): void {
    this.produccion.listarMateriasPrimas().subscribe({ next: (r) => this.materias.set(r) });
  }

  // ------------------------------- Materias --------------------------------

  abrirMateria(): void {
    this.editandoId.set(null);
    this.errorModal.set(null);
    this.formMateria.reset({ nombre: '', unidadId: '', costo: 0, activo: true });
    this.modo.set('materia');
  }

  editarMateria(m: MateriaPrima): void {
    this.editandoId.set(m.id);
    this.errorModal.set(null);
    this.formMateria.reset({
      nombre: m.nombre,
      unidadId: m.unidadId ?? '',
      costo: aNumero(m.costo) ?? 0,
      activo: m.activo,
    });
    this.modo.set('materia');
  }

  guardarMateria(): void {
    if (this.formMateria.invalid) {
      this.formMateria.markAllAsTouched();
      this.errorModal.set('Completa el nombre de la materia prima');
      return;
    }
    const v = this.formMateria.getRawValue();
    const dto = {
      nombre: v.nombre,
      unidadId: v.unidadId || undefined,
      costo: aNumero(v.costo) ?? 0,
      activo: v.activo,
    };
    this.guardando.set(true);
    const id = this.editandoId();
    const peticion = id
      ? this.produccion.actualizarMateriaPrima(id, dto)
      : this.produccion.crearMateriaPrima(dto);
    peticion.subscribe({
      next: () => this.exito('Materia prima guardada'),
      error: (err) => this.errorGuardar(err),
    });
  }

  eliminarMateria(m: MateriaPrima): void {
    void this.confirmarEliminarMateria(m);
  }

  private async confirmarEliminarMateria(m: MateriaPrima): Promise<void> {
    const ok = await this.dialogo.confirmar({
      titulo: 'Eliminar materia prima',
      mensaje: `¿Eliminar la materia prima ${m.nombre}?`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    this.produccion.eliminarMateriaPrima(m.id).subscribe({
      next: () => {
        this.toast.exito('Materia prima eliminada');
        this.recargarMaterias();
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  // ------------------------------ Recepciones ------------------------------

  abrirRecepcion(): void {
    this.errorModal.set(null);
    this.formRecepcion.reset({
      materiaPrimaId: '',
      cantidad: 1,
      costoUnitario: '',
      proveedorId: '',
      lote: '',
      observaciones: '',
    });
    this.modo.set('recepcion');
  }

  guardarRecepcion(): void {
    if (this.formRecepcion.invalid) {
      this.formRecepcion.markAllAsTouched();
      this.errorModal.set('Selecciona la materia prima y una cantidad');
      return;
    }
    const v = this.formRecepcion.getRawValue();
    this.guardando.set(true);
    this.produccion
      .crearRecepcion({
        materiaPrimaId: v.materiaPrimaId,
        cantidad: aNumero(v.cantidad) ?? 0,
        costoUnitario:
          v.costoUnitario === '' ? undefined : aNumero(v.costoUnitario),
        proveedorId: v.proveedorId || undefined,
        lote: v.lote || undefined,
        observaciones: v.observaciones || undefined,
      })
      .subscribe({
        next: () => {
          this.exito('Recepción registrada');
          this.recargarMaterias();
        },
        error: (err) => this.errorGuardar(err),
      });
  }

  // -------------------------------- Fórmulas -------------------------------

  abrirFormula(): void {
    this.editandoId.set(null);
    this.errorModal.set(null);
    this.formFormula.reset({ productoId: '', nombre: '' });
    this.insumos.clear();
    this.insumos.push(this.nuevoInsumo());
    this.modo.set('formula');
  }

  editarFormula(f: Formula): void {
    this.editandoId.set(f.id);
    this.errorModal.set(null);
    this.formFormula.reset({ productoId: f.producto.id, nombre: f.nombre });
    this.insumos.clear();
    for (const d of f.detalles) {
      this.insumos.push(
        this.fb.nonNullable.group({
          materiaPrimaId: [d.materiaPrimaId, [Validators.required]],
          cantidad: [Number(d.cantidad), [Validators.required]],
        }),
      );
    }
    this.modo.set('formula');
  }

  agregarInsumo(): void {
    this.insumos.push(this.nuevoInsumo());
  }

  quitarInsumo(i: number): void {
    if (this.insumos.length > 1) this.insumos.removeAt(i);
  }

  verFormula(f: Formula): void {
    const lineas = f.detalles
      .map((d) => `• ${d.materiaPrima?.nombre ?? d.materiaPrimaId}: ${this.numero(d.cantidad)}`)
      .join('\n');
    this.dialogo.avisar({
      titulo: `${f.nombre} (v${f.version})`,
      mensaje: `Producto: ${f.producto.nombre}\n\n${lineas}`,
    });
  }

  guardarFormula(): void {
    if (this.formFormula.invalid) {
      this.formFormula.markAllAsTouched();
      this.errorModal.set('Completa el producto, el nombre y los insumos');
      return;
    }
    const v = this.formFormula.getRawValue();
    const detalles = v.detalles
      .filter((d) => d.materiaPrimaId)
      .map((d) => ({
        materiaPrimaId: d.materiaPrimaId,
        cantidad: aNumero(d.cantidad) ?? 0,
      }));
    if (detalles.length === 0) {
      this.errorModal.set('Agrega al menos un insumo');
      return;
    }
    this.guardando.set(true);
    const id = this.editandoId();
    const peticion = id
      ? this.produccion.actualizarFormula(id, { nombre: v.nombre, detalles })
      : this.produccion.crearFormula({
          productoId: v.productoId,
          nombre: v.nombre,
          detalles,
        });
    peticion.subscribe({
      next: () => {
        this.exito('Fórmula guardada');
        this.produccion
          .listarFormulas()
          .subscribe({ next: (r) => this.formulas.set(r) });
      },
      error: (err) => this.errorGuardar(err),
    });
  }

  eliminarFormula(f: Formula): void {
    void this.confirmarEliminarFormula(f);
  }

  private async confirmarEliminarFormula(f: Formula): Promise<void> {
    const ok = await this.dialogo.confirmar({
      titulo: 'Eliminar fórmula',
      mensaje: `¿Eliminar la fórmula ${f.nombre} v${f.version}?`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    this.produccion.eliminarFormula(f.id).subscribe({
      next: () => {
        this.toast.exito('Fórmula eliminada');
        this.produccion.listarFormulas().subscribe({ next: (r) => this.formulas.set(r) });
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  // -------------------------------- Órdenes --------------------------------

  abrirOrden(): void {
    this.errorModal.set(null);
    this.formOrden.reset({
      productoId: '',
      formulaId: '',
      cantidadPlanificada: 1,
      observaciones: '',
    });
    this.modo.set('orden');
  }

  onProductoOrden(): void {
    this.formOrden.controls.formulaId.setValue('');
    const productoId = this.formOrden.controls.productoId.value;
    const formula = this.formulas().find((f) => f.producto.id === productoId);
    if (formula) this.formOrden.controls.formulaId.setValue(formula.id);
  }

  guardarOrden(): void {
    if (this.formOrden.invalid) {
      this.formOrden.markAllAsTouched();
      this.errorModal.set('Selecciona el producto y la cantidad a producir');
      return;
    }
    const v = this.formOrden.getRawValue();
    this.guardando.set(true);
    this.produccion
      .crearOrden({
        productoId: v.productoId,
        formulaId: v.formulaId || undefined,
        cantidadPlanificada: aNumero(v.cantidadPlanificada) ?? 0,
        observaciones: v.observaciones || undefined,
      })
      .subscribe({
        next: () => this.exito('Orden creada'),
        error: (err) => this.errorGuardar(err),
      });
  }

  verOrden(o: OrdenProduccion): void {
    this.produccion.obtenerOrden(o.id).subscribe({
      next: (orden) => {
        const lineas = (orden.detalles ?? [])
          .map(
            (d) =>
              `• ${d.materiaPrima?.nombre ?? d.materiaPrimaId}: teor. ${this.numero(
                d.cantidadTeorica,
              )} / cons. ${this.numero(d.cantidadConsumida)}`,
          )
          .join('\n');
        this.dialogo.avisar({
          titulo: `${orden.consecutivo} — ${this.etiquetaOrden(orden.estado)}`,
          mensaje: `Producto: ${orden.producto.nombre}\nPlanificado: ${this.numero(
            orden.cantidadPlanificada,
          )} / Producido: ${this.numero(orden.cantidadProducida)}\n\n${lineas}`,
        });
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  iniciarOrden(o: OrdenProduccion): void {
    this.produccion.iniciarOrden(o.id).subscribe({
      next: () => {
        this.toast.exito('Orden iniciada y materias primas reservadas');
        this.recargarMaterias();
        this.cargar();
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  abrirCompletar(o: OrdenProduccion): void {
    this.errorModal.set(null);
    this.ordenCompletar.set(o);
    this.formCompletar.reset({ bodegaId: '', cantidadProducida: Number(o.cantidadPlanificada) });
    this.consumos.clear();
    this.produccion.obtenerOrden(o.id).subscribe({
      next: (orden) => {
        this.ordenCompletar.set(orden);
        this.nombresInsumos.clear();
        for (const d of orden.detalles ?? []) {
          this.nombresInsumos.set(d.materiaPrimaId, d.materiaPrima?.nombre ?? '');
          this.consumos.push(
            this.fb.nonNullable.group({
              materiaPrimaId: [d.materiaPrimaId],
              cantidadConsumida: [Number(d.cantidadTeorica)],
              merma: [0 as number],
            }),
          );
        }
        this.modo.set('completar');
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  nombreInsumo(linea: { get(name: string): { value: unknown } | null }): string {
    const id = linea.get('materiaPrimaId')?.value as string;
    return this.nombresInsumos.get(id) ?? '';
  }

  guardarCompletar(): void {
    const orden = this.ordenCompletar();
    if (!orden) return;
    if (this.formCompletar.invalid) {
      this.formCompletar.markAllAsTouched();
      this.errorModal.set('Selecciona la bodega y la cantidad producida');
      return;
    }
    const v = this.formCompletar.getRawValue();
    const consumos = (
      v.consumos as {
        materiaPrimaId: string;
        cantidadConsumida: number;
        merma: number;
      }[]
    ).map((c) => ({
      materiaPrimaId: c.materiaPrimaId,
      cantidadConsumida: aNumero(c.cantidadConsumida) ?? 0,
      merma: aNumero(c.merma) ?? 0,
    }));
    this.guardando.set(true);
    this.produccion
      .completarOrden(orden.id, {
        bodegaId: v.bodegaId,
        cantidadProducida: aNumero(v.cantidadProducida) ?? 0,
        consumos,
      })
      .subscribe({
        next: () => {
          this.exito('Orden completada');
          this.recargarMaterias();
        },
        error: (err) => this.errorGuardar(err),
      });
  }

  cancelarOrden(o: OrdenProduccion): void {
    void this.confirmarCancelarOrden(o);
  }

  private async confirmarCancelarOrden(o: OrdenProduccion): Promise<void> {
    const ok = await this.dialogo.confirmar({
      titulo: 'Cancelar orden',
      mensaje:
        o.estado === 'EN_PROCESO'
          ? `¿Cancelar la orden ${o.consecutivo}? Se liberará la materia prima reservada.`
          : `¿Cancelar la orden ${o.consecutivo}?`,
      textoConfirmar: 'Cancelar orden',
      peligro: true,
    });
    if (!ok) return;
    this.produccion.cancelarOrden(o.id).subscribe({
      next: () => {
        this.toast.exito('Orden cancelada');
        this.recargarMaterias();
        this.cargar();
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  // --------------------------------- Mermas --------------------------------

  abrirMerma(): void {
    this.errorModal.set(null);
    this.destinoMerma.set('materiaPrima');
    this.formMerma.reset({
      materiaPrimaId: '',
      productoId: '',
      ordenId: '',
      cantidad: 1,
      motivo: '',
    });
    this.modo.set('merma');
  }

  guardarMerma(): void {
    const esMateria = this.destinoMerma() === 'materiaPrima';
    const id = esMateria
      ? this.formMerma.controls.materiaPrimaId.value
      : this.formMerma.controls.productoId.value;
    if (!id || this.formMerma.controls.cantidad.invalid || this.formMerma.controls.motivo.invalid) {
      this.formMerma.markAllAsTouched();
      this.errorModal.set('Selecciona el origen, la cantidad y el motivo');
      return;
    }
    const v = this.formMerma.getRawValue();
    this.guardando.set(true);
    this.produccion
      .crearMerma({
        materiaPrimaId: esMateria ? v.materiaPrimaId : undefined,
        productoId: esMateria ? undefined : v.productoId,
        ordenId: v.ordenId || undefined,
        cantidad: aNumero(v.cantidad) ?? 0,
        motivo: v.motivo,
      })
      .subscribe({
        next: () => this.exito('Merma registrada'),
        error: (err) => this.errorGuardar(err),
      });
  }

  aprobarMerma(m: Merma): void {
    this.produccion.aprobarMerma(m.id).subscribe({
      next: () => {
        this.toast.exito('Merma aprobada');
        this.recargarMaterias();
        this.cargar();
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  rechazarMerma(m: Merma): void {
    this.produccion.rechazarMerma(m.id).subscribe({
      next: () => {
        this.toast.exito('Merma rechazada');
        this.cargar();
      },
      error: (err) => this.toast.error(this.mensaje(err)),
    });
  }

  // -------------------------------- Modal ----------------------------------

  cerrar(): void {
    this.modo.set(null);
    this.editandoId.set(null);
    this.ordenCompletar.set(null);
  }

  private exito(mensaje: string): void {
    this.guardando.set(false);
    this.cerrar();
    this.toast.exito(mensaje);
    this.cargar();
  }

  private errorGuardar(err: unknown): void {
    this.guardando.set(false);
    this.errorModal.set(this.mensaje(err));
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
    return formatearFechaHora(valor);
  }

  etiquetaOrden(estado: EstadoOrdenProduccion): string {
    return ETIQUETA_ESTADO_ORDEN[estado] ?? estado;
  }

  claseOrden(estado: EstadoOrdenProduccion): string {
    switch (estado) {
      case 'COMPLETADA':
        return 'badge-success';
      case 'EN_PROCESO':
        return 'badge-info';
      case 'CANCELADA':
        return 'badge-danger';
      case 'PLANIFICADA':
        return 'badge-warn';
      default:
        return 'badge-muted';
    }
  }

  etiquetaMerma(estado: EstadoMerma): string {
    return ETIQUETA_ESTADO_MERMA[estado] ?? estado;
  }

  claseMerma(estado: EstadoMerma): string {
    switch (estado) {
      case 'APROBADA':
        return 'badge-success';
      case 'RECHAZADA':
        return 'badge-danger';
      default:
        return 'badge-warn';
    }
  }

  private mensaje(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message ?? e?.message ?? 'Ocurrió un error';
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
}
