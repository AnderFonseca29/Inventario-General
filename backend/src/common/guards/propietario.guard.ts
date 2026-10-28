import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PROPIETARIO_KEY } from '../decorators/propietario.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

// Solo el dueno de la empresa accede a las rutas marcadas con @SoloPropietario
// (modulo de membresias y sus reportes). Los demas usuarios de la empresa
// reciben 403 aunque tengan el permiso asignado.
@Injectable()
export class PropietarioGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const soloPropietario = this.reflector.getAllAndOverride<boolean>(
      PROPIETARIO_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!soloPropietario) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (user?.esSuperAdmin) {
      return true;
    }

    if (!user?.esPropietario) {
      throw new ForbiddenException(
        'Esta seccion es solo para el dueno de la empresa',
      );
    }

    return true;
  }
}
