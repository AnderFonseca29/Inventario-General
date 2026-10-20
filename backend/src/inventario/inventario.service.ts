import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoDocumento, Prisma, TipoMovimiento } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  CreateDocumentoDto,
  ListarExistenciasDto,
  ListarMovimientosDto,
} from './dto/inventario.dto';

const PREFIJO_CONSECUTIVO: Record<TipoMovimiento, string> = {
  ENTRADA: 'ENT',
  SALIDA: 'SAL',
  AJUSTE: 'AJU',
  TRANSFERENCIA: 'TRA',
  DEVOLUCION: 'DEV',
  REVERSO: 'REV',
  CARGUE: 'CAR',
  RECEPCION_MP: 'RMP',
  CONSUMO_PRODUCCION: 'CPR',
  PRODUCCION: 'PRO',
  MERMA: 'MER',
};

const TIPOS_MANUALES: TipoMovimiento[] = [
  'ENTRADA',
  'SALIDA',
  'AJUSTE',
  'TRANSFERENCIA',
];

@Injectable()
export class InventarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ------------------------------- Consultas -------------------------------

  async listarExistencias(empresaId: string, filtros: ListarExistenciasDto) {
    const where: Prisma.ExistenciaWhereInput = { empresaId };
    if (filtros.bodegaId) where.bodegaId = filtros.bodegaId;
    if (filtros.productoId) where.productoId = filtros.productoId;
    if (filtros.buscar?.trim()) {
      where.producto = {
        OR: [
          { nombre: { contains: filtros.buscar, mode: 'insensitive' } },
          { sku: { contains: filtros.buscar, mode: 'insensitive' } },
        ],
      };
    }
    if (filtros.soloConStock === 'true') {
      where.cantidad = { gt: 0 };
    }
    return this.prisma.existencia.findMany({
      where,
      orderBy: [{ producto: { nombre: 'asc' } }],
      include: {
        producto: {
          select: { id: true, sku: true, nombre: true, esBotellon: true },
        },
        bodega: { select: { id: true, nombre: true, tipo: true } },
      },
    });
  }

  async listarMovimientos(empresaId: string, filtros: ListarMovimientosDto) {
    const where: Prisma.MovimientoInventarioWhereInput = { empresaId };
    if (filtros.productoId) where.productoId = filtros.productoId;
    if (filtros.bodegaId) where.bodegaId = filtros.bodegaId;
    if (filtros.documentoId) where.documentoId = filtros.documentoId;
    if (filtros.desde || filtros.hasta) {
      const creadoEn: Prisma.DateTimeFilter = {};
      if (filtros.desde) creadoEn.gte = new Date(filtros.desde);
      if (filtros.hasta) creadoEn.lte = new Date(filtros.hasta);
      where.creadoEn = creadoEn;
    }
    return this.prisma.movimientoInventario.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      take: 200,
      include: {
        producto: { select: { id: true, sku: true, nombre: true } },
        bodega: { select: { id: true, nombre: true } },
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });
  }

  async listarDocumentos(empresaId: string, estado?: EstadoDocumento) {
    return this.prisma.documentoInventario.findMany({
      where: { empresaId, ...(estado ? { estado } : {}) },
      orderBy: { creadoEn: 'desc' },
      take: 200,
      include: {
        bodega: { select: { id: true, nombre: true } },
        bodegaDestino: { select: { id: true, nombre: true } },
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
        _count: { select: { detalles: true } },
      },
    });
  }

  async obtenerDocumento(empresaId: string, id: string) {
    const documento = await this.prisma.documentoInventario.findFirst({
      where: { id, empresaId },
      include: {
        bodega: { select: { id: true, nombre: true, tipo: true } },
        bodegaDestino: { select: { id: true, nombre: true, tipo: true } },
        usuario: {
          select: { id: true, nombre: true, email: true },
        },
        detalles: {
          include: {
            producto: {
              select: { id: true, sku: true, nombre: true },
            },
          },
        },
      },
    });
    if (!documento) throw new NotFoundException('Documento no encontrado');
    return documento;
  }

  // ------------------------------- Escritura -------------------------------

  private validarDocumento(dto: CreateDocumentoDto) {
    if (!TIPOS_MANUALES.includes(dto.tipo)) {
      throw new BadRequestException(
        'Solo se pueden registrar documentos de tipo ENTRADA, SALIDA, AJUSTE o TRANSFERENCIA',
      );
    }
    if (dto.tipo === 'TRANSFERENCIA') {
      if (!dto.bodegaDestinoId) {
        throw new BadRequestException(
          'La transferencia requiere bodega destino',
        );
      }
      if (dto.bodegaDestinoId === dto.bodegaId) {
        throw new BadRequestException(
          'La bodega destino debe ser diferente a la de origen',
        );
      }
    }
    for (const detalle of dto.detalles) {
      if (dto.tipo === 'ENTRADA' || dto.tipo === 'SALIDA') {
        if (detalle.cantidad <= 0) {
          throw new BadRequestException(
            `La cantidad debe ser mayor a cero para ${dto.tipo}`,
          );
        }
      }
      if (dto.tipo === 'TRANSFERENCIA' && detalle.cantidad <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor a cero');
      }
      if (dto.tipo === 'AJUSTE' && detalle.cantidad === 0) {
        throw new BadRequestException('El ajuste no puede ser cero');
      }
    }
  }

  private async exigirBodega(empresaId: string, id: string) {
    if (!(await this.prisma.bodega.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Bodega invalida');
    }
  }

  private async generarConsecutivo(
    tx: Prisma.TransactionClient,
    empresaId: string,
    tipo: TipoMovimiento,
  ) {
    const total = await tx.documentoInventario.count({
      where: { empresaId, tipo },
    });
    const prefijo = PREFIJO_CONSECUTIVO[tipo] ?? 'DOC';
    return `${prefijo}-${String(total + 1).padStart(6, '0')}`;
  }

  private async ajustarExistencia(
    tx: Prisma.TransactionClient,
    empresaId: string,
    productoId: string,
    bodegaId: string,
    delta: Prisma.Decimal,
    nombreProducto: string,
  ) {
    const actual = await tx.existencia.findFirst({
      where: { empresaId, productoId, bodegaId },
    });
    const saldo = actual ? actual.cantidad : new Prisma.Decimal(0);
    const nuevo = saldo.plus(delta);
    if (nuevo.isNegative()) {
      throw new BadRequestException(
        `Stock insuficiente de "${nombreProducto}" para completar la operacion`,
      );
    }
    if (actual) {
      await tx.existencia.update({
        where: { id: actual.id },
        data: { cantidad: nuevo },
      });
    } else {
      await tx.existencia.create({
        data: { empresaId, productoId, bodegaId, cantidad: nuevo },
      });
    }
  }

  private async aplicarEfecto(
    tx: Prisma.TransactionClient,
    empresaId: string,
    movimiento: {
      tipo: TipoMovimiento;
      bodegaId: string;
      bodegaDestinoId: string | null;
      productoId: string;
      cantidad: Prisma.Decimal;
    },
    invertir: boolean,
    nombreProducto: string,
  ) {
    const cantidad = movimiento.cantidad;
    switch (movimiento.tipo) {
      case 'ENTRADA':
        await this.ajustarExistencia(
          tx,
          empresaId,
          movimiento.productoId,
          movimiento.bodegaId,
          invertir ? cantidad.negated() : cantidad,
          nombreProducto,
        );
        break;
      case 'SALIDA':
        await this.ajustarExistencia(
          tx,
          empresaId,
          movimiento.productoId,
          movimiento.bodegaId,
          invertir ? cantidad : cantidad.negated(),
          nombreProducto,
        );
        break;
      case 'AJUSTE':
        await this.ajustarExistencia(
          tx,
          empresaId,
          movimiento.productoId,
          movimiento.bodegaId,
          invertir ? cantidad.negated() : cantidad,
          nombreProducto,
        );
        break;
      case 'TRANSFERENCIA':
        await this.ajustarExistencia(
          tx,
          empresaId,
          movimiento.productoId,
          movimiento.bodegaId,
          invertir ? cantidad : cantidad.negated(),
          nombreProducto,
        );
        if (movimiento.bodegaDestinoId) {
          await this.ajustarExistencia(
            tx,
            empresaId,
            movimiento.productoId,
            movimiento.bodegaDestinoId,
            invertir ? cantidad.negated() : cantidad,
            nombreProducto,
          );
        }
        break;
      default:
        break;
    }
  }

  async crearDocumento(
    empresaId: string,
    dto: CreateDocumentoDto,
    actorId: string,
  ) {
    this.validarDocumento(dto);
    await this.exigirBodega(empresaId, dto.bodegaId);
    if (dto.bodegaDestinoId) {
      await this.exigirBodega(empresaId, dto.bodegaDestinoId);
    }

    const productoIds = dto.detalles.map((d) => d.productoId);
    const productos = await this.prisma.producto.findMany({
      where: { empresaId, id: { in: productoIds } },
      select: { id: true, nombre: true, costo: true },
    });
    if (productos.length !== new Set(productoIds).size) {
      throw new BadRequestException('Uno o mas productos son invalidos');
    }
    const mapaProductos = new Map(productos.map((p) => [p.id, p]));

    const documento = await this.prisma.$transaction(async (tx) => {
      const consecutivo = await this.generarConsecutivo(
        tx,
        empresaId,
        dto.tipo,
      );
      const creado = await tx.documentoInventario.create({
        data: {
          empresaId,
          tipo: dto.tipo,
          consecutivo,
          estado: 'BORRADOR',
          bodegaId: dto.bodegaId,
          bodegaDestinoId:
            dto.tipo === 'TRANSFERENCIA' ? dto.bodegaDestinoId : null,
          observaciones: dto.observaciones,
          usuarioId: actorId,
          detalles: {
            create: dto.detalles.map((detalle) => ({
              productoId: detalle.productoId,
              cantidad: detalle.cantidad,
              costoUnitario:
                detalle.costoUnitario ??
                mapaProductos.get(detalle.productoId)?.costo ??
                0,
              nombreSnapshot: mapaProductos.get(detalle.productoId)?.nombre,
            })),
          },
        },
        include: { detalles: true },
      });
      return creado;
    });

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'documento.creado',
      entidad: 'DocumentoInventario',
      entidadId: documento.id,
      datosNuevos: { tipo: documento.tipo, consecutivo: documento.consecutivo },
    });
    return documento;
  }

  async confirmarDocumento(empresaId: string, id: string, actorId: string) {
    const documento = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.documentoInventario.findFirst({
        where: { id, empresaId },
        include: {
          detalles: {
            include: { producto: { select: { nombre: true } } },
          },
        },
      });
      if (!doc) throw new NotFoundException('Documento no encontrado');
      if (doc.estado !== 'BORRADOR') {
        throw new BadRequestException(
          'Solo se confirman documentos en estado borrador',
        );
      }
      if (!doc.bodegaId) {
        throw new BadRequestException('El documento no tiene bodega de origen');
      }
      for (const detalle of doc.detalles) {
        const nombre = detalle.producto?.nombre ?? detalle.productoId;
        const cantidad = new Prisma.Decimal(detalle.cantidad);
        await this.aplicarEfecto(
          tx,
          empresaId,
          {
            tipo: doc.tipo,
            bodegaId: doc.bodegaId,
            bodegaDestinoId: doc.bodegaDestinoId,
            productoId: detalle.productoId,
            cantidad,
          },
          false,
          nombre,
        );
        await tx.movimientoInventario.create({
          data: {
            empresaId,
            productoId: detalle.productoId,
            bodegaId: doc.bodegaId,
            bodegaDestinoId:
              doc.tipo === 'TRANSFERENCIA' ? doc.bodegaDestinoId : null,
            tipo: doc.tipo,
            cantidad: detalle.cantidad,
            costoUnitario: detalle.costoUnitario,
            documentoId: doc.id,
            usuarioId: actorId,
          },
        });
      }
      return tx.documentoInventario.update({
        where: { id: doc.id },
        data: {
          estado: 'CONFIRMADO',
          confirmadoEn: new Date(),
        },
        include: { detalles: true },
      });
    });

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'documento.confirmado',
      entidad: 'DocumentoInventario',
      entidadId: documento.id,
      datosNuevos: { consecutivo: documento.consecutivo },
    });
    return documento;
  }

  async anularDocumento(empresaId: string, id: string, actorId: string) {
    const documento = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.documentoInventario.findFirst({
        where: { id, empresaId },
        include: {
          detalles: {
            include: { producto: { select: { nombre: true } } },
          },
        },
      });
      if (!doc) throw new NotFoundException('Documento no encontrado');
      if (doc.estado === 'ANULADO') {
        throw new BadRequestException('El documento ya esta anulado');
      }

      if (doc.estado === 'CONFIRMADO') {
        const nombres = new Map(
          doc.detalles.map((detalle) => [
            detalle.productoId,
            detalle.producto?.nombre ?? detalle.productoId,
          ]),
        );
        const movimientos = await tx.movimientoInventario.findMany({
          where: { documentoId: doc.id },
        });
        for (const movimiento of movimientos) {
          await this.aplicarEfecto(
            tx,
            empresaId,
            {
              tipo: movimiento.tipo,
              bodegaId: movimiento.bodegaId,
              bodegaDestinoId: movimiento.bodegaDestinoId,
              productoId: movimiento.productoId,
              cantidad: new Prisma.Decimal(movimiento.cantidad),
            },
            true,
            nombres.get(movimiento.productoId) ?? movimiento.productoId,
          );
        }
      }

      return tx.documentoInventario.update({
        where: { id: doc.id },
        data: {
          estado: 'ANULADO',
        },
        include: { detalles: true },
      });
    });

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'documento.anulado',
      entidad: 'DocumentoInventario',
      entidadId: documento.id,
      datosNuevos: { consecutivo: documento.consecutivo },
    });
    return documento;
  }
}
