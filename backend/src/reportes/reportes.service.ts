import { BadRequestException, Injectable } from '@nestjs/common';
import {
  EstadoMembresia,
  EstadoOrdenProduccion,
  EstadoMerma,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RangoFechasDto } from './dto/reportes.dto';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  private rango(
    desde?: string,
    hasta?: string,
  ): Prisma.DateTimeFilter | undefined {
    if (!desde && !hasta) return undefined;
    const filtro: Prisma.DateTimeFilter = {};
    if (desde) {
      const d = new Date(desde);
      if (Number.isNaN(d.getTime()))
        throw new BadRequestException('Fecha desde inválida');
      filtro.gte = d;
    }
    if (hasta) {
      const h = new Date(hasta);
      if (Number.isNaN(h.getTime()))
        throw new BadRequestException('Fecha hasta inválida');
      h.setHours(23, 59, 59, 999);
      filtro.lte = h;
    }
    return filtro;
  }

  async resumen(empresaId: string) {
    const existen = await this.prisma.existencia.findMany({
      where: { empresaId },
      include: { producto: { select: { costo: true } } },
    });
    let valorInventario = new Prisma.Decimal(0);
    let unidadesInventario = new Prisma.Decimal(0);
    for (const e of existen) {
      const cantidad = new Prisma.Decimal(e.cantidad);
      unidadesInventario = unidadesInventario.plus(cantidad);
      valorInventario = valorInventario.plus(
        cantidad.mul(new Prisma.Decimal(e.producto.costo)),
      );
    }

    const [
      productosActivos,
      clientesActivos,
      membresiasActivas,
      planesActivos,
      ordenesEnProceso,
      mermasPendientes,
      documentosBorrador,
      carguesBorrador,
      movimientosBotellonPendientes,
    ] = await this.prisma.$transaction([
      this.prisma.producto.count({ where: { empresaId, activo: true } }),
      this.prisma.cliente.count({ where: { empresaId, activo: true } }),
      this.prisma.membresiaCliente.count({
        where: {
          empresaId,
          estado: EstadoMembresia.ACTIVA,
          fechaFin: { gte: new Date() },
        },
      }),
      this.prisma.planMembresia.count({ where: { empresaId, activo: true } }),
      this.prisma.ordenProduccion.count({
        where: { empresaId, estado: EstadoOrdenProduccion.EN_PROCESO },
      }),
      this.prisma.merma.count({
        where: { empresaId, estado: EstadoMerma.PENDIENTE },
      }),
      this.prisma.documentoInventario.count({
        where: { empresaId, estado: 'BORRADOR' },
      }),
      this.prisma.cargue.count({ where: { empresaId, estado: 'BORRADOR' } }),
      this.prisma.conciliacionBotellon.count({
        where: { empresaId, estado: { in: ['PENDIENTE', 'CON_DIFERENCIA'] } },
      }),
    ]);

    return {
      productosActivos,
      clientesActivos,
      membresiasActivas,
      planesActivos,
      ordenesEnProceso,
      mermasPendientes,
      documentosBorrador,
      carguesBorrador,
      movimientosBotellonPendientes,
      valorInventario: valorInventario.toNumber(),
      unidadesInventario: unidadesInventario.toNumber(),
    };
  }

  async inventario(empresaId: string) {
    const existencias = await this.prisma.existencia.findMany({
      where: { empresaId },
      include: {
        producto: {
          select: {
            id: true,
            sku: true,
            nombre: true,
            costo: true,
            precioVenta: true,
          },
        },
        bodega: { select: { id: true, nombre: true } },
      },
    });

    const porProducto = new Map<
      string,
      {
        productoId: string;
        sku: string;
        nombre: string;
        cantidad: Prisma.Decimal;
        valor: Prisma.Decimal;
      }
    >();
    const porBodega = new Map<
      string,
      {
        bodegaId: string;
        nombre: string;
        cantidad: Prisma.Decimal;
        valor: Prisma.Decimal;
      }
    >();

    for (const e of existencias) {
      const cantidad = new Prisma.Decimal(e.cantidad);
      const valor = cantidad.mul(new Prisma.Decimal(e.producto.costo));

      const p = porProducto.get(e.productoId) ?? {
        productoId: e.productoId,
        sku: e.producto.sku,
        nombre: e.producto.nombre,
        cantidad: new Prisma.Decimal(0),
        valor: new Prisma.Decimal(0),
      };
      p.cantidad = p.cantidad.plus(cantidad);
      p.valor = p.valor.plus(valor);
      porProducto.set(e.productoId, p);

      const b = porBodega.get(e.bodegaId) ?? {
        bodegaId: e.bodegaId,
        nombre: e.bodega.nombre,
        cantidad: new Prisma.Decimal(0),
        valor: new Prisma.Decimal(0),
      };
      b.cantidad = b.cantidad.plus(cantidad);
      b.valor = b.valor.plus(valor);
      porBodega.set(e.bodegaId, b);
    }

    const serializar = <
      T extends { cantidad: Prisma.Decimal; valor: Prisma.Decimal },
    >(
      filas: T[],
    ) =>
      filas
        .map((f) => ({
          ...f,
          cantidad: f.cantidad.toNumber(),
          valor: f.valor.toNumber(),
        }))
        .sort((a, b) => b.valor - a.valor);

    return {
      porProducto: serializar([...porProducto.values()]),
      porBodega: serializar([...porBodega.values()]),
      totalValor: serializar([...porProducto.values()]).reduce(
        (acc, f) => acc + f.valor,
        0,
      ),
    };
  }

  async movimientos(empresaId: string, dto: RangoFechasDto) {
    const creadoEn = this.rango(dto.desde, dto.hasta);
    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: { empresaId, ...(creadoEn ? { creadoEn } : {}) },
      select: { tipo: true, cantidad: true },
    });
    const mapa = new Map<
      string,
      { movimientos: number; cantidad: Prisma.Decimal }
    >();
    for (const m of movimientos) {
      const actual = mapa.get(m.tipo) ?? {
        movimientos: 0,
        cantidad: new Prisma.Decimal(0),
      };
      actual.movimientos += 1;
      actual.cantidad = actual.cantidad.plus(new Prisma.Decimal(m.cantidad));
      mapa.set(m.tipo, actual);
    }
    return [...mapa.entries()]
      .map(([tipo, v]) => ({
        tipo,
        movimientos: v.movimientos,
        cantidad: v.cantidad.toNumber(),
      }))
      .sort((a, b) => a.tipo.localeCompare(b.tipo));
  }

  async produccion(empresaId: string, dto: RangoFechasDto) {
    const creadoEn = this.rango(dto.desde, dto.hasta);
    const donde = { empresaId, ...(creadoEn ? { creadoEn } : {}) };

    const [ordenes, mermas] = await this.prisma.$transaction([
      this.prisma.ordenProduccion.findMany({
        where: donde,
        select: {
          estado: true,
          cantidadPlanificada: true,
          cantidadProducida: true,
        },
      }),
      this.prisma.merma.findMany({
        where: donde,
        select: { estado: true, cantidad: true },
      }),
    ]);

    const ordenesPorEstado = new Map<
      string,
      {
        ordenes: number;
        cantidadPlanificada: Prisma.Decimal;
        cantidadProducida: Prisma.Decimal;
      }
    >();
    for (const o of ordenes) {
      const actual = ordenesPorEstado.get(o.estado) ?? {
        ordenes: 0,
        cantidadPlanificada: new Prisma.Decimal(0),
        cantidadProducida: new Prisma.Decimal(0),
      };
      actual.ordenes += 1;
      actual.cantidadPlanificada = actual.cantidadPlanificada.plus(
        new Prisma.Decimal(o.cantidadPlanificada),
      );
      actual.cantidadProducida = actual.cantidadProducida.plus(
        new Prisma.Decimal(o.cantidadProducida),
      );
      ordenesPorEstado.set(o.estado, actual);
    }

    const mermasPorEstado = new Map<
      string,
      { mermas: number; cantidad: Prisma.Decimal }
    >();
    for (const m of mermas) {
      const actual = mermasPorEstado.get(m.estado) ?? {
        mermas: 0,
        cantidad: new Prisma.Decimal(0),
      };
      actual.mermas += 1;
      actual.cantidad = actual.cantidad.plus(new Prisma.Decimal(m.cantidad));
      mermasPorEstado.set(m.estado, actual);
    }

    return {
      ordenes: [...ordenesPorEstado.entries()].map(([estado, v]) => ({
        estado,
        ordenes: v.ordenes,
        cantidadPlanificada: v.cantidadPlanificada.toNumber(),
        cantidadProducida: v.cantidadProducida.toNumber(),
      })),
      mermas: [...mermasPorEstado.entries()].map(([estado, v]) => ({
        estado,
        mermas: v.mermas,
        cantidad: v.cantidad.toNumber(),
      })),
    };
  }

  async membresias(empresaId: string) {
    const [membresias, planes] = await this.prisma.$transaction([
      this.prisma.membresiaCliente.findMany({
        where: { empresaId },
        select: { estado: true, planId: true },
      }),
      this.prisma.planMembresia.findMany({
        where: { empresaId },
        select: { id: true, nombre: true, precio: true, duracionDias: true },
      }),
    ]);

    const porEstadoMap = new Map<string, number>();
    const porPlanMap = new Map<string, number>();
    for (const m of membresias) {
      porEstadoMap.set(m.estado, (porEstadoMap.get(m.estado) ?? 0) + 1);
      if (m.estado === EstadoMembresia.ACTIVA) {
        porPlanMap.set(m.planId, (porPlanMap.get(m.planId) ?? 0) + 1);
      }
    }

    const nombres = new Map(planes.map((p) => [p.id, p]));
    const porPlan = [...porPlanMap.entries()].map(([planId, activas]) => ({
      planId,
      nombre: nombres.get(planId)?.nombre ?? 'Plan eliminado',
      precio: nombres.get(planId) ? Number(nombres.get(planId)!.precio) : 0,
      activas,
    }));

    return {
      porEstado: [...porEstadoMap.entries()].map(([estado, membresias]) => ({
        estado,
        membresias,
      })),
      porPlan,
      totalActivas: porPlan.reduce((acc, p) => acc + p.activas, 0),
    };
  }
}
