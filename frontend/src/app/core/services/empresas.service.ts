import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActualizarEmpresaRequest,
  CrearEmpresaRequest,
  Empresa,
  EstadoEmpresa,
} from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/empresas`;
  private readonly miBase = `${environment.apiUrl}/mi-empresa`;

  listar(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.base);
  }

  obtener(id: string): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.base}/${id}`);
  }

  crear(dto: CrearEmpresaRequest): Observable<Empresa> {
    return this.http.post<Empresa>(this.base, dto);
  }

  actualizar(id: string, dto: ActualizarEmpresaRequest): Observable<Empresa> {
    return this.http.patch<Empresa>(`${this.base}/${id}`, dto);
  }

  cambiarEstado(id: string, estado: EstadoEmpresa): Observable<Empresa> {
    return this.http.patch<Empresa>(`${this.base}/${id}/estado`, { estado });
  }

  miEmpresa(): Observable<Empresa> {
    return this.http.get<Empresa>(this.miBase);
  }

  actualizarMiEmpresa(dto: ActualizarEmpresaRequest): Observable<Empresa> {
    return this.http.patch<Empresa>(this.miBase, dto);
  }
}
