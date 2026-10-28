import { Injectable } from '@nestjs/common';
import { Plan, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  calcularEstadoSuscripcion,
  DIAS_GRACIA,
  DIAS_PRUEBA,
  EstadoEmpresaSuscripcion,
} from './suscripciones.estado';

const DIA_MS = 24 * 60 * 60 * 1000;

// Plan con el que arranca la prueba gratuita.
const PLAN_PRUEBA = 'basico';

export interface LimitesPlan {
  plan: Plan | null;
  maxUsuarios: number | null;
  maxBodegas: number | null;
  maxReportes: number | null;
}

export interface EstadoEmpresa {
  estado: EstadoEmpresaSuscripcion;
  bloqueado: boolean;
  diasRestantes: number | null;
  finGracia: Date | null;
  fechaFin: Date | null;
  esPrueba: boolean;
  plan: Plan | null;
}

@Injectable()
export class SuscripcionesService {
  /**
   * El estado se consulta en casi todas las peticiones de empresa. Se guarda
   * durante un minuto para no repetir la consulta; al vencer el plazo cambia
   * como mucho un minuto despues, que es suficiente para el aviso y el bloqueo.
   */
  private readonly cache = new Map<
    string,
    { valor: EstadoEmpresa; expira: number }
  >();
  private static readonly TTL_MS = 60_000;

  constructor(private readonly prisma: PrismaService) {}

  async estadoEmpresa(empresaId: string): Promise<EstadoEmpresa> {
    const guardado = this.cache.get(empresaId);
    if (guardado && guardado.expira > Date.now()) {
      return guardado.valor;
    }

    const suscripcion = await this.prisma.suscripcion.findFirst({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    const calculado = calcularEstadoSuscripcion(suscripcion);
    const valor: EstadoEmpresa = {
      ...calculado,
      fechaFin: suscripcion?.fechaFin ?? null,
      esPrueba: suscripcion?.esPrueba ?? false,
      plan: suscripcion?.plan ?? null,
    };

    this.cache.set(empresaId, {
      valor,
      expira: Date.now() + SuscripcionesService.TTL_MS,
    });
    return valor;
  }

  /** Invalida la cache (activar plan, suspender, pagar...). */
  olvidar(empresaId: string): void {
    this.cache.delete(empresaId);
  }

  async planVigente(empresaId: string): Promise<Plan | null> {
    const estado = await this.estadoEmpresa(empresaId);
    return estado.bloqueado ? null : estado.plan;
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

  /**
   * Crea la suscripcion de prueba de una empresa nueva: 3 dias + 1 de gracia.
   * Se llama dentro de la transaccion del alta para que la empresa no exista
   * nunca sin su periodo. Si el seed no corrio (no hay planes), devuelve null
   * y el alta sigue adelante: es preferible a romper la creacion de empresas.
   */
  async crearPrueba(
    tx: Prisma.TransactionClient,
    empresaId: string,
    ahora: Date = new Date(),
  ) {
    const plan = await tx.plan.findUnique({
      where: { codigo: PLAN_PRUEBA },
      select: { id: true },
    });
    if (!plan) return null;

    const inicio = ahora;
    const fechaFin = new Date(inicio.getTime() + DIAS_PRUEBA * DIA_MS);

    const suscripcion = await tx.suscripcion.create({
      data: {
        empresaId,
        planId: plan.id,
        estado: 'ACTIVA',
        fechaInicio: inicio,
        fechaFin,
        diasGracia: DIAS_GRACIA,
        esPrueba: true,
      },
    });

    await tx.historialSuscripcion.create({
      data: {
        empresaId,
        suscripcionId: suscripcion.id,
        estadoNuevo: 'ACTIVA',
        planNuevoId: plan.id,
        motivo: `Prueba de ${DIAS_PRUEBA} dias + ${DIAS_GRACIA} de gracia`,
      },
    });

    return suscripcion;
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
