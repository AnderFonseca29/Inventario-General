import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HASH_POLITICA_COOKIES, VERSION_POLITICA_COOKIES } from '../legal/documentos-legales';
import { RegistrarConsentimientoCookiesDto } from './dto/consentimiento-cookies.dto';

/** Version del esquema de la decision local que envia el navegador. */
const VERSION_CONSENTIMIENTO = 1;

@Injectable()
export class CookiesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Deja evidencia del consentimiento. La version y el hash de la politica los
   * fija el servidor; el navegador solo aporta su identificador anonimo y las
   * categorias aceptadas.
   */
  async registrar(
    dto: RegistrarConsentimientoCookiesDto,
    ip?: string | null,
    userAgent?: string | null,
  ) {
    await this.prisma.consentimientoCookies.create({
      data: {
        identificador: dto.identificador,
        version: VERSION_CONSENTIMIENTO,
        versionPolitica: VERSION_POLITICA_COOKIES,
        hashPolitica: HASH_POLITICA_COOKIES,
        analitica: dto.analitica,
        publicidad: dto.publicidad,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      },
    });

    return { registrado: true };
  }
}
