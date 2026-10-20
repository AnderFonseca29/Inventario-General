export type TipoBodega =
  | 'PRINCIPAL'
  | 'VENDEDOR'
  | 'PRODUCCION'
  | 'MATERIAS_PRIMAS';

export interface Categoria {
  id: string;
  empresaId: string;
  nombre: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { productos: number };
}

export interface Unidad {
  id: string;
  empresaId: string;
  nombre: string;
  abreviatura: string;
  activo: boolean;
  createdAt: string;
  _count?: { productos: number; materiasPrimas: number };
}

export interface Presentacion {
  id: string;
  empresaId: string;
  nombre: string;
  factor: string | null;
  activo: boolean;
  createdAt: string;
  _count?: { productos: number };
}

export interface Producto {
  id: string;
  empresaId: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  categoriaId: string | null;
  unidadId: string | null;
  presentacionId: string | null;
  esBotellon: boolean;
  controlaInventario: boolean;
  costo: string;
  precioVenta: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  categoria?: { id: string; nombre: string } | null;
  unidad?: { id: string; nombre: string; abreviatura: string } | null;
  presentacion?: { id: string; nombre: string } | null;
}

export interface Proveedor {
  id: string;
  empresaId: string;
  nombre: string;
  nit: string | null;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  createdAt: string;
  _count?: { recepciones: number };
}

export interface Bodega {
  id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  tipo: TipoBodega;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { ubicaciones: number; existencias: number };
}

export interface Ubicacion {
  id: string;
  empresaId: string;
  bodegaId: string;
  nombre: string;
  activo: boolean;
  createdAt: string;
  bodega?: { id: string; nombre: string };
}

export interface CategoriaRequest {
  nombre?: string;
  activo?: boolean;
}

export interface UnidadRequest {
  nombre?: string;
  abreviatura?: string;
  activo?: boolean;
}

export interface PresentacionRequest {
  nombre?: string;
  factor?: number;
  activo?: boolean;
}

export interface ProductoRequest {
  sku?: string;
  nombre?: string;
  descripcion?: string;
  categoriaId?: string | null;
  unidadId?: string | null;
  presentacionId?: string | null;
  esBotellon?: boolean;
  controlaInventario?: boolean;
  costo?: number;
  precioVenta?: number;
  activo?: boolean;
}

export interface ProveedorRequest {
  nombre?: string;
  nit?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  activo?: boolean;
}

export interface BodegaRequest {
  codigo?: string;
  nombre?: string;
  tipo?: TipoBodega;
  activo?: boolean;
}

export interface UbicacionRequest {
  bodegaId?: string;
  nombre?: string;
  activo?: boolean;
}

export const ETIQUETA_BODEGA: Record<TipoBodega, string> = {
  PRINCIPAL: 'Principal',
  VENDEDOR: 'Vendedor',
  PRODUCCION: 'Producción',
  MATERIAS_PRIMAS: 'Materias primas',
};
