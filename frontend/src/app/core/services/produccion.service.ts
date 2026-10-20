import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompletarOrdenRequest,
  Formula,
  FormulaRequest,
  MateriaPrima,
  MateriaPrimaRequest,
  Merma,
  MermaRequest,
  OrdenProduccion,
  OrdenRequest,
  Recepcion,
  RecepcionRequest,
} from '../models/produccion.model';

@Injectable({ providedIn: 'root' })
export class ProduccionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/produccion`;

  // --------------------------- Materias primas -----------------------------

  listarMateriasPrimas(buscar?: string): Observable<MateriaPrima[]> {
    const params = buscar
      ? new HttpParams().set('buscar', buscar)
      : new HttpParams();
    return this.http.get<MateriaPrima[]>(`${this.base}/materias-primas`, {
      params,
    });
  }

  crearMateriaPrima(dto: MateriaPrimaRequest): Observable<MateriaPrima> {
    return this.http.post<MateriaPrima>(`${this.base}/materias-primas`, dto);
  }

  actualizarMateriaPrima(
    id: string,
    dto: MateriaPrimaRequest,
  ): Observable<MateriaPrima> {
    return this.http.patch<MateriaPrima>(
      `${this.base}/materias-primas/${id}`,
      dto,
    );
  }

  eliminarMateriaPrima(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(
      `${this.base}/materias-primas/${id}`,
    );
  }

  // ------------------------------ Recepciones ------------------------------

  listarRecepciones(materiaPrimaId?: string): Observable<Recepcion[]> {
    const params = materiaPrimaId
      ? new HttpParams().set('materiaPrimaId', materiaPrimaId)
      : new HttpParams();
    return this.http.get<Recepcion[]>(`${this.base}/recepciones`, { params });
  }

  crearRecepcion(dto: RecepcionRequest): Observable<Recepcion> {
    return this.http.post<Recepcion>(`${this.base}/recepciones`, dto);
  }

  // -------------------------------- Formulas -------------------------------

  listarFormulas(): Observable<Formula[]> {
    return this.http.get<Formula[]>(`${this.base}/formulas`);
  }

  obtenerFormula(id: string): Observable<Formula> {
    return this.http.get<Formula>(`${this.base}/formulas/${id}`);
  }

  crearFormula(dto: FormulaRequest): Observable<Formula> {
    return this.http.post<Formula>(`${this.base}/formulas`, dto);
  }

  actualizarFormula(id: string, dto: FormulaRequest): Observable<Formula> {
    return this.http.patch<Formula>(`${this.base}/formulas/${id}`, dto);
  }

  eliminarFormula(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/formulas/${id}`);
  }

  // -------------------------- Ordenes de produccion ------------------------

  listarOrdenes(estado?: string): Observable<OrdenProduccion[]> {
    const params = estado
      ? new HttpParams().set('estado', estado)
      : new HttpParams();
    return this.http.get<OrdenProduccion[]>(`${this.base}/ordenes`, { params });
  }

  obtenerOrden(id: string): Observable<OrdenProduccion> {
    return this.http.get<OrdenProduccion>(`${this.base}/ordenes/${id}`);
  }

  crearOrden(dto: OrdenRequest): Observable<OrdenProduccion> {
    return this.http.post<OrdenProduccion>(`${this.base}/ordenes`, dto);
  }

  iniciarOrden(id: string): Observable<OrdenProduccion> {
    return this.http.post<OrdenProduccion>(
      `${this.base}/ordenes/${id}/iniciar`,
      {},
    );
  }

  completarOrden(
    id: string,
    dto: CompletarOrdenRequest,
  ): Observable<OrdenProduccion> {
    return this.http.post<OrdenProduccion>(
      `${this.base}/ordenes/${id}/completar`,
      dto,
    );
  }

  cancelarOrden(id: string): Observable<OrdenProduccion> {
    return this.http.post<OrdenProduccion>(
      `${this.base}/ordenes/${id}/cancelar`,
      {},
    );
  }

  // --------------------------------- Mermas --------------------------------

  listarMermas(estado?: string): Observable<Merma[]> {
    const params = estado
      ? new HttpParams().set('estado', estado)
      : new HttpParams();
    return this.http.get<Merma[]>(`${this.base}/mermas`, { params });
  }

  crearMerma(dto: MermaRequest): Observable<Merma> {
    return this.http.post<Merma>(`${this.base}/mermas`, dto);
  }

  aprobarMerma(id: string): Observable<Merma> {
    return this.http.post<Merma>(`${this.base}/mermas/${id}/aprobar`, {});
  }

  rechazarMerma(id: string): Observable<Merma> {
    return this.http.post<Merma>(`${this.base}/mermas/${id}/rechazar`, {});
  }
}
