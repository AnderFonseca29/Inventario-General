export type TipoMovimiento =
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE'
  | 'TRANSFERENCIA'
  | 'DEVOLUCION'
  | 'REVERSO'
  | 'CARGUE'
  | 'RECEPCION_MP'
  | 'CONSUMO_PRODUCCION'
  | 'PRODUCCION'
  | 'MERMA';

export type TipoMovimientoManual =
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE'
  | 'TRANSFERENCIA';

export type EstadoDocumento = 'BORRADOR' | 'CONFIRMADO' | 'ANULADO';

export interface Existencia {
  id: string;
  productoId: string;
  bodegaId: string;
  cantidad: string;
  reservado: string;
  producto: { id: string; sku: string; nombre: string; esBotellon: boolean };
  bodega: { id: string; nombre: string; tipo: string };
}

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  cantidad: string;
  costoUnitario: string | null;
  creadoEn: string;
  bodegaDestinoId: string | null;
  producto: { id: string; sku: string; nombre: string };
  bodega: { id: string; nombre: string };
  usuario: { id: string; nombre: string; email: string };
}

export interface DocumentoResumen {
  id: string;
  tipo: TipoMovimiento;
  consecutivo: string;
  estado: EstadoDocumento;
  bodegaId: string | null;
  bodegaDestinoId: string | null;
  observaciones: string | null;
  creadoEn: string;
  confirmadoEn: string | null;
  bodega?: { id: string; nombre: string } | null;
  bodegaDestino?: { id: string; nombre: string } | null;
  usuario: { id: string; nombre: string; email: string };
  _count: { detalles: number };
}

export interface DocumentoDetalle {
  id: string;
  productoId: string;
  cantidad: string;
  costoUnitario: string | null;
  nombreSnapshot: string | null;
  producto: { id: string; sku: string; nombre: string };
}

export interface Documento extends DocumentoResumen {
  detalles: DocumentoDetalle[];
}

export interface DocumentoDetalleRequest {
  productoId: string;
  cantidad: number;
  costoUnitario?: number;
}

export interface CrearDocumentoRequest {
  tipo: TipoMovimientoManual;
  bodegaId: string;
  bodegaDestinoId?: string;
  observaciones?: string;
  detalles: DocumentoDetalleRequest[];
}

export const ETIQUETA_MOVIMIENTO: Record<TipoMovimiento, string> = {
  ENTRADA: 'Entrada',
  SALIDA: 'Salida',
  AJUSTE: 'Ajuste',
  TRANSFERENCIA: 'Transferencia',
  DEVOLUCION: 'Devolución',
  REVERSO: 'Reverso',
  CARGUE: 'Cargue',
  RECEPCION_MP: 'Recepción MP',
  CONSUMO_PRODUCCION: 'Consumo producción',
  PRODUCCION: 'Producción',
  MERMA: 'Merma',
};

export const ETIQUETA_ESTADO: Record<EstadoDocumento, string> = {
  BORRADOR: 'Borrador',
  CONFIRMADO: 'Confirmado',
  ANULADO: 'Anulado',
};
