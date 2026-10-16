export interface AuthenticatedUser {
  id: string;
  email: string;
  empresaId: string | null;
  esSuperAdmin: boolean;
  permisos: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string | null;
  esSuperAdmin: boolean;
}
