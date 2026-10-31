import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SolicitudDerechos, TipoSolicitudDerechos, EstadoSolicitudDerechos } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { sumarDiasHabiles } from '../common/utils/fechas';
import {
  CrearSolicitudDerechosDto,
  ListarDerechosDto,
  ResponderDerechosDto,
} from './dto/derecho.dto';

@Injectable()
export class DerechosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async crear(
    dto: CrearSolicitudDerechosDto,
    ip?: string | null,
    userAgent?: string | null,
  ) {
    const fechaRecepcion = new Date();
    const dias = dto.tipo === TipoSolicitudDerechos.CONSULTA ? 10 : 15;
    const fechaLimite = sumarDiasHabiles(fechaRecepcion, dias);
    const datos = {
      ...dto,
      fechaRecepcion,
      fechaLimite,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    };

    for (let intento = 0; intento < 3; intento += 1) {
      try {
        const creada = await this.prisma.solicitudDerechos.create({
          data: {
            ...datos,
            radicado: this.generarRadicado(fechaRecepcion),
          },
        });

        await this.auditoria.registrar({
          accion: 'RADICAR_SOLICITUD_DERECHOS',
          entidad: 'SolicitudDerechos',
          entidadId: creada.id,
          datosNuevos: {
            radicado: creada.radicado,
            tipo: creada.tipo,
            estado: creada.estado,
          },
          ip,
        });

        return this.resumen(creada);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new ConflictException(
      'No fue posible generar el radicado. Intente nuevamente.',
    );
  }

  async consultar(radicado: string, correo: string) {
    const solicitud = await this.prisma.solicitudDerechos.findFirst({
      where: {
        radicado: radicado.trim().toUpperCase(),
        correo: { equals: correo.trim(), mode: 'insensitive' },
      },
      select: {
        radicado: true,
        tipo: true,
        estado: true,
        fechaRecepcion: true,
        fechaLimite: true,
        fechaRespuesta: true,
        respuesta: true,
      },
    });

    if (!solicitud) {
      throw new NotFoundException(
        'No se encontró una solicitud con el radicado y correo indicados.',
      );
    }

    return solicitud;
  }

  async listar(dto: ListarDerechosDto) {
    const buscar = dto.buscar?.trim();
    const where: Prisma.SolicitudDerechosWhereInput = {
      ...(dto.estado ? { estado: dto.estado } : {}),
      ...(dto.tipo ? { tipo: dto.tipo } : {}),
      ...(buscar
        ? {
            OR: [
              { radicado: { contains: buscar, mode: 'insensitive' } },
              { correo: { contains: buscar, mode: 'insensitive' } },
              { nombre: { contains: buscar, mode: 'insensitive' } },
              { documento: { contains: buscar, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.solicitudDerechos.findMany({
        where,
        orderBy: { fechaRecepcion: 'desc' },
        skip: dto.skip,
        take: dto.take,
      }),
      this.prisma.solicitudDerechos.count({ where }),
    ]);

    return { items, total, pagina: dto.pagina ?? 1, limite: dto.take };
  }

  async obtener(id: string) {
    const solicitud = await this.prisma.solicitudDerechos.findUnique({
      where: { id },
    });
    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada.');
    }
    return solicitud;
  }

  async responder(
    id: string,
    dto: ResponderDerechosDto,
    usuarioId: string,
    ip?: string | null,
  ) {
    const anterior = await this.prisma.solicitudDerechos.findUnique({
      where: { id },
    });
    if (!anterior) {
      throw new NotFoundException('Solicitud no encontrada.');
    }

    const actualizada = await this.prisma.solicitudDerechos.update({
      where: { id },
      data: {
        respuesta: dto.respuesta,
        estado: dto.estado ?? EstadoSolicitudDerechos.RESPONDIDA,
        fechaRespuesta: new Date(),
        respondidoPorId: usuarioId,
      },
    });

    await this.auditoria.registrar({
      usuarioId,
      accion: 'RESPONDER_SOLICITUD_DERECHOS',
      entidad: 'SolicitudDerechos',
      entidadId: id,
      datosAnteriores: {
        estado: anterior.estado,
        respuesta: anterior.respuesta ?? null,
      },
      datosNuevos: {
        estado: actualizada.estado,
        respuesta: actualizada.respuesta ?? null,
      },
      ip,
    });

    return actualizada;
  }

  private resumen(solicitud: SolicitudDerechos) {
    return {
      radicado: solicitud.radicado,
      tipo: solicitud.tipo,
      estado: solicitud.estado,
      fechaRecepcion: solicitud.fechaRecepcion,
      fechaLimite: solicitud.fechaLimite,
    };
  }

  private generarRadicado(fecha: Date): string {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(fecha);
    const valor = (tipo: string): string =>
      partes.find((parte) => parte.type === tipo)?.value ?? '';
    const fechaTexto = `${valor('year')}${valor('month')}${valor('day')}`;
    const sufijo = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    return `DER-${fechaTexto}-${sufijo}`;
  }
}
