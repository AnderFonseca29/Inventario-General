export interface ResumenConteo {
  estado: string;
  cantidad: number;
}

export interface ResumenBotellonTipo {
  tipo: string;
  movimientos: number;
  cantidad: number;
}

export interface ResumenCargue {
  id: string;
  consecutivo: string;
  estado: string;
  totalCosto: number;
  items: number;
  creadoEn: string;
  confirmadoEn: string | null;
}

export interface ResumenBotellon {
  id: string;
  tipo: string;
  cantidad: number;
  producto: string;
  creadoEn: string;
}

export interface ResumenMembresia {
  id: string;
  cliente: string;
  plan: string;
  estado: string;
  fechaFin: string;
  creadoEn: string;
}

export interface MiResumen {
  cargues: {
    total: number;
    porEstado: ResumenConteo[];
    recientes: ResumenCargue[];
  };
  botellones: {
    total: number;
    porTipo: ResumenBotellonTipo[];
    recientes: ResumenBotellon[];
  };
  membresias: {
    total: number;
    activas: number;
    porEstado: ResumenConteo[];
    recientes: ResumenMembresia[];
  };
  conciliacionesPendientes: number;
}
