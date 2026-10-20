import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MiResumen } from '../models/resumen.model';

@Injectable({ providedIn: 'root' })
export class ResumenService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/resumen`;

  miResumen(): Observable<MiResumen> {
    return this.http.get<MiResumen>(`${this.base}/mi-resumen`);
  }
}
