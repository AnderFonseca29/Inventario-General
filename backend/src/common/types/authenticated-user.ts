export interface AuthenticatedUser {
  id: string;
  email: string;
  empresaId: string | null;
  esSuperAdmin: boolean;
  // Dueno de la empresa (no el superadministrador de plataforma). Solo el
  // dueno ve y administra el modulo de membresias.
  esPropietario: boolean;
  permisos: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  empresaId: string | null;
  esSuperAdmin: boolean;
}
