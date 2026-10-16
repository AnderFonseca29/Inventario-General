import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActualizarUsuarioRequest,
  CrearUsuarioRequest,
  Usuario,
} from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.base);
  }

  obtener(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.base}/${id}`);
  }

  crear(dto: CrearUsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.base, dto);
  }

  actualizar(id: string, dto: ActualizarUsuarioRequest): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.base}/${id}`, dto);
  }

  desactivar(id: string): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.base}/${id}/desactivar`, {});
  }

  resetPassword(id: string, newPassword: string): Observable<{ ok: boolean }> {
    return this.http.patch<{ ok: boolean }>(`${this.base}/${id}/password`, { newPassword });
  }
}
