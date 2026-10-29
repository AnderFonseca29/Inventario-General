import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type DocumentoLegal = 'TERMINOS' | 'PRIVACIDAD' | 'USO_ACEPTABLE';
export type MetodoAceptacion =
  | 'PRIMER_LOGIN'
  | 'CHECKOUT'
  | 'REGISTRO'
  | 'MANUAL';

export interface DocumentoLegalPendiente {
  documento: DocumentoLegal;
  titulo: string;
  ruta: string;
  hash: string;
}

export interface PendientesLegales {
  version: string;
  fecha: string;
  documentos: DocumentoLegalPendiente[];
}

export interface RespuestaAceptacion {
  registradas: number;
  version: string;
  documentos: DocumentoLegal[];
}

@Injectable({ providedIn: 'root' })
export class LegalService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/legal/aceptaciones`;

  pendientes(): Observable<PendientesLegales> {
    return this.http.get<PendientesLegales>(`${this.base}/pendientes`);
  }

  aceptar(
    documentos: DocumentoLegal[],
    metodo: MetodoAceptacion = 'PRIMER_LOGIN',
  ): Observable<RespuestaAceptacion> {
    return this.http.post<RespuestaAceptacion>(this.base, {
      documentos,
      metodo,
    });
  }

  historial(): Observable<
    Array<{
      documento: DocumentoLegal;
      version: string;
      hash: string;
      metodo: MetodoAceptacion;
      aceptadoEn: string;
    }>
  > {
    return this.http.get<
      Array<{
        documento: DocumentoLegal;
        version: string;
        hash: string;
        metodo: MetodoAceptacion;
        aceptadoEn: string;
      }>
    >(`${this.base}/mias`);
  }
}
