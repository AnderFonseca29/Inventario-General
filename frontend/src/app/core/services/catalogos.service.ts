import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Bodega,
  BodegaRequest,
  Categoria,
  CategoriaRequest,
  Presentacion,
  PresentacionRequest,
  Producto,
  ProductoRequest,
  Proveedor,
  ProveedorRequest,
  Ubicacion,
  UbicacionRequest,
  Unidad,
  UnidadRequest,
} from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/catalogos`;

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.base}/categorias`);
  }
  crearCategoria(dto: CategoriaRequest): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.base}/categorias`, dto);
  }
  actualizarCategoria(id: string, dto: CategoriaRequest): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.base}/categorias/${id}`, dto);
  }
  eliminarCategoria(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/categorias/${id}`);
  }

  listarUnidades(): Observable<Unidad[]> {
    return this.http.get<Unidad[]>(`${this.base}/unidades`);
  }
  crearUnidad(dto: UnidadRequest): Observable<Unidad> {
    return this.http.post<Unidad>(`${this.base}/unidades`, dto);
  }
  actualizarUnidad(id: string, dto: UnidadRequest): Observable<Unidad> {
    return this.http.patch<Unidad>(`${this.base}/unidades/${id}`, dto);
  }
  eliminarUnidad(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/unidades/${id}`);
  }

  listarPresentaciones(): Observable<Presentacion[]> {
    return this.http.get<Presentacion[]>(`${this.base}/presentaciones`);
  }
  crearPresentacion(dto: PresentacionRequest): Observable<Presentacion> {
    return this.http.post<Presentacion>(`${this.base}/presentaciones`, dto);
  }
  actualizarPresentacion(
    id: string,
    dto: PresentacionRequest,
  ): Observable<Presentacion> {
    return this.http.patch<Presentacion>(
      `${this.base}/presentaciones/${id}`,
      dto,
    );
  }
  eliminarPresentacion(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(
      `${this.base}/presentaciones/${id}`,
    );
  }

  listarProductos(buscar?: string): Observable<Producto[]> {
    const params = buscar
      ? new HttpParams().set('buscar', buscar)
      : new HttpParams();
    return this.http.get<Producto[]>(`${this.base}/productos`, { params });
  }
  crearProducto(dto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(`${this.base}/productos`, dto);
  }
  actualizarProducto(id: string, dto: ProductoRequest): Observable<Producto> {
    return this.http.patch<Producto>(`${this.base}/productos/${id}`, dto);
  }
  eliminarProducto(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/productos/${id}`);
  }

  listarProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.base}/proveedores`);
  }
  crearProveedor(dto: ProveedorRequest): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${this.base}/proveedores`, dto);
  }
  actualizarProveedor(id: string, dto: ProveedorRequest): Observable<Proveedor> {
    return this.http.patch<Proveedor>(`${this.base}/proveedores/${id}`, dto);
  }
  eliminarProveedor(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/proveedores/${id}`);
  }

  listarBodegas(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(`${this.base}/bodegas`);
  }
  crearBodega(dto: BodegaRequest): Observable<Bodega> {
    return this.http.post<Bodega>(`${this.base}/bodegas`, dto);
  }
  actualizarBodega(id: string, dto: BodegaRequest): Observable<Bodega> {
    return this.http.patch<Bodega>(`${this.base}/bodegas/${id}`, dto);
  }
  eliminarBodega(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/bodegas/${id}`);
  }

  listarUbicaciones(bodegaId?: string): Observable<Ubicacion[]> {
    const params = bodegaId
      ? new HttpParams().set('bodegaId', bodegaId)
      : new HttpParams();
    return this.http.get<Ubicacion[]>(`${this.base}/ubicaciones`, { params });
  }
  crearUbicacion(dto: UbicacionRequest): Observable<Ubicacion> {
    return this.http.post<Ubicacion>(`${this.base}/ubicaciones`, dto);
  }
  actualizarUbicacion(id: string, dto: UbicacionRequest): Observable<Ubicacion> {
    return this.http.patch<Ubicacion>(`${this.base}/ubicaciones/${id}`, dto);
  }
  eliminarUbicacion(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/ubicaciones/${id}`);
  }
}
