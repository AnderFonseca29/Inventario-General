import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, switchMap, throwError, timeout } from 'rxjs';
import { AuthService } from '../services/auth.service';

let refrescando: Observable<unknown> | null = null;

function esEndpointAuth(url: string): boolean {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/registro') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout')
  );
}

/**
 * La sesion viaja en cookies httpOnly: el interceptor solo habilita el envio de
 * credenciales y, ante un 401, intenta renovar una vez. Un solo refresh se
 * comparte entre todas las peticiones concurrentes que fallaron.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const conCredenciales = req.clone({ withCredentials: true });

  return next(conCredenciales).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || esEndpointAuth(req.url)) {
        return throwError(() => error);
      }

      if (!refrescando) {
        refrescando = auth.refrescar().pipe(
          timeout(15000),
          finalize(() => (refrescando = null)),
        );
      }

      return refrescando.pipe(
        switchMap(() => next(conCredenciales)),
        catchError((refreshError: HttpErrorResponse) => {
          refrescando = null;
          // Un fallo transitorio del refresh (red o 5xx) no debe cerrar la
          // sesion local; solo un 401/403 indica que ya no es valida.
          if (refreshError.status === 401 || refreshError.status === 403) {
            auth.limpiarSesionLocal();
            // No enviar a /login desde la portada publica: solo las rutas de
            // la aplicacion requieren sesion.
            if (router.url.startsWith('/app')) {
              void router.navigate(['/login']);
            }
          }
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
