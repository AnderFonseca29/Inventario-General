export type EstadoEmpresa = 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA';

export interface Empresa {
  id: string;
  nombre: string;
  nit: string | null;
  razonSocial: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  estado: EstadoEmpresa;
  createdAt: string;
  _count?: { usuarios: number; bodegas: number };
}

export interface AdminEmpresaRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface CrearEmpresaRequest {
  nombre: string;
  nit?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  admin: AdminEmpresaRequest;
}

export interface ActualizarEmpresaRequest {
  nombre?: string;
  nit?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
}
