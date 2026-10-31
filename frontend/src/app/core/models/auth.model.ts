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

/**
 * Registro público de una empresa. El servidor decide rol, plan, propietario
 * y suscripción: aquí solo viajan los datos que captura el cliente.
 */
export interface RegistroRequest {
  razonSocial: string;
  nombre: string;
  nit?: string;
  matricula?: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  representante: string;
  telefono?: string;
  correoDatos: string;
  sitioWeb?: string;
  nombreAdmin: string;
  email: string;
  password: string;
  aceptaTerminos: boolean;
  versionLegal?: string;
  captchaToken?: string;
}
