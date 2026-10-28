import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TENANT_KEY } from '../decorators/permisos.decorator';
import { SIN_SUSCRIPCION_KEY } from '../decorators/sin-suscripcion.decorator';
import { SuscripcionesService } from '../../suscripciones/suscripciones.service';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * Corta las rutas de empresa cuando el periodo de prueba (3 dias + 1 de
 * gracia) termino. Devuelve 402 Payment Required con un mensaje legible para
 * que el frontend muestre la pantalla de bloqueo en lugar de un error
 * generico.
 *
 * No aplica a:
 *  - rutas publicas (login, salud),
 *  - endpoints de plataforma (no marcados con @RequiereEmpresa),
 *  - superadministradores,
 *  - rutas marcadas con @SinSuscripcion() (la consulta del propio plan),
 *  - empresas sin ninguna suscripcion (anteriores al periodo de prueba).
 */
@Injectable()
export class SuscripcionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly suscripciones: SuscripcionesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublico) return true;

    const requiereEmpresa = this.reflector.getAllAndOverride<boolean>(
      TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiereEmpresa) return true;

    const sinControl = this.reflector.getAllAndOverride<boolean>(
      SIN_SUSCRIPCION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (sinControl) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user?.empresaId || user.esSuperAdmin) return true;

    const estado = await this.suscripciones.estadoEmpresa(user.empresaId);
    if (!estado.bloqueado) return true;

    throw new HttpException(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message:
          'El periodo de prueba terminó. Contacta al administrador para activar el plan.',
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
