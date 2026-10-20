import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CrearDocumentoRequest,
  Documento,
  DocumentoResumen,
  EstadoDocumento,
  Existencia,
  Movimiento,
} from '../models/inventario.model';

export interface FiltrosExistencias {
  bodegaId?: string;
  productoId?: string;
  buscar?: string;
  soloConStock?: boolean;
}

export interface FiltrosMovimientos {
  productoId?: string;
  bodegaId?: string;
  documentoId?: string;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/inventario`;

  listarExistencias(filtros: FiltrosExistencias = {}): Observable<Existencia[]> {
    let params = new HttpParams();
    if (filtros.bodegaId) params = params.set('bodegaId', filtros.bodegaId);
    if (filtros.productoId) params = params.set('productoId', filtros.productoId);
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    if (filtros.soloConStock) params = params.set('soloConStock', 'true');
    return this.http.get<Existencia[]>(`${this.base}/existencias`, { params });
  }

  listarMovimientos(filtros: FiltrosMovimientos = {}): Observable<Movimiento[]> {
    let params = new HttpParams();
    if (filtros.productoId) params = params.set('productoId', filtros.productoId);
    if (filtros.bodegaId) params = params.set('bodegaId', filtros.bodegaId);
    if (filtros.documentoId) params = params.set('documentoId', filtros.documentoId);
    return this.http.get<Movimiento[]>(`${this.base}/movimientos`, { params });
  }

  listarDocumentos(estado?: EstadoDocumento): Observable<DocumentoResumen[]> {
    const params = estado
      ? new HttpParams().set('estado', estado)
      : new HttpParams();
    return this.http.get<DocumentoResumen[]>(`${this.base}/documentos`, {
      params,
    });
  }

  obtenerDocumento(id: string): Observable<Documento> {
    return this.http.get<Documento>(`${this.base}/documentos/${id}`);
  }

  crearDocumento(dto: CrearDocumentoRequest): Observable<Documento> {
    return this.http.post<Documento>(`${this.base}/documentos`, dto);
  }

  confirmarDocumento(id: string): Observable<Documento> {
    return this.http.post<Documento>(
      `${this.base}/documentos/${id}/confirmar`,
      {},
    );
  }

  anularDocumento(id: string): Observable<Documento> {
    return this.http.post<Documento>(
      `${this.base}/documentos/${id}/anular`,
      {},
    );
  }
}
