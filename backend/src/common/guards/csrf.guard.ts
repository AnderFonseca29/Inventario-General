import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defensa CSRF para la sesion en cookies.
 *
 * Las cookies httpOnly se envian solas, asi que una pagina externa podria
 * intentar un POST. Exigimos una cabecera personalizada en toda peticion que
 * modifica estado: un formulario HTML no puede agregarla y un fetch de otro
 * origen debe pasar primero por CORS, que solo permite los origenes del
 * producto. Los clientes con Bearer no la necesitan porque el navegador no
 * agrega esa cabecera automaticamente.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (METODOS_SEGUROS.has(req.method.toUpperCase())) {
      return true;
    }

    const usaBearer = req.headers.authorization?.startsWith('Bearer ');
    if (usaBearer) {
      return true;
    }

    if (req.get('x-requested-with') !== 'XMLHttpRequest') {
      throw new ForbiddenException(
        'Solicitud rechazada: falta la cabecera de protección CSRF',
      );
    }

    return true;
  }
}
