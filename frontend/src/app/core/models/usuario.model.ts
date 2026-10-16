export interface RolResumen {
  id: string;
  nombre: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  esSuperAdmin: boolean;
  empresaId: string | null;
  ultimoLogin: string | null;
  createdAt: string;
  roles: RolResumen[];
}

export interface CrearUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  roles: string[];
  activo?: boolean;
}

export interface ActualizarUsuarioRequest {
  nombre?: string;
  activo?: boolean;
  roles?: string[];
}
