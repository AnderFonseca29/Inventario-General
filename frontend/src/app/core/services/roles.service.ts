import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActualizarRolRequest,
  CrearRolRequest,
  Rol,
} from '../models/rol.model';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/roles`;

  listar(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.base);
  }

  obtener(id: string): Observable<Rol> {
    return this.http.get<Rol>(`${this.base}/${id}`);
  }

  crear(dto: CrearRolRequest): Observable<Rol> {
    return this.http.post<Rol>(this.base, dto);
  }

  actualizar(id: string, dto: ActualizarRolRequest): Observable<Rol> {
    return this.http.patch<Rol>(`${this.base}/${id}`, dto);
  }

  eliminar(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/${id}`);
  }
}
