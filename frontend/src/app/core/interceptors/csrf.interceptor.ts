import { HttpInterceptorFn } from '@angular/common/http';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * La API exige `X-Requested-With` en peticiones que modifican estado. Es una
 * defensa CSRF: un formulario HTML externo no puede agregar cabeceras y un
 * fetch de otro origen debe superar el preflight CORS del backend.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (METODOS_SEGUROS.has(req.method.toUpperCase())) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { 'X-Requested-With': 'XMLHttpRequest' },
    }),
  );
};
