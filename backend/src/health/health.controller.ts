import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Health checks (hallazgo M).
 *  - GET /api/health        -> liveness: el proceso responde (no toca la BD).
 *  - GET /api/health/ready  -> readiness: la base de datos responde.
 * Son publicos (sin JWT) porque los usan Render, el monitor de disponibilidad
 * y las pruebas de humo. No exponen ningun dato de negocio.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  liveness() {
    return {
      status: 'ok',
      uptimeSegundos: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  async readiness() {
    const inicio = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        baseDatos: 'no disponible',
      });
    }
    return {
      status: 'ok',
      baseDatos: 'ok',
      latenciaMs: Date.now() - inicio,
      timestamp: new Date().toISOString(),
    };
  }
}
