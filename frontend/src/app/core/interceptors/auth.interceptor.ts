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
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.accessToken;
  const conToken =
    token && !esEndpointAuth(req.url)
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(conToken).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || esEndpointAuth(req.url) || !auth.refreshToken) {
        if (error.status === 401 && !esEndpointAuth(req.url)) {
          auth.cerrarSesion();
        }
        return throwError(() => error);
      }

      // Una sola petición de refresh concurrente para todas las peticiones que
      // fallaron con 401 (hallazgo V). Antes se limpiaba con un setTimeout fijo
      // de 1s, lo que dejaba la variable en un estado inconsistente y permitia
      // refresh duplicados o refresh colgados indefinidamente.
      if (!refrescando) {
        refrescando = auth.refrescar().pipe(
          timeout(15000),
          finalize(() => (refrescando = null)),
        );
      }

      return refrescando.pipe(
        switchMap(() => {
          const nuevoToken = auth.accessToken;
          const reintento = req.clone({
            setHeaders: { Authorization: `Bearer ${nuevoToken}` },
          });
          return next(reintento);
        }),
        catchError((refreshError) => {
          refrescando = null;
          auth.cerrarSesion();
          void router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
