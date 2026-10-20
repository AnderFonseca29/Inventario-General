import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Cliente,
  ClienteRequest,
  EstadoMembresia,
  MembresiaCliente,
  MembresiaRequest,
  PlanMembresia,
  PlanMembresiaRequest,
  RenovarMembresiaRequest,
} from '../models/membresia.model';

@Injectable({ providedIn: 'root' })
export class MembresiaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/membresia`;

  // -------------------------------- Clientes -------------------------------

  listarClientes(buscar?: string): Observable<Cliente[]> {
    const params = buscar
      ? new HttpParams().set('buscar', buscar)
      : new HttpParams();
    return this.http.get<Cliente[]>(`${this.base}/clientes`, { params });
  }

  crearCliente(dto: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.base}/clientes`, dto);
  }

  actualizarCliente(id: string, dto: ClienteRequest): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.base}/clientes/${id}`, dto);
  }

  eliminarCliente(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/clientes/${id}`);
  }

  // ----------------------------- Planes de membresia -----------------------

  listarPlanes(buscar?: string): Observable<PlanMembresia[]> {
    const params = buscar
      ? new HttpParams().set('buscar', buscar)
      : new HttpParams();
    return this.http.get<PlanMembresia[]>(`${this.base}/planes`, { params });
  }

  crearPlan(dto: PlanMembresiaRequest): Observable<PlanMembresia> {
    return this.http.post<PlanMembresia>(`${this.base}/planes`, dto);
  }

  actualizarPlan(
    id: string,
    dto: PlanMembresiaRequest,
  ): Observable<PlanMembresia> {
    return this.http.patch<PlanMembresia>(`${this.base}/planes/${id}`, dto);
  }

  eliminarPlan(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/planes/${id}`);
  }

  // ------------------------------ Afiliaciones -----------------------------

  listarMembresias(
    estado?: EstadoMembresia,
    clienteId?: string,
  ): Observable<MembresiaCliente[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    if (clienteId) params = params.set('clienteId', clienteId);
    return this.http.get<MembresiaCliente[]>(`${this.base}/membresias`, {
      params,
    });
  }

  crearMembresia(dto: MembresiaRequest): Observable<MembresiaCliente> {
    return this.http.post<MembresiaCliente>(`${this.base}/membresias`, dto);
  }

  renovarMembresia(
    id: string,
    dto: RenovarMembresiaRequest,
  ): Observable<MembresiaCliente> {
    return this.http.post<MembresiaCliente>(
      `${this.base}/membresias/${id}/renovar`,
      dto,
    );
  }

  cancelarMembresia(id: string): Observable<MembresiaCliente> {
    return this.http.post<MembresiaCliente>(
      `${this.base}/membresias/${id}/cancelar`,
      {},
    );
  }
}
