import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface RegistrarAuditoria {
  empresaId?: string | null;
  usuarioId?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  datosAnteriores?: Prisma.InputJsonValue;
  datosNuevos?: Prisma.InputJsonValue;
  ip?: string | null;
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrar(evento: RegistrarAuditoria): Promise<void> {
    try {
      await this.prisma.auditoria.create({
        data: {
          empresaId: evento.empresaId ?? null,
          usuarioId: evento.usuarioId ?? null,
          accion: evento.accion,
          entidad: evento.entidad,
          entidadId: evento.entidadId ?? null,
          datosAnteriores: evento.datosAnteriores,
          datosNuevos: evento.datosNuevos,
          ip: evento.ip ?? null,
        },
      });
    } catch (error) {
      // La auditoria no debe romper la operacion principal, pero si debe quedar visible.
      this.logger.error(
        `No se pudo registrar auditoria (${evento.accion} ${evento.entidad}): ${
          (error as Error).message
        }`,
      );
    }
  }

  listar(empresaId: string, limite = 100) {
    return this.prisma.auditoria.findMany({
      where: { empresaId },
      orderBy: { creadoEn: 'desc' },
      take: limite,
    });
  }
}
