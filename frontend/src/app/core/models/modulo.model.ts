export type TipoModulo = 'SISTEMA' | 'PERSONALIZADO';

export interface Modulo {
  id: string;
  empresaId: string;
  clave: string;
  nombre: string;
  descripcion: string | null;
  icono: string;
  orden: number;
  ruta: string | null;
  tipo: TipoModulo;
  implementado: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrearModuloRequest {
  nombre: string;
  descripcion?: string;
  icono?: string;
  ruta?: string;
  orden?: number;
  activo?: boolean;
}

export interface ActualizarModuloRequest {
  nombre?: string;
  descripcion?: string;
  icono?: string;
  ruta?: string;
  orden?: number;
  activo?: boolean;
}

export interface ReordenarModuloItem {
  id: string;
  orden: number;
}
