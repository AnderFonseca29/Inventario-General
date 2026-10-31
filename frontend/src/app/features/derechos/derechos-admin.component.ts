import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import {
  DerechosService,
  EstadoSolicitudDerechos,
  FiltrosDerechos,
  ResumenDerechos,
  SolicitudDerechosAdmin,
  TipoSolicitudDerechos,
} from '../../core/services/derechos.service';
import { FechaColPipe } from '../../shared/fecha-col.pipe';
import { IconComponent } from '../../shared/icons';

type EstadoRespuesta = 'RESPONDIDA' | 'CERRADA' | 'RECHAZADA';
type FiltroEstado = '' | EstadoSolicitudDerechos;
type FiltroTipo = '' | TipoSolicitudDerechos;

@Component({
  selector: 'app-derechos-admin',
  imports: [ReactiveFormsModule, IconComponent, FechaColPipe],
  templateUrl: './derechos-admin.component.html',
  styleUrl: './derechos-admin.component.scss',
})
export class DerechosAdminComponent implements OnDestroy {
  private readonly derechos = inject(DerechosService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly cargando = signal(false);
  readonly items = signal<SolicitudDerechosAdmin[]>([]);
  readonly total = signal(0);
  readonly pagina = signal(1);
  readonly limite = 20;
  readonly resumen = signal<ResumenDerechos>({
    abiertas: 0,
    respondidas: 0,
    vencidas: 0,
  });

  readonly fBuscar = signal('');
  readonly fEstado = signal<FiltroEstado>('');
  readonly fTipo = signal<FiltroTipo>('');

  readonly detalleAbierto = signal(false);
  readonly detalle = signal<SolicitudDerechosAdmin | null>(null);
  readonly cargandoDetalle = signal(false);
  readonly errorDetalle = signal<string | null>(null);
  readonly respondiendo = signal(false);

  readonly estados: EstadoSolicitudDerechos[] = [
    'RECIBIDA',
    'EN_TRAMITE',
    'RESPONDIDA',
    'CERRADA',
    'RECHAZADA',
  ];

  readonly tipos: TipoSolicitudDerechos[] = [
    'ACCESO',
    'CONSULTA',
    'RECTIFICACION',
    'SUPRESION',
    'REVOCATORIA',
    'RECLAMO',
  ];

  private readonly etiquetasEstado: Record<EstadoSolicitudDerechos, string> = {
    RECIBIDA: 'Recibida',
    EN_TRAMITE: 'En trámite',
    RESPONDIDA: 'Respondida',
    CERRADA: 'Cerrada',
    RECHAZADA: 'Rechazada',
  };

  private readonly etiquetasTipo: Record<TipoSolicitudDerechos, string> = {
    ACCESO: 'Acceso a mis datos',
    CONSULTA: 'Consulta',
    RECTIFICACION: 'Rectificación',
    SUPRESION: 'Supresión',
    REVOCATORIA: 'Revocatoria de autorización',
    RECLAMO: 'Reclamo',
  };

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / this.limite)));
  readonly desde = computed(() => (this.total() === 0 ? 0 : (this.pagina() - 1) * this.limite + 1));
  readonly hasta = computed(() => Math.min(this.pagina() * this.limite, this.total()));
  readonly hayFiltros = computed(
    () => this.fBuscar().trim().length > 0 || this.fEstado() !== '' || this.fTipo() !== '',
  );

  readonly form = this.fb.nonNullable.group({
    respuesta: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(4000)]],
    estado: this.fb.nonNullable.control<EstadoRespuesta>('RESPONDIDA'),
  });

  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    this.cargar();
  }

  ngOnDestroy(): void {
    if (this.temporizador) clearTimeout(this.temporizador);
  }

  cargar(pagina = this.pagina()): void {
    this.cargando.set(true);
    const estado = this.fEstado();
    const tipo = this.fTipo();
    const buscar = this.fBuscar().trim();
    const filtros: FiltrosDerechos = {
      pagina,
      limite: this.limite,
      ...(estado ? { estado } : {}),
      ...(tipo ? { tipo } : {}),
      ...(buscar ? { buscar } : {}),
    };

    this.derechos.listar(filtros).subscribe({
      next: (respuesta) => {
        this.items.set(respuesta.items);
        this.total.set(respuesta.total);
        this.pagina.set(respuesta.pagina);
        this.resumen.set(respuesta.resumen);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.cargando.set(false);
        this.toast.error(this.mensaje(error));
      },
    });
  }

  programarBusqueda(valor: string): void {
    this.fBuscar.set(valor);
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.cargar(1), 350);
  }

  cambiarEstado(valor: string): void {
    this.fEstado.set(valor as FiltroEstado);
    this.cargar(1);
  }

  cambiarTipo(valor: string): void {
    this.fTipo.set(valor as FiltroTipo);
    this.cargar(1);
  }

  limpiarFiltros(): void {
    this.fBuscar.set('');
    this.fEstado.set('');
    this.fTipo.set('');
    this.cargar(1);
  }

  cambiarPagina(delta: number): void {
    const destino = Math.min(Math.max(1, this.pagina() + delta), this.totalPaginas());
    if (destino === this.pagina()) return;
    this.cargar(destino);
  }

  abrirDetalle(solicitud: SolicitudDerechosAdmin): void {
    this.detalle.set(solicitud);
    this.detalleAbierto.set(true);
    this.errorDetalle.set(null);
    this.cargandoDetalle.set(true);
    this.form.reset({
      respuesta: solicitud.respuesta ?? '',
      estado: this.estadoParaResponder(solicitud.estado),
    });

    this.derechos.obtener(solicitud.id).subscribe({
      next: (completa) => {
        this.detalle.set(completa);
        this.cargandoDetalle.set(false);
        this.form.reset({
          respuesta: completa.respuesta ?? '',
          estado: this.estadoParaResponder(completa.estado),
        });
      },
      error: (error: unknown) => {
        this.cargandoDetalle.set(false);
        this.errorDetalle.set(this.mensaje(error));
      },
    });
  }

  cerrarDetalle(): void {
    if (this.respondiendo()) return;
    this.detalleAbierto.set(false);
    this.detalle.set(null);
    this.errorDetalle.set(null);
  }

  guardarRespuesta(): void {
    const actual = this.detalle();
    if (!actual) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.respondiendo.set(true);
    this.errorDetalle.set(null);
    const valores = this.form.getRawValue();

    this.derechos
      .responder(actual.id, {
        respuesta: valores.respuesta.trim(),
        estado: valores.estado,
      })
      .subscribe({
        next: () => {
          this.respondiendo.set(false);
          this.detalleAbierto.set(false);
          this.detalle.set(null);
          this.toast.exito('Respuesta registrada y visible en la consulta');
          const pagina =
            this.items().length === 1 && this.pagina() > 1 ? this.pagina() - 1 : this.pagina();
          this.cargar(pagina);
        },
        error: (error: unknown) => {
          this.respondiendo.set(false);
          this.errorDetalle.set(this.mensaje(error));
        },
      });
  }

  etiquetaEstado(estado: EstadoSolicitudDerechos): string {
    return this.etiquetasEstado[estado];
  }

  etiquetaTipo(tipo: TipoSolicitudDerechos): string {
    return this.etiquetasTipo[tipo];
  }

  claseEstado(estado: EstadoSolicitudDerechos): string {
    switch (estado) {
      case 'RECIBIDA':
        return 'badge badge-warn';
      case 'EN_TRAMITE':
        return 'badge badge-info';
      case 'RESPONDIDA':
        return 'badge badge-success';
      case 'CERRADA':
        return 'badge badge-muted';
      default:
        return 'badge badge-danger';
    }
  }

  plazoVencido(solicitud: SolicitudDerechosAdmin): boolean {
    if (['RESPONDIDA', 'CERRADA', 'RECHAZADA'].includes(solicitud.estado)) {
      return false;
    }
    return new Date(solicitud.fechaLimite).getTime() < Date.now();
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }

  private estadoParaResponder(estado: EstadoSolicitudDerechos): EstadoRespuesta {
    return estado === 'CERRADA' || estado === 'RECHAZADA' ? estado : 'RESPONDIDA';
  }

  private mensaje(error: unknown): string {
    const cuerpo = (error as { error?: { message?: string | string[] } })?.error;
    const mensaje = cuerpo?.message;
    if (Array.isArray(mensaje)) return mensaje.join(' ');
    return mensaje ?? 'No fue posible completar la operación. Intenta de nuevo.';
  }
}
