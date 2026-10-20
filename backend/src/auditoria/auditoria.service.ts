import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListarAuditoriaDto } from './dto/auditoria.dto';

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

  listarConFiltros(empresaId: string, filtros: ListarAuditoriaDto) {
    const buscar = filtros.buscar?.trim();
    const rango: Prisma.DateTimeFilter = {};
    if (filtros.desde) {
      rango.gte = new Date(filtros.desde);
    }
    if (filtros.hasta) {
      const hasta = new Date(filtros.hasta);
      hasta.setHours(23, 59, 59, 999);
      rango.lte = hasta;
    }

    return this.prisma.auditoria.findMany({
      where: {
        empresaId,
        ...(filtros.usuarioId ? { usuarioId: filtros.usuarioId } : {}),
        ...(filtros.desde || filtros.hasta ? { creadoEn: rango } : {}),
        ...(buscar
          ? {
              OR: [
                { accion: { contains: buscar, mode: 'insensitive' as const } },
                { entidad: { contains: buscar, mode: 'insensitive' as const } },
                {
                  entidadId: {
                    contains: buscar,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { creadoEn: 'desc' },
      take: filtros.limite ?? 200,
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
      },
    });
  }

  async obtener(empresaId: string, id: string) {
    const registro = await this.prisma.auditoria.findFirst({
      where: { id, empresaId },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
      },
    });
    if (!registro)
      throw new NotFoundException('Registro de auditoria no encontrado');
    return registro;
  }
}
