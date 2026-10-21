import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISOS_KEY } from '../decorators/permisos.decorator';
import { SIN_EMPRESA_KEY } from '../decorators/sin-empresa.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

// Garantiza que todo endpoint operativo (los que declaran @Permisos) disponga
// de un empresaId resuelto antes de llegar al controlador. Evita que un
// superadministrador (empresaId = null) provoque errores 500 en endpoints que
// asumen user.empresaId!. El superadministrador puede aportar la empresa via
// query ?empresaId=<uuid>; si no lo hace, se responde 400 con un mensaje claro.
@Injectable()
export class EmpresaContextoGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const sinEmpresa = this.reflector.getAllAndOverride<boolean>(
      SIN_EMPRESA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (sinEmpresa) {
      return true;
    }

    const permisos = this.reflector.getAllAndOverride<string[]>(PERMISOS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Solo los endpoints con permisos operan sobre datos de una empresa.
    if (!permisos || permisos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      query?: Record<string, unknown>;
    }>();
    const user = request.user;
    if (!user) {
      return true;
    }

    if (user.empresaId) {
      return true;
    }

    const empresaIdQuery = request.query?.empresaId;
    if (
      typeof empresaIdQuery === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        empresaIdQuery,
      )
    ) {
      user.empresaId = empresaIdQuery;
      // Express 5 expone query como getter de solo lectura: se redefine sin
      // empresaId para que no active forbidNonWhitelisted en los DTO.
      const { empresaId: _omitido, ...resto } = request.query ?? {};
      void _omitido;
      Object.defineProperty(request, 'query', {
        value: resto,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      return true;
    }

    throw new BadRequestException(
      'Debe indicar la empresa (empresaId) para operar sobre datos de una empresa',
    );
  }
}
