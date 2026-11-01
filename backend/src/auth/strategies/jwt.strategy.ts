import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthService } from '../auth.service';
import { leerCookie } from '../../common/utils/cookies';
import { COOKIE_ACCESO } from '../sesion-cookies.service';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../../common/types/authenticated-user';

/**
 * Lee el token de acceso de la cookie httpOnly. Se conserva el Bearer como
 * respaldo para clientes antiguos y para pruebas; el navegador de Stockora ya
 * no guarda tokens en localStorage.
 */
function extraerToken(req: Request): string | null {
  const cabecera = req.headers.authorization;
  if (cabecera?.startsWith('Bearer ')) {
    return cabecera.slice('Bearer '.length);
  }
  return leerCookie(req.headers.cookie, COOKIE_ACCESO);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: extraerToken,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return this.authService.loadAuthenticatedUser(payload.sub);
  }
}
