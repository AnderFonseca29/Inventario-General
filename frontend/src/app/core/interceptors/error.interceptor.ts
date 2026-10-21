import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

/**
 * Interceptor global de errores (hallazgo U).
 *
 * Normaliza los fallos de red mas comunes para que el usuario vea un mensaje
 * util en lugar de un error tecnico:
 *  - status 0   -> sin conexion / servidor inalcanzable / CORS
 *  - status 429 -> demasiadas peticiones (throttling)
 *  - status >=500 -> error del servidor
 *
 * No muestra toast en 401 (lo gestiona el authInterceptor) ni en 400/404/409
 * (mensajes de validacion que ya son especificos y se muestran en el formulario).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        toast.error(
          'No hay conexion con el servidor. Verifica tu red e intentalo de nuevo.',
        );
      } else if (error.status === 429) {
        toast.error(
          'Demasiadas peticiones. Espera unos segundos antes de volver a intentarlo.',
        );
      } else if (error.status >= 500) {
        toast.error(
          'El servidor encontro un error. Intentalo de nuevo en unos momentos.',
        );
      }

      return throwError(() => error);
    }),
  );
};
