import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { CatalogosService } from '../../core/services/catalogos.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { DialogoService } from '../../core/services/dialogo.service';
import {
  Bodega,
  Categoria,
  ETIQUETA_BODEGA,
  Presentacion,
  Producto,
  Proveedor,
  TipoBodega,
  Ubicacion,
  Unidad,
} from '../../core/models/catalogo.model';
import { IconComponent } from '../../shared/icons';
import { aNumero } from '../../core/utils/numeros';

interface Opcion {
  value: string;
  label: string;
}

interface Campo {
  key: string;
  label: string;
  tipo: 'text' | 'number' | 'email' | 'checkbox' | 'select';
  requerido?: boolean;
  defecto?: unknown;
  opciones?: () => Opcion[];
  full?: boolean;
}

interface Columna {
  key: string;
  label: string;
  tipo?: 'text' | 'badge' | 'bool' | 'money' | 'code';
}

interface Entidad {
  key: string;
  titulo: string;
  icono: string;
  singular: string;
  campos: Campo[];
  columnas: Columna[];
}

type Fila = Record<string, unknown>;

@Component({
  selector: 'app-catalogos',
  imports: [ReactiveFormsModule, IconComponent],
  template: `
    <div class="page-header">
      <div>
        <div class="page-title">Catálogo</div>
        <div class="page-subtitle">
          Productos, categorías, unidades y definiciones de bodega.
        </div>
      </div>
    </div>

    <div class="segmented catalog-tabs">
      @for (e of entidades; track e.key) {
        <button [class.active]="activa() === e.key" (click)="cambiarTab(e.key)">
          {{ e.titulo }}
        </button>
      }
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="control-icon search">
          <app-icon name="search" />
          <input
            class="form-control"
            [placeholder]="'Buscar en ' + entidad().titulo.toLowerCase() + '…'"
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
        } @else if (filas().length === 0) {
          <div class="empty">
            <app-icon [name]="entidad().icono" />
            <div class="empty-title">Sin {{ entidad().titulo.toLowerCase() }}</div>
            <div>Ajusta la búsqueda o registra un nuevo elemento.</div>
          </div>
        } @else {
          <table class="table">
            <thead>
              <tr>
                @for (c of entidad().columnas; track c.key) {
                  <th>{{ c.label }}</th>
                }
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (fila of filas(); track $any(fila).id) {
                <tr>
                  @for (c of entidad().columnas; track c.key; let idx = $index) {
                    <td>
                      @switch (c.tipo) {
                        @case ('bool') {
                          <span
                            class="badge"
                            [class.badge-success]="valor(fila, c.key)"
                            [class.badge-muted]="!valor(fila, c.key)"
                          >
                            {{ valor(fila, c.key) ? 'Sí' : 'No' }}
                          </span>
                        }
                        @case ('money') {
                          <span class="cell-muted">{{ dinero(valor(fila, c.key)) }}</span>
                        }
                        @case ('code') {
                          <span class="code-pill">{{ valor(fila, c.key) }}</span>
                        }
                        @case ('badge') {
                          <span class="badge badge-info">{{ etiqueta(fila, c.key) }}</span>
                        }
                        @default {
                          @if (idx === 0) {
                            <span class="cell-strong">{{ valor(fila, c.key) }}</span>
                          } @else {
                            <span class="cell-muted">{{ valor(fila, c.key) ?? '—' }}</span>
                          }
                        }
                      }
                    </td>
                  }
                  <td class="actions">
                    @if (puedeAdministrar()) {
                      <button class="btn btn-ghost btn-sm" (click)="abrirEditar($any(fila))" title="Editar">
                        <app-icon name="edit" />
                      </button>
                      <button class="btn btn-danger btn-sm" (click)="eliminar($any(fila))" title="Eliminar">
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
            <h3>{{ editando() ? 'Editar' : 'Nuevo' }} {{ entidad().singular }}</h3>
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
                @for (c of entidad().campos; track c.key) {
                  @if (c.tipo === 'checkbox') {
                    <label class="check" [class.full]="c.full">
                      <input type="checkbox" [formControlName]="c.key" />
                      {{ c.label }}
                    </label>
                  } @else {
                    <div class="form-group" [class.full]="c.full">
                      <label [for]="c.key">{{ c.label }}</label>
                      @if (c.tipo === 'select') {
                        <select [id]="c.key" class="form-control" [formControlName]="c.key">
                          @if (!c.requerido) {
                            <option value="">—</option>
                          }
                          @for (o of c.opciones ? c.opciones() : []; track o.value) {
                            <option [value]="o.value">{{ o.label }}</option>
                          }
                        </select>
                      } @else {
                        <input
                          [id]="c.key"
                          class="form-control"
                          [type]="c.tipo"
                          [formControlName]="c.key"
                          [class.is-invalid]="
                            form.get(c.key)?.touched && form.get(c.key)?.invalid
                          "
                        />
                      }
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
  styleUrl: './catalogos.component.scss',
})
export class CatalogosComponent {
  private readonly catalogos = inject(CatalogosService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialogo = inject(DialogoService);
  private readonly fb = inject(FormBuilder);

  readonly categorias = signal<Categoria[]>([]);
  readonly unidades = signal<Unidad[]>([]);
  readonly presentaciones = signal<Presentacion[]>([]);
  readonly bodegas = signal<Bodega[]>([]);

  readonly activa = signal('productos');
  readonly filas = signal<Fila[]>([]);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly busqueda = signal('');
  readonly modalAbierto = signal(false);
  readonly editando = signal<Fila | null>(null);
  readonly errorModal = signal<string | null>(null);

  form: FormGroup = this.fb.group({});

  readonly puedeAdministrar = () => this.auth.hasPermiso('catalogos.administrar');

  readonly entidades: Entidad[] = [
    {
      key: 'productos',
      titulo: 'Productos',
      singular: 'producto',
      icono: 'box',
      campos: [
        { key: 'sku', label: 'SKU', tipo: 'text', requerido: true },
        { key: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
        { key: 'descripcion', label: 'Descripción', tipo: 'text', full: true },
        {
          key: 'categoriaId',
          label: 'Categoría',
          tipo: 'select',
          opciones: () =>
            this.categorias().map((c) => ({ value: c.id, label: c.nombre })),
        },
        {
          key: 'unidadId',
          label: 'Unidad',
          tipo: 'select',
          opciones: () =>
            this.unidades().map((u) => ({
              value: u.id,
              label: `${u.nombre} (${u.abreviatura})`,
            })),
        },
        {
          key: 'presentacionId',
          label: 'Presentación',
          tipo: 'select',
          opciones: () =>
            this.presentaciones().map((p) => ({ value: p.id, label: p.nombre })),
        },
        { key: 'costo', label: 'Costo', tipo: 'number', defecto: 0 },
        { key: 'precioVenta', label: 'Precio de venta', tipo: 'number', defecto: 0 },
        { key: 'esBotellon', label: 'Es botellón', tipo: 'checkbox', defecto: false },
        {
          key: 'controlaInventario',
          label: 'Controla inventario',
          tipo: 'checkbox',
          defecto: true,
        },
        { key: 'activo', label: 'Activo', tipo: 'checkbox', defecto: true },
      ],
      columnas: [
        { key: 'sku', label: 'SKU', tipo: 'code' },
        { key: 'nombre', label: 'Producto' },
        { key: 'categoria.nombre', label: 'Categoría' },
        { key: 'unidad.abreviatura', label: 'Unidad' },
        { key: 'esBotellon', label: 'Botellón', tipo: 'bool' },
        { key: 'costo', label: 'Costo', tipo: 'money' },
        { key: 'precioVenta', label: 'Precio', tipo: 'money' },
        { key: 'activo', label: 'Activo', tipo: 'bool' },
      ],
    },
    {
      key: 'categorias',
      titulo: 'Categorías',
      singular: 'categoría',
      icono: 'box',
      campos: [
        { key: 'nombre', label: 'Nombre', tipo: 'text', requerido: true, full: true },
        { key: 'activo', label: 'Activo', tipo: 'checkbox', defecto: true },
      ],
      columnas: [
        { key: 'nombre', label: 'Categoría' },
        { key: '_count.productos', label: 'Productos', tipo: 'badge' },
        { key: 'activo', label: 'Activo', tipo: 'bool' },
      ],
    },
    {
      key: 'unidades',
      titulo: 'Unidades',
      singular: 'unidad',
      icono: 'box',
      campos: [
        { key: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
        { key: 'abreviatura', label: 'Abreviatura', tipo: 'text', requerido: true },
        { key: 'activo', label: 'Activo', tipo: 'checkbox', defecto: true },
      ],
      columnas: [
        { key: 'nombre', label: 'Unidad' },
        { key: 'abreviatura', label: 'Abrev.', tipo: 'code' },
        { key: '_count.productos', label: 'Productos', tipo: 'badge' },
        { key: '_count.materiasPrimas', label: 'Materias primas', tipo: 'badge' },
        { key: 'activo', label: 'Activo', tipo: 'bool' },
      ],
    },
    {
      key: 'presentaciones',
      titulo: 'Presentaciones',
      singular: 'presentación',
      icono: 'box',
      campos: [
        { key: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
        { key: 'factor', label: 'Factor', tipo: 'number', defecto: 1 },
        { key: 'activo', label: 'Activo', tipo: 'checkbox', defecto: true },
      ],
      columnas: [
        { key: 'nombre', label: 'Presentación' },
        { key: 'factor', label: 'Factor', tipo: 'code' },
        { key: '_count.productos', label: 'Productos', tipo: 'badge' },
        { key: 'activo', label: 'Activo', tipo: 'bool' },
      ],
    },
    {
      key: 'proveedores',
      titulo: 'Proveedores',
      singular: 'proveedor',
      icono: 'truck',
      campos: [
        { key: 'nombre', label: 'Nombre', tipo: 'text', requerido: true, full: true },
        { key: 'nit', label: 'NIT', tipo: 'text' },
        { key: 'contacto', label: 'Contacto', tipo: 'text' },
        { key: 'email', label: 'Email', tipo: 'email' },
        { key: 'telefono', label: 'Teléfono', tipo: 'text' },
        { key: 'activo', label: 'Activo', tipo: 'checkbox', defecto: true },
      ],
      columnas: [
        { key: 'nombre', label: 'Proveedor' },
        { key: 'nit', label: 'NIT' },
        { key: 'contacto', label: 'Contacto' },
        { key: 'email', label: 'Email' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'activo', label: 'Activo', tipo: 'bool' },
      ],
    },
    {
      key: 'bodegas',
      titulo: 'Bodegas',
      singular: 'bodega',
      icono: 'building',
      campos: [
        { key: 'codigo', label: 'Código', tipo: 'text', requerido: true },
        { key: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
        {
          key: 'tipo',
          label: 'Tipo',
          tipo: 'select',
          requerido: true,
          defecto: 'PRINCIPAL',
          opciones: () =>
            (Object.keys(ETIQUETA_BODEGA) as TipoBodega[]).map((t) => ({
              value: t,
              label: ETIQUETA_BODEGA[t],
            })),
        },
        { key: 'activo', label: 'Activo', tipo: 'checkbox', defecto: true },
      ],
      columnas: [
        { key: 'codigo', label: 'Código', tipo: 'code' },
        { key: 'nombre', label: 'Bodega' },
        { key: 'tipo', label: 'Tipo', tipo: 'badge' },
        { key: '_count.existencias', label: 'Existencias', tipo: 'badge' },
        { key: 'activo', label: 'Activo', tipo: 'bool' },
      ],
    },
    {
      key: 'ubicaciones',
      titulo: 'Ubicaciones',
      singular: 'ubicación',
      icono: 'location',
      campos: [
        {
          key: 'bodegaId',
          label: 'Bodega',
          tipo: 'select',
          requerido: true,
          opciones: () =>
            this.bodegas().map((b) => ({ value: b.id, label: b.nombre })),
        },
        { key: 'nombre', label: 'Nombre', tipo: 'text', requerido: true },
        { key: 'activo', label: 'Activo', tipo: 'checkbox', defecto: true },
      ],
      columnas: [
        { key: 'bodega.nombre', label: 'Bodega' },
        { key: 'nombre', label: 'Ubicación' },
        { key: 'activo', label: 'Activo', tipo: 'bool' },
      ],
    },
  ];

  readonly entidad = computed(
    () => this.entidades.find((e) => e.key === this.activa())!,
  );

  constructor() {
    this.cargarLookups();
    this.cargar();
  }

  // ------------------------------- Utilidades ------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  valor(fila: Fila, path: string): any {
    return path
      .split('.')
      .reduce<unknown>(
        (acc, p) => (acc == null ? undefined : (acc as Fila)[p]),
        fila,
      );
  }

  dinero(valor: unknown): string {
    if (valor == null || valor === '') return '—';
    return Number(valor).toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  etiqueta(fila: Fila, key: string): string {
    const v = this.valor(fila, key);
    if (key === '_count.productos') return `${v ?? 0} productos`;
    if (key === '_count.materiasPrimas') return `${v ?? 0}`;
    if (key === '_count.existencias') return `${v ?? 0}`;
    if (key === 'tipo') return ETIQUETA_BODEGA[v as TipoBodega] ?? String(v);
    return String(v ?? '—');
  }

  // --------------------------------- Carga ---------------------------------

  private cargarLookups(): void {
    this.catalogos.listarCategorias().subscribe({ next: (r) => this.categorias.set(r) });
    this.catalogos.listarUnidades().subscribe({ next: (r) => this.unidades.set(r) });
    this.catalogos.listarPresentaciones().subscribe({ next: (r) => this.presentaciones.set(r) });
    this.catalogos.listarBodegas().subscribe({ next: (r) => this.bodegas.set(r) });
  }

  cambiarTab(key: string): void {
    if (this.activa() === key) return;
    this.activa.set(key);
    this.busqueda.set('');
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    const key = this.activa();
    const fuente = this.fuente(key);
    fuente.subscribe({
      next: (items) => {
        this.filas.set(items as Fila[]);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.toast.error(this.mensaje(err));
        this.cargando.set(false);
      },
    });
  }

  refrescar(): void {
    this.cargarLookups();
    this.cargar();
  }

  private fuente(key: string): Observable<unknown> {
    switch (key) {
      case 'categorias':
        return this.catalogos.listarCategorias();
      case 'unidades':
        return this.catalogos.listarUnidades();
      case 'presentaciones':
        return this.catalogos.listarPresentaciones();
      case 'proveedores':
        return this.catalogos.listarProveedores();
      case 'bodegas':
        return this.catalogos.listarBodegas();
      case 'ubicaciones':
        return this.catalogos.listarUbicaciones();
      default:
        return this.catalogos.listarProductos();
    }
  }

  // --------------------------------- Modal ---------------------------------

  abrirCrear(): void {
    this.editando.set(null);
    this.errorModal.set(null);
    this.construirForm();
    this.modalAbierto.set(true);
  }

  abrirEditar(fila: Fila): void {
    this.editando.set(fila);
    this.errorModal.set(null);
    this.construirForm(fila);
    this.modalAbierto.set(true);
  }

  cerrar(): void {
    this.modalAbierto.set(false);
    this.editando.set(null);
  }

  private construirForm(fila?: Fila): void {
    const grupo = this.fb.group({});
    for (const c of this.entidad().campos) {
      const valorFila = fila ? this.valor(fila, c.key) : undefined;
      let inicial: unknown;
      if (fila) {
        if (c.tipo === 'checkbox') inicial = Boolean(valorFila);
        else if (c.tipo === 'number') inicial = valorFila == null ? '' : Number(valorFila);
        else inicial = valorFila ?? '';
      } else {
        inicial = c.defecto ?? (c.tipo === 'checkbox' ? false : '');
      }
      const validadores = c.requerido ? [Validators.required] : [];
      grupo.addControl(c.key, this.fb.control(inicial, validadores));
    }
    this.form = grupo;
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.errorModal.set(null);
    const payload = this.construirPayload();
    const editando = this.editando();
    const key = this.activa();

    const peticion: Observable<unknown> = editando
      ? this.actualizar$(key, String(editando['id']), payload)
      : this.crear$(key, payload);

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.editando.set(null);
        this.toast.exito(
          editando
            ? `${this.capitalizar(this.entidad().singular)} actualizado`
            : `${this.capitalizar(this.entidad().singular)} creado`,
        );
        this.refrescar();
      },
      error: (err: unknown) => {
        this.guardando.set(false);
        this.errorModal.set(this.mensaje(err));
      },
    });
  }

  private construirPayload(): Record<string, unknown> {
    const raw = this.form.getRawValue() as Record<string, unknown>;
    const payload: Record<string, unknown> = {};
    for (const c of this.entidad().campos) {
      const v = raw[c.key];
      if (c.tipo === 'checkbox') {
        payload[c.key] = Boolean(v);
      } else if (c.tipo === 'number') {
        if (v !== '' && v !== null && v !== undefined) {
          const numero = aNumero(v);
          if (numero !== undefined) payload[c.key] = numero;
        }
      } else if (c.tipo === 'select') {
        payload[c.key] = v === '' ? null : v;
      } else {
        const texto = typeof v === 'string' ? v.trim() : v;
        if (texto !== '' && texto != null) payload[c.key] = texto;
      }
    }
    return payload;
  }

  private crear$(
    key: string,
    payload: Record<string, unknown>,
  ): Observable<unknown> {
    switch (key) {
      case 'categorias':
        return this.catalogos.crearCategoria(payload);
      case 'unidades':
        return this.catalogos.crearUnidad(payload);
      case 'presentaciones':
        return this.catalogos.crearPresentacion(payload);
      case 'proveedores':
        return this.catalogos.crearProveedor(payload);
      case 'bodegas':
        return this.catalogos.crearBodega(payload);
      case 'ubicaciones':
        return this.catalogos.crearUbicacion(payload);
      default:
        return this.catalogos.crearProducto(payload);
    }
  }

  private actualizar$(
    key: string,
    id: string,
    payload: Record<string, unknown>,
  ): Observable<unknown> {
    switch (key) {
      case 'categorias':
        return this.catalogos.actualizarCategoria(id, payload);
      case 'unidades':
        return this.catalogos.actualizarUnidad(id, payload);
      case 'presentaciones':
        return this.catalogos.actualizarPresentacion(id, payload);
      case 'proveedores':
        return this.catalogos.actualizarProveedor(id, payload);
      case 'bodegas':
        return this.catalogos.actualizarBodega(id, payload);
      case 'ubicaciones':
        return this.catalogos.actualizarUbicacion(id, payload);
      default:
        return this.catalogos.actualizarProducto(id, payload);
    }
  }

  eliminar(fila: Fila): void {
    const nombre =
      this.valor(fila, 'nombre') ?? this.valor(fila, 'sku') ?? 'el elemento';
    void this.confirmarEliminar(nombre, fila);
  }

  private async confirmarEliminar(nombre: string, fila: Fila): Promise<void> {
    const entidad = this.entidades.find((e) => e.key === this.activa());
    const singular = entidad?.singular ?? 'elemento';
    const ok = await this.dialogo.confirmar({
      titulo: `Eliminar ${singular}`,
      mensaje: `¿Eliminar ${nombre}? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    this.eliminar$(this.activa(), String(fila['id'])).subscribe({
      next: () => {
        this.toast.exito('Elemento eliminado');
        this.refrescar();
      },
      error: (err: unknown) => this.toast.error(this.mensaje(err)),
    });
  }

  private eliminar$(key: string, id: string): Observable<unknown> {
    switch (key) {
      case 'categorias':
        return this.catalogos.eliminarCategoria(id);
      case 'unidades':
        return this.catalogos.eliminarUnidad(id);
      case 'presentaciones':
        return this.catalogos.eliminarPresentacion(id);
      case 'proveedores':
        return this.catalogos.eliminarProveedor(id);
      case 'bodegas':
        return this.catalogos.eliminarBodega(id);
      case 'ubicaciones':
        return this.catalogos.eliminarUbicacion(id);
      default:
        return this.catalogos.eliminarProducto(id);
    }
  }

  private capitalizar(texto: string): string {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  private mensaje(err: unknown): string {
    const e = err as { error?: { message?: string | string[] }; message?: string };
    const msg = e?.error?.message ?? e?.message ?? 'Ocurrió un error';
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
}
