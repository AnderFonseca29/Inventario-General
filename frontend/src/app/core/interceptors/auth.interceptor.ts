import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
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

      if (!refrescando) {
        refrescando = auth.refrescar();
        setTimeout(() => (refrescando = null), 1000);
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
