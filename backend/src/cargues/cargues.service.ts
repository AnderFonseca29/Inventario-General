import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { PERMISOS } from '../common/constants/permisos';
import {
  conReintentoConsecutivo,
  generarConsecutivo,
} from '../common/utils/consecutivos';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { CrearCargueDto, ListarCarguesDto } from './dto/cargues.dto';

@Injectable()
export class CarguesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ------------------------------- Consultas -------------------------------

  // Con solo "ver propios" el usuario unicamente ve los cargues asignados a
  // su persona; con "ver todos" ve la lista completa de la empresa.
  private soloPropios(user: AuthenticatedUser): boolean {
    if (user.esSuperAdmin) return false;
    return (
      user.permisos.includes(PERMISOS.CARGUES_VER_PROPIOS) &&
      !user.permisos.includes(PERMISOS.CARGUES_VER_TODOS)
    );
  }

  async listar(
    empresaId: string,
    user: AuthenticatedUser,
    filtros: ListarCarguesDto,
  ) {
    const where: Prisma.CargueWhereInput = { empresaId };
    if (filtros.estado) where.estado = filtros.estado;
    const buscar = filtros.buscar?.trim();
    if (buscar) {
      where.OR = [
        { consecutivo: { contains: buscar, mode: 'insensitive' } },
        { vendedor: { nombre: { contains: buscar, mode: 'insensitive' } } },
      ];
    }
    if (this.soloPropios(user)) where.vendedorId = user.id;

    const cargues = await this.prisma.cargue.findMany({
      where,
      orderBy: { creadoEn: 'desc' },
      take: 200,
      include: {
        vendedor: { select: { id: true, nombre: true, email: true } },
        usuario: { select: { id: true, nombre: true, email: true } },
        _count: { select: { detalles: true } },
      },
    });
    return this.adjuntarBodegas(empresaId, cargues);
  }

  async obtener(empresaId: string, id: string, user: AuthenticatedUser) {
    const cargue = await this.prisma.cargue.findFirst({
      where: { id, empresaId },
      include: {
        vendedor: { select: { id: true, nombre: true, email: true } },
        usuario: { select: { id: true, nombre: true, email: true } },
        detalles: {
          include: {
            producto: { select: { id: true, sku: true, nombre: true } },
          },
        },
      },
    });
    if (!cargue) throw new NotFoundException('Cargue no encontrado');
    // La vision propia no permite abrir cargues de otros vendedores.
    if (this.soloPropios(user) && cargue.vendedorId !== user.id) {
      throw new NotFoundException('Cargue no encontrado');
    }
    const bodega = await this.prisma.bodega.findFirst({
      where: { id: cargue.bodegaOrigenId, empresaId },
      select: { id: true, nombre: true },
    });
    return { ...cargue, bodegaOrigen: bodega };
  }

  // Candidatos a recibir cargues: usuarios con permiso de terreno de vendedor.
  // Si la empresa aun no tiene roles con ese permiso, se ofrecen todos los
  // usuarios activos para no bloquear la creacion del cargue.
  async vendedores(empresaId: string) {
    const conPermiso = await this.prisma.usuario.findMany({
      where: {
        empresaId,
        activo: true,
        esSuperAdmin: false,
        roles: {
          some: {
            rol: {
              permisos: {
                some: { permiso: { codigo: PERMISOS.CARGUES_VER_PROPIOS } },
              },
            },
          },
        },
      },
      select: { id: true, nombre: true, email: true },
      orderBy: { nombre: 'asc' },
    });
    if (conPermiso.length > 0) return conPermiso;
    return this.prisma.usuario.findMany({
      where: { empresaId, activo: true, esSuperAdmin: false },
      select: { id: true, nombre: true, email: true },
      orderBy: { nombre: 'asc' },
    });
  }

  // La bodega no tiene relacion declarada en el esquema, por lo que los nombres
  // se resuelven en una consulta aparte.
  private async adjuntarBodegas<T extends { bodegaOrigenId: string }>(
    empresaId: string,
    cargues: T[],
  ) {
    const ids = [...new Set(cargues.map((c) => c.bodegaOrigenId))];
    const bodegas = await this.prisma.bodega.findMany({
      where: { id: { in: ids }, empresaId },
      select: { id: true, nombre: true },
    });
    const mapa = new Map(bodegas.map((b) => [b.id, b]));
    return cargues.map((c) => ({
      ...c,
      bodegaOrigen: mapa.get(c.bodegaOrigenId) ?? null,
    }));
  }

  // ------------------------------- Escritura -------------------------------

  private async generarConsecutivo(
    tx: Prisma.TransactionClient,
    empresaId: string,
  ) {
    const consecutivo = await generarConsecutivo(
      'CAR',
      () => tx.cargue.count({ where: { empresaId } }),
      async (c) =>
        (await tx.cargue.findFirst({
          where: { empresaId, consecutivo: c },
          select: { id: true },
        })) !== null,
    );
    return consecutivo;
  }

  async crear(empresaId: string, dto: CrearCargueDto, actorId: string) {
    for (const detalle of dto.detalles) {
      if (detalle.cantidad <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor a cero');
      }
      if (detalle.costoUnitario != null && detalle.costoUnitario < 0) {
        throw new BadRequestException('El costo no puede ser negativo');
      }
    }

    const bodega = await this.prisma.bodega.findFirst({
      where: { id: dto.bodegaOrigenId, empresaId, activo: true },
    });
    if (!bodega) throw new BadRequestException('Bodega de origen invalida');

    const vendedor = await this.prisma.usuario.findFirst({
      where: {
        id: dto.vendedorId,
        empresaId,
        activo: true,
        esSuperAdmin: false,
      },
    });
    if (!vendedor) throw new BadRequestException('Vendedor invalido');

    const productoIds = [...new Set(dto.detalles.map((d) => d.productoId))];
    const productos = await this.prisma.producto.findMany({
      where: { empresaId, id: { in: productoIds }, activo: true },
      select: { id: true, nombre: true, costo: true },
    });
    if (productos.length !== productoIds.length) {
      throw new BadRequestException('Uno o mas productos son invalidos');
    }
    const mapaProductos = new Map(productos.map((p) => [p.id, p]));

    const cargue = await conReintentoConsecutivo(() =>
      this.prisma.$transaction(async (tx) => {
        const consecutivo = await this.generarConsecutivo(tx, empresaId);

        let totalCosto = new Prisma.Decimal(0);
        const detalles = dto.detalles.map((detalle) => {
          const costoUnitario = new Prisma.Decimal(
            detalle.costoUnitario ??
              mapaProductos.get(detalle.productoId)?.costo ??
              0,
          );
          const cantidad = new Prisma.Decimal(detalle.cantidad);
          const subtotal = costoUnitario.times(cantidad);
          totalCosto = totalCosto.plus(subtotal);
          return {
            productoId: detalle.productoId,
            cantidad,
            costoUnitario,
            subtotal,
            nombreSnapshot: mapaProductos.get(detalle.productoId)?.nombre,
          };
        });

        return tx.cargue.create({
          data: {
            empresaId,
            bodegaOrigenId: dto.bodegaOrigenId,
            vendedorId: dto.vendedorId,
            usuarioId: actorId,
            consecutivo,
            observaciones: dto.observaciones,
            totalCosto,
            detalles: { create: detalles },
          },
          include: { detalles: true },
        });
      }),
    );

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'cargue.creado',
      entidad: 'Cargue',
      entidadId: cargue.id,
      datosNuevos: {
        consecutivo: cargue.consecutivo,
        vendedorId: cargue.vendedorId,
        totalCosto: cargue.totalCosto.toString(),
      },
    });
    return cargue;
  }

  async confirmar(empresaId: string, id: string, actorId: string) {
    const cargue = await this.prisma.$transaction(async (tx) => {
      const cargueActual = await tx.cargue.findFirst({
        where: { id, empresaId },
        include: {
          detalles: {
            include: { producto: { select: { nombre: true } } },
          },
        },
      });
      if (!cargueActual) throw new NotFoundException('Cargue no encontrado');
      if (cargueActual.estado !== 'BORRADOR') {
        throw new BadRequestException(
          'Solo se confirman cargues en estado borrador',
        );
      }

      // Confirmar descarga el stock de la bodega origen hacia el vendedor y
      // deja el movimiento de inventario con el consecutivo como referencia.
      for (const detalle of cargueActual.detalles) {
        const nombre = detalle.producto?.nombre ?? detalle.productoId;
        const cantidad = new Prisma.Decimal(detalle.cantidad);

        const existencia = await tx.existencia.findFirst({
          where: {
            empresaId,
            productoId: detalle.productoId,
            bodegaId: cargueActual.bodegaOrigenId,
          },
        });
        const saldo = existencia ? existencia.cantidad : new Prisma.Decimal(0);
        const nuevo = saldo.minus(cantidad);
        if (nuevo.isNegative()) {
          throw new BadRequestException(
            `Stock insuficiente de "${nombre}" en la bodega para confirmar el cargue`,
          );
        }
        if (existencia) {
          await tx.existencia.update({
            where: { id: existencia.id },
            data: { cantidad: nuevo },
          });
        } else {
          await tx.existencia.create({
            data: {
              empresaId,
              productoId: detalle.productoId,
              bodegaId: cargueActual.bodegaOrigenId,
              cantidad: nuevo,
            },
          });
        }

        await tx.movimientoInventario.create({
          data: {
            empresaId,
            productoId: detalle.productoId,
            bodegaId: cargueActual.bodegaOrigenId,
            tipo: 'CARGUE',
            cantidad: detalle.cantidad,
            costoUnitario: detalle.costoUnitario,
            referencia: cargueActual.consecutivo,
            usuarioId: actorId,
          },
        });
      }

      return tx.cargue.update({
        where: { id: cargueActual.id },
        data: { estado: 'CONFIRMADO', confirmadoEn: new Date() },
        include: { detalles: true },
      });
    });

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'cargue.confirmado',
      entidad: 'Cargue',
      entidadId: cargue.id,
      datosNuevos: { consecutivo: cargue.consecutivo },
    });
    return cargue;
  }

  async anular(empresaId: string, id: string, actorId: string) {
    const cargue = await this.prisma.$transaction(async (tx) => {
      const cargueActual = await tx.cargue.findFirst({
        where: { id, empresaId },
        include: { detalles: true },
      });
      if (!cargueActual) throw new NotFoundException('Cargue no encontrado');
      if (cargueActual.estado === 'ANULADO') {
        throw new BadRequestException('El cargue ya esta anulado');
      }

      // Un cargue ya confirmado devolvio el stock a la bodega: al anularlo se
      // reversa ese descuento (los movimientos quedan como historial).
      if (cargueActual.estado === 'CONFIRMADO') {
        for (const detalle of cargueActual.detalles) {
          const existencia = await tx.existencia.findFirst({
            where: {
              empresaId,
              productoId: detalle.productoId,
              bodegaId: cargueActual.bodegaOrigenId,
            },
          });
          if (existencia) {
            await tx.existencia.update({
              where: { id: existencia.id },
              data: { cantidad: existencia.cantidad.plus(detalle.cantidad) },
            });
          } else {
            await tx.existencia.create({
              data: {
                empresaId,
                productoId: detalle.productoId,
                bodegaId: cargueActual.bodegaOrigenId,
                cantidad: detalle.cantidad,
              },
            });
          }
        }
      }

      return tx.cargue.update({
        where: { id: cargueActual.id },
        data: { estado: 'ANULADO' },
        include: { detalles: true },
      });
    });

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'cargue.anulado',
      entidad: 'Cargue',
      entidadId: cargue.id,
      datosNuevos: { consecutivo: cargue.consecutivo },
    });
    return cargue;
  }
}
