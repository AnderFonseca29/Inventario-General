import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
  RegistroRequest,
} from '../models/auth.model';

const ACCESS_KEY = 'inv_access_token';
const REFRESH_KEY = 'inv_refresh_token';
const USER_KEY = 'inv_user';

// Permisos "de terreno": identifican a un usuario operativo (vendedor) que solo
// debe ver su propio resumen y no los modulos de gestión de la empresa.
const PERMISOS_TERRENO = [
  'cargues.ver.propios',
  'botellones.registrar',
  'botellones.ver.propios',
];

// Permisos de gestión/vision de empresa: si el usuario tiene alguno, no es un
// usuario operativo aunque también registre cargues o botellones.
const PERMISOS_EMPRESA = [
  'usuarios.ver',
  'roles.ver',
  'modulos.ver',
  'empresa.configurar',
  'catalogos.ver',
  'inventario.ver',
  'produccion.ver',
  'reportes.ver',
  'auditoria.ver',
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = `${environment.apiUrl}/auth`;

  private readonly _user = signal<AuthenticatedUser | null>(this.leerUsuario());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isSuperAdmin = computed(() => this._user()?.esSuperAdmin ?? false);

  // Dueno de la empresa: unica cuenta autorizada para el modulo de membresias
  // (pago de la suscripcion) y para los reportes de ese modulo.
  readonly esPropietario = computed(() => this._user()?.esPropietario ?? false);

  // Usuario operativo (vendedor): registra actividad propia pero no administra
  // la empresa. Solo debe ver su resumen personal.
  readonly esOperativo = computed(() => {
    const user = this._user();
    if (!user || user.esSuperAdmin) return false;
    const permisos = user.permisos;
    const tieneTerreno = permisos.some((p) => PERMISOS_TERRENO.includes(p));
    const tieneEmpresa = permisos.some((p) => PERMISOS_EMPRESA.includes(p));
    return tieneTerreno && !tieneEmpresa;
  });

  private leerUsuario(): AuthenticatedUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthenticatedUser;
    } catch {
      return null;
    }
  }

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  hasPermiso(codigo: string): boolean {
    return this._user()?.permisos.includes(codigo) ?? false;
  }

  hasAlgunPermiso(codigos: string[]): boolean {
    const permisos = this._user()?.permisos ?? [];
    return codigos.some((c) => permisos.includes(c));
  }

  private guardarSesion(resp: LoginResponse): void {
    localStorage.setItem(ACCESS_KEY, resp.accessToken);
    localStorage.setItem(REFRESH_KEY, resp.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(resp.user));
    this._user.set(resp.user);
  }

  private limpiarSesion(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  login(req: LoginRequest): Observable<AuthenticatedUser> {
    return this.http.post<LoginResponse>(`${this.base}/login`, req).pipe(
      tap((resp) => this.guardarSesion(resp)),
      map((resp) => resp.user),
    );
  }

  /**
   * Registro público: crea la empresa, su propietario y la prueba de 7 días.
   * La respuesta tiene la misma forma que el login, así que la sesión queda
   * iniciada sin un segundo paso.
   */
  registro(req: RegistroRequest): Observable<AuthenticatedUser> {
    return this.http.post<LoginResponse>(`${this.base}/registro`, req).pipe(
      tap((resp) => this.guardarSesion(resp)),
      map((resp) => resp.user),
    );
  }

  me(): Observable<AuthenticatedUser> {
    return this.http.get<AuthenticatedUser>(`${this.base}/me`).pipe(
      tap((user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this._user.set(user);
      }),
    );
  }

  refrescar(): Observable<LoginResponse> {
    const refreshToken = this.refreshToken;
    return this.http
      .post<LoginResponse>(`${this.base}/refresh`, { refreshToken })
      .pipe(tap((resp) => this.guardarSesion(resp)));
  }

  /**
   * Cambia la contrasena del usuario que ha iniciado sesion.
   *
   * El backend exige la contrasena actual y una nueva de al menos 10
   * caracteres con mayuscula, minuscula y numero.
   */
  cambiarContrasena(
    contrasenaActual: string,
    contrasenaNueva: string,
  ): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>(`${this.base}/change-password`, {
      currentPassword: contrasenaActual,
      newPassword: contrasenaNueva,
    });
  }

  cerrarSesion(): void {
    const refreshToken = this.refreshToken;
    if (refreshToken) {
      this.http.post(`${this.base}/logout`, { refreshToken }).subscribe({
        next: () => undefined,
        error: () => undefined,
      });
    }
    this.limpiarSesion();
    void this.router.navigate(['/login']);
  }

  inicializar(): Observable<void> {
    if (!this.accessToken) {
      return of(void 0);
    }
    return this.me().pipe(
      map(() => void 0),
      catchError(() => {
        this.limpiarSesion();
        return of(void 0);
      }),
    );
  }
}
