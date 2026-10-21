import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListarAuditoriaDto } from './dto/auditoria.dto';
import { construirPaginado } from '../common/utils/paginacion';
import { aInstanteUtc, finDelDiaUtc } from '../common/utils/fechas';

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

  async listarConFiltros(empresaId: string, filtros: ListarAuditoriaDto) {
    const buscar = filtros.buscar?.trim();
    const rango: Prisma.DateTimeFilter = {};
    if (filtros.desde) {
      rango.gte = aInstanteUtc(filtros.desde);
    }
    if (filtros.hasta) {
      rango.lte = finDelDiaUtc(filtros.hasta);
    }

    const where: Prisma.AuditoriaWhereInput = {
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
    };

    const [registros, total] = await Promise.all([
      this.prisma.auditoria.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip: filtros.skip,
        take: filtros.take,
        include: {
          usuario: { select: { id: true, nombre: true, email: true } },
        },
      }),
      this.prisma.auditoria.count({ where }),
    ]);

    return construirPaginado(registros, total, filtros.pagina, filtros.limite);
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
