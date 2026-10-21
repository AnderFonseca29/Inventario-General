import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISOS_ALGUNO_KEY,
  PERMISOS_KEY,
} from '../decorators/permisos.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const requeridos =
      this.reflector.getAllAndOverride<string[]>(PERMISOS_KEY, targets) ?? [];
    const alguno =
      this.reflector.getAllAndOverride<string[]>(
        PERMISOS_ALGUNO_KEY,
        targets,
      ) ?? [];

    if (requeridos.length === 0 && alguno.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No autenticado');
    }

    if (user.esSuperAdmin) {
      return true;
    }

    // @Permisos(...) exige todos los permisos listados.
    const faltantes = requeridos.filter(
      (permiso) => !user.permisos.includes(permiso),
    );
    if (faltantes.length > 0) {
      throw new ForbiddenException(
        `Permisos insuficientes: ${faltantes.join(', ')}`,
      );
    }

    // @PermisosAlguno(...) exige al menos uno de los permisos listados.
    if (alguno.length > 0 && !alguno.some((p) => user.permisos.includes(p))) {
      throw new ForbiddenException(
        `Permisos insuficientes: requiere al menos uno de ${alguno.join(', ')}`,
      );
    }

    return true;
  }
}
