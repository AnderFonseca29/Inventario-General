export interface Permiso {
  id: string;
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion: string | null;
}

export interface RolPermisoAsignado {
  permiso: Permiso;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion: string | null;
  esSistema: boolean;
  permisos: RolPermisoAsignado[];
  _count?: { usuarios: number };
}

export interface CrearRolRequest {
  nombre: string;
  descripcion?: string;
  permisos: string[];
}

export interface ActualizarRolRequest {
  nombre?: string;
  descripcion?: string;
  permisos?: string[];
}
