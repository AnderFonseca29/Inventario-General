export interface AuthenticatedUser {
  id: string;
  email: string;
  empresaId: string | null;
  esSuperAdmin: boolean;
  // Dueno de la empresa: unica cuenta que ve el modulo de membresias.
  esPropietario: boolean;
  permisos: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}
