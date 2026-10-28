import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TENANT_KEY } from '../decorators/permisos.decorator';
import type { AuthenticatedUser } from '../types/authenticated-user';

/**
 * TenantGuard (hallazgo K).
 *
 * Los endpoints operativos usan el `empresaId` del token. El superadministrador
 * de plataforma tiene `empresaId = null`, por lo que sin este guard podia
 * llamarlos y provocar consultas con `empresaId IS NULL`, registros huerfanos
 * o errores 500. Este guard:
 *
 *  - Exige que exista un usuario autenticado con empresa asignada.
 *  - Responde 403 con mensaje neutro cuando no la hay (incluido el superadmin:
 *    sus operaciones de soporte usan los endpoints de plataforma).
 *
 * Se activa a nivel de controlador con @RequiereEmpresa() o globalmente en las
 * rutas marcadas. Es compatible con los controladores que ya resuelven la
 * empresa manualmente (modulos).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublico) return true;

    const requiereEmpresa = this.reflector.getAllAndOverride<boolean>(
      TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );
    // Los endpoints de plataforma (empresas, permisos, suscripciones globales)
    // no se marcan como tenant.
    if (!requiereEmpresa) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No autenticado');
    }

    if (user.empresaId) return true;

    // El superadministrador de plataforma no opera las rutas de negocio de una
    // empresa: no tiene empresa asignada y los DTO no aceptan un empresaId
    // externo (el ValidationPipe global rechaza propiedades no declaradas). Sus
    // operaciones de soporte pasan por los endpoints de plataforma (/empresas,
    // /modulos), que resuelven la empresa de forma explicita y auditable.
    throw new ForbiddenException(
      user.esSuperAdmin
        ? 'La cuenta de plataforma no opera datos de empresa. Usa los módulos de administración.'
        : 'El usuario no tiene una empresa asignada',
    );
  }
}

/**
 * Helper para controladores: obtiene el empresaId efectivo del usuario o
 * lanza 403 si no aplica. Sustituye las aserciones `empresaId!`.
 */
export function exigirEmpresa(user: AuthenticatedUser): string {
  if (user.empresaId) return user.empresaId;
  throw new ForbiddenException(
    user.esSuperAdmin
      ? 'La cuenta de plataforma no opera datos de empresa. Usa los módulos de administración.'
      : 'El usuario no tiene una empresa asignada',
  );
}
