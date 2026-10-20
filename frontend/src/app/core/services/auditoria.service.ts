import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuditoriaFiltros,
  AuditoriaRegistro,
} from '../models/auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/auditorias`;

  listar(filtros?: AuditoriaFiltros): Observable<AuditoriaRegistro[]> {
    let params = new HttpParams();
    if (filtros?.buscar) params = params.set('buscar', filtros.buscar);
    if (filtros?.desde) params = params.set('desde', filtros.desde);
    if (filtros?.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros?.limite) params = params.set('limite', filtros.limite);
    return this.http.get<AuditoriaRegistro[]>(this.base, { params });
  }

  obtener(id: string): Observable<AuditoriaRegistro> {
    return this.http.get<AuditoriaRegistro>(`${this.base}/${id}`);
  }
}
