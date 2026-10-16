import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Permiso } from '../models/rol.model';

@Injectable({ providedIn: 'root' })
export class PermisosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/permisos`;

  listar(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(this.base);
  }
}
