export type EstadoOrdenProduccion =
  | 'BORRADOR'
  | 'PLANIFICADA'
  | 'EN_PROCESO'
  | 'COMPLETADA'
  | 'CANCELADA';

export type EstadoMerma = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface MateriaPrima {
  id: string;
  empresaId: string;
  nombre: string;
  unidadId: string | null;
  costo: string;
  disponible: string;
  reservado: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  unidad?: { id: string; nombre: string; abreviatura: string } | null;
  _count?: { recepciones: number; formulaDetalles: number };
}

export interface Recepcion {
  id: string;
  materiaPrimaId: string;
  proveedorId: string | null;
  bodegaId: string | null;
  lote: string | null;
  cantidad: string;
  costoUnitario: string | null;
  observaciones: string | null;
  recibidoEn: string;
  materiaPrima: { id: string; nombre: string };
  proveedor?: { id: string; nombre: string } | null;
  responsable?: { id: string; nombre: string; email: string } | null;
}

export interface FormulaDetalle {
  id: string;
  materiaPrimaId: string;
  cantidad: string;
  materiaPrima?: { id: string; nombre: string };
}

export interface Formula {
  id: string;
  empresaId: string;
  productoId: string;
  nombre: string;
  version: number;
  activo: boolean;
  createdAt: string;
  producto: { id: string; sku: string; nombre: string };
  detalles: FormulaDetalle[];
}

export interface OrdenProduccionDetalle {
  id: string;
  materiaPrimaId: string;
  cantidadTeorica: string;
  cantidadConsumida: string;
  merma: string;
  materiaPrima?: { id: string; nombre: string };
}

export interface OrdenProduccion {
  id: string;
  empresaId: string;
  productoId: string;
  formulaId: string | null;
  consecutivo: string;
  estado: EstadoOrdenProduccion;
  cantidadPlanificada: string;
  cantidadProducida: string;
  observaciones: string | null;
  iniciadaEn: string | null;
  completadaEn: string | null;
  creadoEn: string;
  producto: { id: string; sku: string; nombre: string };
  formula?: { id: string; nombre: string; version: number } | null;
  creadoPor?: { id: string; nombre: string; email: string };
  detalles?: OrdenProduccionDetalle[];
  _count?: { detalles: number; mermas: number };
}

export interface Merma {
  id: string;
  ordenId: string | null;
  productoId: string | null;
  materiaPrimaId: string | null;
  cantidad: string;
  motivo: string;
  estado: EstadoMerma;
  creadoEn: string;
  aprobadoEn: string | null;
  orden?: { id: string; consecutivo: string } | null;
  producto?: { id: string; nombre: string } | null;
  materiaPrima?: { id: string; nombre: string } | null;
  creadoPor?: { id: string; nombre: string; email: string };
  aprobadoPor?: { id: string; nombre: string; email: string } | null;
}

export interface MateriaPrimaRequest {
  nombre?: string;
  unidadId?: string | null;
  costo?: number;
  activo?: boolean;
}

export interface RecepcionRequest {
  materiaPrimaId: string;
  cantidad: number;
  proveedorId?: string;
  bodegaId?: string;
  lote?: string;
  costoUnitario?: number;
  observaciones?: string;
}

export interface FormulaDetalleRequest {
  materiaPrimaId: string;
  cantidad: number;
}

export interface FormulaRequest {
  productoId?: string;
  nombre?: string;
  version?: number;
  activo?: boolean;
  detalles?: FormulaDetalleRequest[];
}

export interface OrdenRequest {
  productoId: string;
  formulaId?: string;
  cantidadPlanificada: number;
  observaciones?: string;
}

export interface ConsumoRequest {
  materiaPrimaId: string;
  cantidadConsumida?: number;
  merma?: number;
}

export interface CompletarOrdenRequest {
  bodegaId: string;
  cantidadProducida: number;
  consumos?: ConsumoRequest[];
}

export interface MermaRequest {
  ordenId?: string;
  productoId?: string;
  materiaPrimaId?: string;
  cantidad: number;
  motivo: string;
}

export const ETIQUETA_ESTADO_ORDEN: Record<EstadoOrdenProduccion, string> = {
  BORRADOR: 'Borrador',
  PLANIFICADA: 'Planificada',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

export const ETIQUETA_ESTADO_MERMA: Record<EstadoMerma, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};
