import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    // No abortamos el arranque si la base de datos no responde: el proceso debe
    // levantar para servir /api/health (liveness) y reportar el fallo en
    // /api/health/ready (readiness, 503). Prisma reconecta en la primera
    // consulta cuando la base vuelve.
    try {
      await this.$connect();
    } catch (error) {
      this.logger.error(
        `No se pudo conectar a la base de datos al iniciar: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
