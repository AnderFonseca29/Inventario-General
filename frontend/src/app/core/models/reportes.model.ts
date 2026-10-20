export interface ReporteResumen {
  productosActivos: number;
  clientesActivos: number;
  membresiasActivas: number;
  planesActivos: number;
  ordenesEnProceso: number;
  mermasPendientes: number;
  documentosBorrador: number;
  carguesBorrador: number;
  movimientosBotellonPendientes: number;
  valorInventario: number;
  unidadesInventario: number;
}

export interface ReporteInventarioProducto {
  productoId: string;
  sku: string;
  nombre: string;
  cantidad: number;
  valor: number;
}

export interface ReporteInventarioBodega {
  bodegaId: string;
  nombre: string;
  cantidad: number;
  valor: number;
}

export interface ReporteInventario {
  porProducto: ReporteInventarioProducto[];
  porBodega: ReporteInventarioBodega[];
  totalValor: number;
}

export interface ReporteMovimiento {
  tipo: string;
  movimientos: number;
  cantidad: number;
}

export interface ReporteOrdenEstado {
  estado: string;
  ordenes: number;
  cantidadPlanificada: number;
  cantidadProducida: number;
}

export interface ReporteMermaEstado {
  estado: string;
  mermas: number;
  cantidad: number;
}

export interface ReporteProduccion {
  ordenes: ReporteOrdenEstado[];
  mermas: ReporteMermaEstado[];
}

export interface ReporteMembresiaEstado {
  estado: string;
  membresias: number;
}

export interface ReporteMembresiaPlan {
  planId: string;
  nombre: string;
  precio: number;
  activas: number;
}

export interface ReporteMembresias {
  porEstado: ReporteMembresiaEstado[];
  porPlan: ReporteMembresiaPlan[];
  totalActivas: number;
}

export interface RangoFechas {
  desde?: string;
  hasta?: string;
}
