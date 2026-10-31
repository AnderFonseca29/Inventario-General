import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TipoSolicitudDerechos =
  | 'ACCESO'
  | 'CONSULTA'
  | 'RECTIFICACION'
  | 'SUPRESION'
  | 'REVOCATORIA'
  | 'RECLAMO';

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
  | 'RECIBIDA'
  | 'EN_TRAMITE'
  | 'RESPONDIDA'
  | 'CERRADA'
  | 'RECHAZADA';

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
}
