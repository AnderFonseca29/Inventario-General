import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Purga periodica de tokens e intentos de login caducados (hallazgo H).
 *
 * Sin esta tarea, `refresh_tokens` e `intentos_login` crecen indefinidamente.
 * Se ejecuta cada hora con `setInterval(...).unref()` (no impide que el proceso
 * termine) y tambien una vez al arrancar. No requiere dependencias externas.
 */
@Injectable()
export class TokensPurgaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TokensPurgaService.name);
  private temporizador?: NodeJS.Timeout;
  private static readonly INTERVALO_MS = 60 * 60 * 1000; // 1 hora

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    void this.purgar();
    this.temporizador = setInterval(() => {
      void this.purgar();
    }, TokensPurgaService.INTERVALO_MS);
    this.temporizador.unref?.();
  }

  onModuleDestroy(): void {
    if (this.temporizador) clearInterval(this.temporizador);
  }

  async purgar(): Promise<{ tokens: number; intentos: number }> {
    const ahora = new Date();
    const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
    try {
      const tokens = await this.prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: ahora } },
            { revocado: true, createdAt: { lt: hace30Dias } },
          ],
        },
      });
      const intentos = await this.prisma.intentoLogin.deleteMany({
        where: { creadoEn: { lt: hace30Dias } },
      });
      return { tokens: tokens.count, intentos: intentos.count };
    } catch (error) {
      // La purga nunca debe tumbar la aplicacion (por ejemplo, si la BD cae).
      this.logger.error(
        `No se pudo purgar tokens/intentos: ${(error as Error).message}`,
      );
      return { tokens: 0, intentos: 0 };
    }
  }
}
