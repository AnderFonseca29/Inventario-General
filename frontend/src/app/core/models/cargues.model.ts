export type EstadoCargue = 'BORRADOR' | 'CONFIRMADO' | 'ANULADO';

export interface VendedorOpcion {
  id: string;
  nombre: string;
  email: string;
}

export interface CargueResumen {
  id: string;
  bodegaOrigenId: string;
  vendedorId: string;
  usuarioId: string;
  consecutivo: string;
  estado: EstadoCargue;
  observaciones: string | null;
  totalCosto: string;
  creadoEn: string;
  confirmadoEn: string | null;
  bodegaOrigen?: { id: string; nombre: string } | null;
  vendedor: { id: string; nombre: string; email: string };
  usuario: { id: string; nombre: string; email: string };
  _count?: { detalles: number };
}

export interface CargueDetalle {
  id: string;
  productoId: string;
  cantidad: string;
  costoUnitario: string;
  subtotal: string;
  nombreSnapshot: string | null;
  producto: { id: string; sku: string; nombre: string };
}

export interface Cargue extends CargueResumen {
  detalles: CargueDetalle[];
}

export interface CargueDetalleRequest {
  productoId: string;
  cantidad: number;
  costoUnitario?: number;
}

export interface CrearCargueRequest {
  bodegaOrigenId: string;
  vendedorId: string;
  observaciones?: string;
  detalles: CargueDetalleRequest[];
}

export const ETIQUETA_ESTADO_CARGUE: Record<EstadoCargue, string> = {
  BORRADOR: 'Borrador',
  CONFIRMADO: 'Confirmado',
  ANULADO: 'Anulado',
};
