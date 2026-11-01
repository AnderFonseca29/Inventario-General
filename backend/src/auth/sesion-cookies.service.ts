import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { leerCookie } from '../common/utils/cookies';

export const COOKIE_ACCESO = 'inv_access_token';
export const COOKIE_REFRESCO = 'inv_refresh_token';

/** La cookie de acceso viaja a toda la API; la de refresco solo a /api/auth. */
const RUTA_ACCESO = '/api';
const RUTA_REFRESCO = '/api/auth';

export interface TokensSesion {
  accessToken: string;
  refreshToken: string;
  accessExpiraEn: number;
  refreshExpiraEn: number;
}

/**
 * Fija y limpia las cookies de sesion. En produccion se usa `SameSite=None`
 * porque la API puede estar en otro dominio; `Secure` es obligatorio en ese
 * caso. En desarrollo (HTTP local) se usa `Lax` para que el navegador acepte la
 * cookie sin TLS.
 */
@Injectable()
export class SesionCookiesService {
  private readonly opcionesBase: CookieOptions;

  constructor(config: ConfigService) {
    const seguro =
      config.get<string>('NODE_ENV') === 'production' ||
      config.get<string>('COOKIE_SECURE') === 'true';

    this.opcionesBase = {
      httpOnly: true,
      secure: seguro,
      sameSite: seguro ? 'none' : 'lax',
    };
  }

  establecer(res: Response, tokens: TokensSesion): void {
    const ahora = Date.now();

    res.cookie(COOKIE_ACCESO, tokens.accessToken, {
      ...this.opcionesBase,
      path: RUTA_ACCESO,
      maxAge: Math.max(0, tokens.accessExpiraEn - ahora),
    });
    res.cookie(COOKIE_REFRESCO, tokens.refreshToken, {
      ...this.opcionesBase,
      path: RUTA_REFRESCO,
      maxAge: Math.max(0, tokens.refreshExpiraEn - ahora),
    });
  }

  limpiar(res: Response): void {
    res.clearCookie(COOKIE_ACCESO, {
      ...this.opcionesBase,
      path: RUTA_ACCESO,
    });
    res.clearCookie(COOKIE_REFRESCO, {
      ...this.opcionesBase,
      path: RUTA_REFRESCO,
    });
  }

  leerAcceso(req: { headers: { cookie?: string } }): string | null {
    return leerCookie(req.headers.cookie, COOKIE_ACCESO);
  }

  leerRefresco(req: { headers: { cookie?: string } }): string | null {
    return leerCookie(req.headers.cookie, COOKIE_REFRESCO);
  }
}
