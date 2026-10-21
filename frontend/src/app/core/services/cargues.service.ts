import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Cargue,
  CargueResumen,
  CrearCargueRequest,
  EstadoCargue,
  VendedorOpcion,
} from '../models/cargues.model';

export interface FiltrosCargues {
  estado?: EstadoCargue;
  buscar?: string;
}

@Injectable({ providedIn: 'root' })
export class CarguesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cargues`;

  listar(filtros: FiltrosCargues = {}): Observable<CargueResumen[]> {
    let params = new HttpParams();
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.buscar) params = params.set('buscar', filtros.buscar);
    return this.http.get<CargueResumen[]>(this.base, { params });
  }

  obtener(id: string): Observable<Cargue> {
    return this.http.get<Cargue>(`${this.base}/${id}`);
  }

  listarVendedores(): Observable<VendedorOpcion[]> {
    return this.http.get<VendedorOpcion[]>(`${this.base}/vendedores`);
  }

  crear(dto: CrearCargueRequest): Observable<Cargue> {
    return this.http.post<Cargue>(this.base, dto);
  }

  confirmar(id: string): Observable<Cargue> {
    return this.http.post<Cargue>(`${this.base}/${id}/confirmar`, {});
  }

  anular(id: string): Observable<Cargue> {
    return this.http.post<Cargue>(`${this.base}/${id}/anular`, {});
  }
}
