import { Injectable } from '@nestjs/common';
import { EstadoMembresia, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

// UUID valido que no corresponde a ninguna fila: se usa para que la consulta de
// membresias no devuelva nada cuando quien pregunta no es el dueno.
const SIN_DUENO = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class ResumenService {
  constructor(private readonly prisma: PrismaService) {}

  // Resumen personal del usuario autenticado (pensado para el rol Vendedor):
  // solo expone la información propia del usuario, nunca la de toda la empresa.
  async miResumen(user: AuthenticatedUser) {
    const usuarioId = user.id;
    const empresaId = user.empresaId;
    if (!empresaId) {
      return this.vacio();
    }

    const [cargues, botellones, membresias, conciliacionesPendientes] =
      await this.prisma.$transaction([
        this.prisma.cargue.findMany({
          where: { empresaId, vendedorId: usuarioId },
          select: {
            id: true,
            consecutivo: true,
            estado: true,
            totalCosto: true,
            creadoEn: true,
            confirmadoEn: true,
            _count: { select: { detalles: true } },
          },
          orderBy: { creadoEn: 'desc' },
        }),
        this.prisma.movimientoBotellon.findMany({
          where: { empresaId, vendedorId: usuarioId },
          select: {
            id: true,
            tipo: true,
            cantidad: true,
            creadoEn: true,
            producto: { select: { nombre: true } },
          },
          orderBy: { creadoEn: 'desc' },
        }),
        this.prisma.membresiaCliente.findMany({
          where: {
            empresaId,
            creadoPorId: usuarioId,
            // Las membresias son del dueno: los demas usuarios no las reciben.
            ...(user.esPropietario ? {} : { id: SIN_DUENO }),
          },
          select: {
            id: true,
            estado: true,
            fechaFin: true,
            createdAt: true,
            plan: { select: { nombre: true } },
            cliente: { select: { nombre: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.conciliacionBotellon.count({
          where: {
            empresaId,
            vendedorId: usuarioId,
            estado: { in: ['PENDIENTE', 'CON_DIFERENCIA'] },
          },
        }),
      ]);

    const carguesPorEstado = new Map<string, number>();
    for (const c of cargues) {
      carguesPorEstado.set(c.estado, (carguesPorEstado.get(c.estado) ?? 0) + 1);
    }

    const botellonesPorTipo = new Map<
      string,
      { movimientos: number; cantidad: Prisma.Decimal }
    >();
    for (const b of botellones) {
      const actual = botellonesPorTipo.get(b.tipo) ?? {
        movimientos: 0,
        cantidad: new Prisma.Decimal(0),
      };
      actual.movimientos += 1;
      actual.cantidad = actual.cantidad.plus(new Prisma.Decimal(b.cantidad));
      botellonesPorTipo.set(b.tipo, actual);
    }

    const membresiasPorEstado = new Map<string, number>();
    let membresiasActivas = 0;
    const ahora = new Date();
    for (const m of membresias) {
      membresiasPorEstado.set(
        m.estado,
        (membresiasPorEstado.get(m.estado) ?? 0) + 1,
      );
      if (m.estado === EstadoMembresia.ACTIVA && m.fechaFin >= ahora) {
        membresiasActivas += 1;
      }
    }

    return {
      cargues: {
        total: cargues.length,
        porEstado: [...carguesPorEstado.entries()]
          .map(([estado, cantidad]) => ({ estado, cantidad }))
          .sort((a, b) => a.estado.localeCompare(b.estado)),
        recientes: cargues.slice(0, 8).map((c) => ({
          id: c.id,
          consecutivo: c.consecutivo,
          estado: c.estado,
          totalCosto: new Prisma.Decimal(c.totalCosto).toNumber(),
          items: c._count.detalles,
          creadoEn: c.creadoEn,
          confirmadoEn: c.confirmadoEn,
        })),
      },
      botellones: {
        total: botellones.length,
        porTipo: [...botellonesPorTipo.entries()]
          .map(([tipo, v]) => ({
            tipo,
            movimientos: v.movimientos,
            cantidad: v.cantidad.toNumber(),
          }))
          .sort((a, b) => a.tipo.localeCompare(b.tipo)),
        recientes: botellones.slice(0, 8).map((b) => ({
          id: b.id,
          tipo: b.tipo,
          cantidad: new Prisma.Decimal(b.cantidad).toNumber(),
          producto: b.producto.nombre,
          creadoEn: b.creadoEn,
        })),
      },
      membresias: {
        total: membresias.length,
        activas: membresiasActivas,
        porEstado: [...membresiasPorEstado.entries()]
          .map(([estado, cantidad]) => ({ estado, cantidad }))
          .sort((a, b) => a.estado.localeCompare(b.estado)),
        recientes: membresias.slice(0, 8).map((m) => ({
          id: m.id,
          cliente: m.cliente.nombre,
          plan: m.plan.nombre,
          estado: m.estado,
          fechaFin: m.fechaFin,
          creadoEn: m.createdAt,
        })),
      },
      conciliacionesPendientes,
    };
  }

  private vacio() {
    return {
      cargues: { total: 0, porEstado: [], recientes: [] },
      botellones: { total: 0, porTipo: [], recientes: [] },
      membresias: { total: 0, activas: 0, porEstado: [], recientes: [] },
      conciliacionesPendientes: 0,
    };
  }
}
