import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TipoSolicitudDerechos =
  'ACCESO' | 'CONSULTA' | 'RECTIFICACION' | 'SUPRESION' | 'REVOCATORIA' | 'RECLAMO';

export interface CrearSolicitudDerechos {
  tipo: TipoSolicitudDerechos;
  nombre: string;
  documento: string;
  correo: string;
  telefono?: string;
  empresa?: string;
  mensaje: string;
  autorizacion: boolean;
}

export interface RadicadoDerechos {
  radicado: string;
  tipo: TipoSolicitudDerechos;
  estado: EstadoSolicitudDerechos;
  fechaRecepcion: string;
  fechaLimite: string;
}

export type EstadoSolicitudDerechos =
  'RECIBIDA' | 'EN_TRAMITE' | 'RESPONDIDA' | 'CERRADA' | 'RECHAZADA';

export interface ConsultaDerechos {
  radicado: string;
  tipo: TipoSolicitudDerechos;
  estado: EstadoSolicitudDerechos;
  fechaRecepcion: string;
  fechaLimite: string;
  fechaRespuesta: string | null;
  /** Texto de la respuesta, disponible cuando el estado es RESPONDIDA o CERRADA. */
  respuesta: string | null;
}

/** Registro completo que ve el superadmin en la bandeja de PQR. */
export interface SolicitudDerechosAdmin {
  id: string;
  radicado: string;
  tipo: TipoSolicitudDerechos;
  nombre: string;
  documento: string;
  correo: string;
  telefono: string | null;
  empresa: string | null;
  mensaje: string;
  autorizacion: boolean;
  estado: EstadoSolicitudDerechos;
  fechaRecepcion: string;
  fechaLimite: string;
  fechaRespuesta: string | null;
  respuesta: string | null;
  respondidoPorId: string | null;
  respondidoPor?: { nombre: string; email: string } | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResumenDerechos {
  abiertas: number;
  respondidas: number;
  vencidas: number;
}

export interface PaginaDerechos {
  items: SolicitudDerechosAdmin[];
  total: number;
  pagina: number;
  limite: number;
  resumen: ResumenDerechos;
}

export interface FiltrosDerechos {
  pagina?: number;
  limite?: number;
  estado?: EstadoSolicitudDerechos;
  tipo?: TipoSolicitudDerechos;
  buscar?: string;
}

export interface ResponderDerechos {
  respuesta: string;
  estado?: Extract<EstadoSolicitudDerechos, 'RESPONDIDA' | 'CERRADA' | 'RECHAZADA'>;
}

@Injectable({ providedIn: 'root' })
export class DerechosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/derechos`;

  crear(payload: CrearSolicitudDerechos): Observable<RadicadoDerechos> {
    return this.http.post<RadicadoDerechos>(this.base, payload);
  }

  consultar(radicado: string, correo: string): Observable<ConsultaDerechos> {
    return this.http.get<ConsultaDerechos>(
      `${this.base}/consulta/${encodeURIComponent(radicado.trim())}`,
      { params: { correo: correo.trim() } },
    );
  }

  listar(filtros: FiltrosDerechos = {}): Observable<PaginaDerechos> {
    let params = new HttpParams()
      .set('pagina', String(filtros.pagina ?? 1))
      .set('limite', String(filtros.limite ?? 20));

    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros.buscar?.trim()) params = params.set('buscar', filtros.buscar.trim());

    return this.http.get<PaginaDerechos>(this.base, { params });
  }

  obtener(id: string): Observable<SolicitudDerechosAdmin> {
    return this.http.get<SolicitudDerechosAdmin>(`${this.base}/${id}`);
  }

  responder(id: string, payload: ResponderDerechos): Observable<SolicitudDerechosAdmin> {
    return this.http.patch<SolicitudDerechosAdmin>(`${this.base}/${id}/responder`, payload);
  }
}
