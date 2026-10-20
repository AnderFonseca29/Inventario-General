import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RangoFechas,
  ReporteInventario,
  ReporteMembresias,
  ReporteMovimiento,
  ReporteProduccion,
  ReporteResumen,
} from '../models/reportes.model';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reportes`;

  private params(rango?: RangoFechas): HttpParams {
    let params = new HttpParams();
    if (rango?.desde) params = params.set('desde', rango.desde);
    if (rango?.hasta) params = params.set('hasta', rango.hasta);
    return params;
  }

  resumen(): Observable<ReporteResumen> {
    return this.http.get<ReporteResumen>(`${this.base}/resumen`);
  }

  inventario(): Observable<ReporteInventario> {
    return this.http.get<ReporteInventario>(`${this.base}/inventario`);
  }

  movimientos(rango?: RangoFechas): Observable<ReporteMovimiento[]> {
    return this.http.get<ReporteMovimiento[]>(`${this.base}/movimientos`, {
      params: this.params(rango),
    });
  }

  produccion(rango?: RangoFechas): Observable<ReporteProduccion> {
    return this.http.get<ReporteProduccion>(`${this.base}/produccion`, {
      params: this.params(rango),
    });
  }

  membresias(): Observable<ReporteMembresias> {
    return this.http.get<ReporteMembresias>(`${this.base}/membresias`);
  }
}
