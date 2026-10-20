export interface AuditoriaRegistro {
  id: string;
  empresaId: string | null;
  usuarioId: string | null;
  accion: string;
  entidad: string;
  entidadId: string | null;
  datosAnteriores: unknown;
  datosNuevos: unknown;
  ip: string | null;
  creadoEn: string;
  usuario?: { id: string; nombre: string; email: string } | null;
}

export interface AuditoriaFiltros {
  buscar?: string;
  desde?: string;
  hasta?: string;
  limite?: number;
}
