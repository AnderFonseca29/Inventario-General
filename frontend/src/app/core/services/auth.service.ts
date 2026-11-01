import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  map,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthenticatedUser,
  LoginRequest,
  RegistroRequest,
  SesionResponse,
} from '../models/auth.model';

const USER_KEY = 'inv_user';
// Claves de la version anterior. Se eliminan al arrancar para que ningun token
// quede expuesto en localStorage; la sesion ahora vive en cookies httpOnly.
const LEGACY_ACCESS_KEY = 'inv_access_token';
const LEGACY_REFRESH_KEY = 'inv_refresh_token';

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

  constructor() {
    this.eliminarTokensAntiguos();
  }

  private eliminarTokensAntiguos(): void {
    try {
      localStorage.removeItem(LEGACY_ACCESS_KEY);
      localStorage.removeItem(LEGACY_REFRESH_KEY);
    } catch {
      // Almacenamiento bloqueado: no hay tokens antiguos que retirar.
    }
  }

  private leerUsuario(): AuthenticatedUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthenticatedUser;
    } catch {
      return null;
    }
  }

  private guardarUsuario(user: AuthenticatedUser): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Navegacion privada: el usuario vive en memoria durante esta sesion.
    }
    this._user.set(user);
  }

  /**
   * Limpia el espejo local del usuario. El servidor conserva las cookies hasta
   * que expiran o se revocan; este metodo no intenta cerrar la sesion remota.
   */
  limpiarSesionLocal(): void {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Sin almacenamiento, basta con limpiar la senal en memoria.
    }
    this.eliminarTokensAntiguos();
    this._user.set(null);
  }

  hasPermiso(codigo: string): boolean {
    return this._user()?.permisos.includes(codigo) ?? false;
  }

  hasAlgunPermiso(codigos: string[]): boolean {
    const permisos = this._user()?.permisos ?? [];
    return codigos.some((c) => permisos.includes(c));
  }

  login(req: LoginRequest): Observable<AuthenticatedUser> {
    return this.http.post<SesionResponse>(`${this.base}/login`, req).pipe(
      switchMap((resp) => {
        this.guardarUsuario(resp.user);
        return this.verificarCookieDeSesion();
      }),
    );
  }

  /**
   * Registro público: crea la empresa, su propietario y la prueba de 7 días.
   * La respuesta tiene la misma forma que el login, así que la sesión queda
   * iniciada sin un segundo paso.
   */
  registro(req: RegistroRequest): Observable<AuthenticatedUser> {
    return this.http.post<SesionResponse>(`${this.base}/registro`, req).pipe(
      switchMap((resp) => {
        this.guardarUsuario(resp.user);
        return this.verificarCookieDeSesion();
      }),
    );
  }

  /**
   * Comprueba que el navegador acepto la cookie httpOnly antes de navegar. Sin
   * esta verificacion, un navegador que bloquea cookies de terceros mostraria
   * el panel y expulsaria al usuario en la primera peticion.
   */
  private verificarCookieDeSesion(): Observable<AuthenticatedUser> {
    return this.me().pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.limpiarSesionLocal();
          return throwError(
            () =>
              new Error(
                'No se pudo mantener la sesión. Habilita las cookies del navegador e intenta de nuevo.',
              ),
          );
        }
        return throwError(() => error);
      }),
    );
  }

  me(): Observable<AuthenticatedUser> {
    return this.http
      .get<AuthenticatedUser>(`${this.base}/me`)
      .pipe(tap((user) => this.guardarUsuario(user)));
  }

  /**
   * Renueva la sesion usando la cookie httpOnly. No recibe ni devuelve tokens:
   * el navegador actualiza las cookies con la respuesta del servidor.
   */
  refrescar(): Observable<SesionResponse> {
    return this.http.post<SesionResponse>(`${this.base}/refresh`, {}).pipe(
      tap((resp) => this.guardarUsuario(resp.user)),
    );
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
    this.http.post(`${this.base}/logout`, {}).subscribe({
      next: () => undefined,
      error: () => undefined,
    });
    this.limpiarSesionLocal();
    void this.router.navigate(['/login']);
  }

  inicializar(): Observable<void> {
    // Sin un usuario recordado no se consulta la API: la portada publica no
    // debe pagar una peticion por visitante. Si hay usuario, `me` valida la
    // cookie (y el interceptor intenta refrescar una sola vez si expiro).
    if (!this._user()) {
      return of(void 0);
    }
    return this.me().pipe(
      map(() => void 0),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.limpiarSesionLocal();
        }
        return of(void 0);
      }),
    );
  }
}
