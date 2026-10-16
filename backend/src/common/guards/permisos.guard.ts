import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISOS_KEY } from '../decorators/permisos.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<string[]>(
      PERMISOS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requeridos || requeridos.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No autenticado');
    }

    const faltantes = requeridos.filter(
      (permiso) => !user.permisos.includes(permiso),
    );
    if (faltantes.length > 0) {
      throw new ForbiddenException(
        `Permisos insuficientes: ${faltantes.join(', ')}`,
      );
    }

    return true;
  }
}
