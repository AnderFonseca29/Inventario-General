export type EstadoMembresia =
  | 'ACTIVA'
  | 'VENCIDA'
  | 'SUSPENDIDA'
  | 'CANCELADA';

export interface Cliente {
  id: string;
  empresaId: string;
  nombre: string;
  documento: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { membresias: number };
}

export interface PlanMembresia {
  id: string;
  empresaId: string;
  nombre: string;
  descripcion: string | null;
  precio: string;
  duracionDias: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { membresias: number };
}

export interface MembresiaCliente {
  id: string;
  empresaId: string;
  clienteId: string;
  planId: string;
  estado: EstadoMembresia;
  fechaInicio: string;
  fechaFin: string;
  createdAt: string;
  updatedAt: string;
  cliente?: { id: string; nombre: string; documento: string | null } | null;
  plan?: {
    id: string;
    nombre: string;
    precio: string;
    duracionDias: number;
  } | null;
}

export interface ClienteRequest {
  nombre?: string;
  documento?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  activo?: boolean;
}

export interface PlanMembresiaRequest {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  duracionDias?: number;
  activo?: boolean;
}

export interface MembresiaRequest {
  clienteId: string;
  planId: string;
  fechaInicio?: string;
}

export interface RenovarMembresiaRequest {
  planId?: string;
  fechaInicio?: string;
}

export const ETIQUETA_ESTADO_MEMBRESIA: Record<EstadoMembresia, string> = {
  ACTIVA: 'Activa',
  VENCIDA: 'Vencida',
  SUSPENDIDA: 'Suspendida',
  CANCELADA: 'Cancelada',
};
