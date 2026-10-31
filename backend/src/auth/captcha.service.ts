import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Verificación anti-robots con Cloudflare Turnstile.
 *
 * Está detrás de la bandera `TURNSTILE_ENABLED`. Mientras no haya llaves
 * configuradas el registro funciona sin CAPTCHA, pero esa decisión es
 * explícita: si la bandera está activa y falta el token, se rechaza.
 */
@Injectable()
export class CaptchaService {
  constructor(private readonly config: ConfigService) {}

  private get habilitado(): boolean {
    return this.config.get<string>('TURNSTILE_ENABLED') === 'true';
  }

  async verificar(token: string | undefined, ip?: string): Promise<void> {
    if (!this.habilitado) return;

    if (!token) {
      throw new BadRequestException(
        'Falta la verificación anti-robots. Recarga la página e intenta de nuevo.',
      );
    }

    const secreto = this.config.get<string>('TURNSTILE_SECRET_KEY');
    if (!secreto) {
      throw new ServiceUnavailableException('La verificación anti-robots no está configurada.');
    }

    const cuerpo = new URLSearchParams({ secret: secreto, response: token });
    if (ip) cuerpo.set('remoteip', ip);

    let aprobado = false;
    try {
      const respuesta = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: cuerpo,
      });
      const datos = (await respuesta.json()) as { success?: boolean };
      aprobado = datos.success === true;
    } catch {
      aprobado = false;
    }

    if (!aprobado) {
      throw new BadRequestException('No pudimos verificar que no eres un robot. Intenta de nuevo.');
    }
  }
}
