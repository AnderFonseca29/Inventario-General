import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SUPERADMIN_KEY } from '../decorators/superadmin.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const soloSuper = this.reflector.getAllAndOverride<boolean>(
      SUPERADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!soloSuper) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user?.esSuperAdmin) {
      throw new ForbiddenException(
        'Requiere privilegios de propietario de plataforma',
      );
    }

    return true;
  }
}
