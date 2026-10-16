import { Injectable } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface LimitesPlan {
  plan: Plan | null;
  maxUsuarios: number | null;
  maxBodegas: number | null;
  maxReportes: number | null;
}

@Injectable()
export class SuscripcionesService {
  constructor(private readonly prisma: PrismaService) {}

  async planVigente(empresaId: string): Promise<Plan | null> {
    const suscripcion = await this.prisma.suscripcion.findFirst({
      where: { empresaId, estado: { in: ['ACTIVA', 'EN_GRACIA'] } },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
    return suscripcion?.plan ?? null;
  }

  async limites(empresaId: string): Promise<LimitesPlan> {
    const plan = await this.planVigente(empresaId);
    return {
      plan,
      maxUsuarios: plan?.maxUsuarios ?? null,
      maxBodegas: plan?.maxBodegas ?? null,
      maxReportes: plan?.maxReportes ?? null,
    };
  }

  listarPlanes() {
    return this.prisma.plan.findMany({
      where: { activo: true },
      orderBy: { precioMensual: 'asc' },
      include: {
        funcionalidades: { include: { funcionalidad: true } },
      },
    });
  }
}
