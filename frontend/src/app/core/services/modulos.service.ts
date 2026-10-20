import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActualizarModuloRequest,
  CrearModuloRequest,
  Modulo,
  ReordenarModuloItem,
} from '../models/modulo.model';

@Injectable({ providedIn: 'root' })
export class ModulosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/modulos`;

  listarMenu(empresaId?: string): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(this.base, {
      params: this.params(empresaId),
    });
  }

  listarGestion(empresaId?: string): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(`${this.base}/gestion`, {
      params: this.params(empresaId),
    });
  }

  crear(dto: CrearModuloRequest, empresaId?: string): Observable<Modulo> {
    return this.http.post<Modulo>(this.base, dto, {
      params: this.params(empresaId),
    });
  }

  actualizar(
    id: string,
    dto: ActualizarModuloRequest,
    empresaId?: string,
  ): Observable<Modulo> {
    return this.http.patch<Modulo>(`${this.base}/${id}`, dto, {
      params: this.params(empresaId),
    });
  }

  eliminar(id: string, empresaId?: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`, {
      params: this.params(empresaId),
    });
  }

  reordenar(
    items: ReordenarModuloItem[],
    empresaId?: string,
  ): Observable<Modulo[]> {
    return this.http.patch<Modulo[]>(
      `${this.base}/reordenar`,
      { items },
      { params: this.params(empresaId) },
    );
  }

  private params(empresaId?: string): HttpParams {
    return empresaId
      ? new HttpParams().set('empresaId', empresaId)
      : new HttpParams();
  }
}
