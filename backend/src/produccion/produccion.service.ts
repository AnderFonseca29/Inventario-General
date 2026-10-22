import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoOrdenProduccion, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { construirPaginado } from '../common/utils/paginacion';
import {
  conReintentoConsecutivo,
  generarConsecutivo,
} from '../common/utils/consecutivos';
import {
  CompletarOrdenDto,
  CreateFormulaDto,
  CreateMateriaPrimaDto,
  CreateMermaDto,
  CreateOrdenDto,
  CreateRecepcionDto,
  ListarMateriasPrimasDto,
  ListarMermasDto,
  ListarOrdenesDto,
  ListarRecepcionesDto,
  UpdateFormulaDto,
  UpdateMateriaPrimaDto,
} from './dto/produccion.dto';

@Injectable()
export class ProduccionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  private async ejecutar<T>(fn: () => Promise<T>, mensaje: string): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(mensaje);
      }
      throw error;
    }
  }

  /**
   * Envuelve una transaccion traduciendo errores de Prisma al formato HTTP del
   * filtro global (hallazgo L): P2002 -> 409, P2003 -> 409/400, etc.
   */
  private async enTransaccion<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const httpError = new GlobalExceptionFilter().comoHttpException(error);
      throw httpError ?? error;
    }
  }

  private auditar(
    empresaId: string,
    actorId: string,
    accion: string,
    entidad: string,
    entidadId: string,
    datosNuevos: Prisma.InputJsonValue,
    ip?: string,
  ) {
    return this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion,
      entidad,
      entidadId,
      datosNuevos,
      ip,
    });
  }

  private async exigirMateriaPrima(empresaId: string, id: string) {
    if (!(await this.prisma.materiaPrima.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Materia prima inválida');
    }
  }

  private async exigirProducto(empresaId: string, id: string) {
    if (!(await this.prisma.producto.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Producto inválido');
    }
  }

  private async exigirBodega(empresaId: string, id: string) {
    if (!(await this.prisma.bodega.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Bodega inválida');
    }
  }

  // ----------------------------- Materias primas ---------------------------

  async listarMateriasPrimas(
    empresaId: string,
    filtros: ListarMateriasPrimasDto,
  ) {
    const buscar = filtros.buscar?.trim();
    const where: Prisma.MateriaPrimaWhereInput = {
      empresaId,
      ...(buscar
        ? { nombre: { contains: buscar, mode: 'insensitive' as const } }
        : {}),
    };
    const [materias, total] = await Promise.all([
      this.prisma.materiaPrima.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: filtros.skip,
        take: filtros.take,
        include: {
          unidad: { select: { id: true, nombre: true, abreviatura: true } },
          _count: { select: { recepciones: true, formulaDetalles: true } },
        },
      }),
      this.prisma.materiaPrima.count({ where }),
    ]);
    return construirPaginado(materias, total, filtros.pagina, filtros.limite);
  }

  async crearMateriaPrima(
    empresaId: string,
    dto: CreateMateriaPrimaDto,
    actorId: string,
    ip?: string,
  ) {
    if (dto.unidadId) await this.exigirUnidad(empresaId, dto.unidadId);
    const creado = await this.ejecutar(
      () =>
        this.prisma.materiaPrima.create({
          data: {
            empresaId,
            nombre: dto.nombre,
            unidadId: dto.unidadId,
            costo: dto.costo ?? 0,
            activo: dto.activo ?? true,
          },
        }),
      'Ya existe una materia prima con ese nombre',
    );
    await this.auditar(
      empresaId,
      actorId,
      'materia_prima.creada',
      'MateriaPrima',
      creado.id,
      { nombre: creado.nombre },
      ip,
    );
    return creado;
  }

  async actualizarMateriaPrima(
    empresaId: string,
    id: string,
    dto: UpdateMateriaPrimaDto,
    actorId: string,
    ip?: string,
  ) {
    await this.obtenerMateriaPrima(empresaId, id);
    if (dto.unidadId) await this.exigirUnidad(empresaId, dto.unidadId);
    const creado = await this.ejecutar(
      () => this.prisma.materiaPrima.update({ where: { id }, data: dto }),
      'Ya existe una materia prima con ese nombre',
    );
    await this.auditar(
      empresaId,
      actorId,
      'materia_prima.actualizada',
      'MateriaPrima',
      id,
      dto as Prisma.InputJsonValue,
      ip,
    );
    return creado;
  }

  async eliminarMateriaPrima(empresaId: string, id: string) {
    await this.obtenerMateriaPrima(empresaId, id);
    const referencias =
      (await this.prisma.recepcionMateriaPrima.count({
        where: { materiaPrimaId: id },
      })) +
      (await this.prisma.formulaDetalle.count({
        where: { materiaPrimaId: id },
      })) +
      (await this.prisma.ordenProduccionDetalle.count({
        where: { materiaPrimaId: id },
      })) +
      (await this.prisma.merma.count({ where: { materiaPrimaId: id } }));
    if (referencias > 0) {
      throw new ConflictException(
        'La materia prima tiene recepciones, formulas u ordenes asociadas',
      );
    }
    await this.prisma.materiaPrima.delete({ where: { id } });
    return { ok: true };
  }

  private async obtenerMateriaPrima(empresaId: string, id: string) {
    const materia = await this.prisma.materiaPrima.findFirst({
      where: { id, empresaId },
      include: {
        unidad: { select: { id: true, nombre: true, abreviatura: true } },
      },
    });
    if (!materia) throw new NotFoundException('Materia prima no encontrada');
    return materia;
  }

  private async exigirUnidad(empresaId: string, id: string) {
    if (!(await this.prisma.unidad.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Unidad inválida');
    }
  }

  // ------------------------------- Recepciones -----------------------------

  async listarRecepciones(empresaId: string, filtros: ListarRecepcionesDto) {
    const where: Prisma.RecepcionMateriaPrimaWhereInput = {
      empresaId,
      ...(filtros.materiaPrimaId
        ? { materiaPrimaId: filtros.materiaPrimaId }
        : {}),
    };
    const [recepciones, total] = await Promise.all([
      this.prisma.recepcionMateriaPrima.findMany({
        where,
        orderBy: { recibidoEn: 'desc' },
        skip: filtros.skip,
        take: filtros.take,
        include: {
          materiaPrima: { select: { id: true, nombre: true } },
          proveedor: { select: { id: true, nombre: true } },
          responsable: { select: { id: true, nombre: true, email: true } },
        },
      }),
      this.prisma.recepcionMateriaPrima.count({ where }),
    ]);
    return construirPaginado(recepciones, total, filtros.pagina, filtros.limite);
  }

  async crearRecepcion(
    empresaId: string,
    dto: CreateRecepcionDto,
    actorId: string,
    ip?: string,
  ) {
    const materia = await this.obtenerMateriaPrima(
      empresaId,
      dto.materiaPrimaId,
    );
    if (dto.proveedorId) {
      if (
        !(await this.prisma.proveedor.count({
          where: { id: dto.proveedorId, empresaId },
        }))
      ) {
        throw new BadRequestException('Proveedor inválido');
      }
    }
    if (dto.bodegaId) await this.exigirBodega(empresaId, dto.bodegaId);

    const cantidad = new Prisma.Decimal(dto.cantidad);
    const disponible = new Prisma.Decimal(materia.disponible);
    const costoActual = new Prisma.Decimal(materia.costo);

    let nuevoCosto = costoActual;
    if (dto.costoUnitario !== undefined && dto.costoUnitario !== null) {
      const costoNuevo = new Prisma.Decimal(dto.costoUnitario);
      const totalBase = disponible.plus(cantidad);
      if (totalBase.greaterThan(0)) {
        nuevoCosto = disponible
          .mul(costoActual)
          .plus(cantidad.mul(costoNuevo))
          .div(totalBase);
      } else {
        nuevoCosto = costoNuevo;
      }
    }

    const recepcion = await this.prisma.$transaction(async (tx) => {
      const creada = await tx.recepcionMateriaPrima.create({
        data: {
          empresaId,
          materiaPrimaId: dto.materiaPrimaId,
          proveedorId: dto.proveedorId,
          bodegaId: dto.bodegaId,
          lote: dto.lote,
          cantidad: dto.cantidad,
          costoUnitario: dto.costoUnitario,
          responsableId: actorId,
          observaciones: dto.observaciones,
        },
      });
      await tx.materiaPrima.update({
        where: { id: materia.id },
        data: {
          disponible: disponible.plus(cantidad),
          costo: nuevoCosto,
        },
      });
      return creada;
    });

    await this.auditar(
      empresaId,
      actorId,
      'recepcion_mp.creada',
      'RecepcionMateriaPrima',
      recepcion.id,
      { materiaPrima: materia.nombre, cantidad: dto.cantidad },
      ip,
    );
    return recepcion;
  }

  // -------------------------------- Fórmulas -------------------------------

  listarFormulas(empresaId: string) {
    return this.prisma.formula.findMany({
      where: { empresaId },
      orderBy: [{ producto: { nombre: 'asc' } }, { version: 'desc' }],
      include: {
        producto: { select: { id: true, sku: true, nombre: true } },
        detalles: {
          include: {
            materiaPrima: { select: { id: true, nombre: true } },
          },
        },
      },
    });
  }

  async obtenerFormula(empresaId: string, id: string) {
    const formula = await this.prisma.formula.findFirst({
      where: { id, empresaId },
      include: {
        producto: { select: { id: true, sku: true, nombre: true } },
        detalles: {
          include: { materiaPrima: { select: { id: true, nombre: true } } },
        },
      },
    });
    if (!formula) throw new NotFoundException('Fórmula no encontrada');
    return formula;
  }

  private async validarDetallesFormula(
    empresaId: string,
    detalles: { materiaPrimaId: string; cantidad: number }[],
  ) {
    const ids = [...new Set(detalles.map((d) => d.materiaPrimaId))];
    const encontradas = await this.prisma.materiaPrima.count({
      where: { empresaId, id: { in: ids } },
    });
    if (encontradas !== ids.length) {
      throw new BadRequestException('Una o más materias primas son inválidas');
    }
  }

  async crearFormula(
    empresaId: string,
    dto: CreateFormulaDto,
    actorId: string,
    ip?: string,
  ) {
    await this.exigirProducto(empresaId, dto.productoId);
    await this.validarDetallesFormula(empresaId, dto.detalles);

    let version = dto.version;
    if (!version) {
      const ultima = await this.prisma.formula.findFirst({
        where: { empresaId, productoId: dto.productoId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      version = (ultima?.version ?? 0) + 1;
    }

    const creada = await this.ejecutar(
      () =>
        this.prisma.formula.create({
          data: {
            empresaId,
            productoId: dto.productoId,
            nombre: dto.nombre,
            version,
            detalles: {
              create: dto.detalles.map((detalle) => ({
                materiaPrimaId: detalle.materiaPrimaId,
                cantidad: detalle.cantidad,
              })),
            },
          },
          include: { detalles: true },
        }),
      'Ya existe una fórmula con esa versión para el producto',
    );
    await this.auditar(
      empresaId,
      actorId,
      'formula.creada',
      'Formula',
      creada.id,
      { nombre: creada.nombre, version: creada.version },
      ip,
    );
    return creada;
  }

  async actualizarFormula(
    empresaId: string,
    id: string,
    dto: UpdateFormulaDto,
    actorId: string,
    ip?: string,
  ) {
    await this.obtenerFormula(empresaId, id);
    if (dto.detalles)
      await this.validarDetallesFormula(empresaId, dto.detalles);

    const actualizada = await this.prisma.$transaction(async (tx) => {
      if (dto.detalles) {
        await tx.formulaDetalle.deleteMany({ where: { formulaId: id } });
        await tx.formulaDetalle.createMany({
          data: dto.detalles.map((detalle) => ({
            formulaId: id,
            materiaPrimaId: detalle.materiaPrimaId,
            cantidad: detalle.cantidad,
          })),
        });
      }
      return tx.formula.update({
        where: { id },
        data: { nombre: dto.nombre, activo: dto.activo },
        include: { detalles: true },
      });
    });

    await this.auditar(
      empresaId,
      actorId,
      'formula.actualizada',
      'Formula',
      id,
      { nombre: actualizada.nombre },
      ip,
    );
    return actualizada;
  }

  async eliminarFormula(empresaId: string, id: string) {
    await this.obtenerFormula(empresaId, id);
    const usados = await this.prisma.ordenProduccion.count({
      where: { formulaId: id },
    });
    if (usados > 0) {
      throw new ConflictException(
        'La fórmula tiene órdenes de producción asociadas',
      );
    }
    await this.prisma.formula.delete({ where: { id } });
    return { ok: true };
  }

  // --------------------------- Órdenes de producción -----------------------

  async listarOrdenes(empresaId: string, filtros: ListarOrdenesDto) {
    const estado = this.parseEstadoOrden(filtros.estado);
    const where: Prisma.OrdenProduccionWhereInput = {
      empresaId,
      ...(estado ? { estado } : {}),
    };
    const [ordenes, total] = await Promise.all([
      this.prisma.ordenProduccion.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip: filtros.skip,
        take: filtros.take,
        include: {
          producto: { select: { id: true, sku: true, nombre: true } },
          formula: { select: { id: true, nombre: true, version: true } },
          creadoPor: { select: { id: true, nombre: true, email: true } },
          _count: { select: { detalles: true, mermas: true } },
        },
      }),
      this.prisma.ordenProduccion.count({ where }),
    ]);
    return construirPaginado(ordenes, total, filtros.pagina, filtros.limite);
  }

  async obtenerOrden(empresaId: string, id: string) {
    const orden = await this.prisma.ordenProduccion.findFirst({
      where: { id, empresaId },
      include: {
        producto: { select: { id: true, sku: true, nombre: true } },
        formula: { select: { id: true, nombre: true, version: true } },
        creadoPor: { select: { id: true, nombre: true, email: true } },
        detalles: {
          include: { materiaPrima: { select: { id: true, nombre: true } } },
        },
      },
    });
    if (!orden)
      throw new NotFoundException('Orden de producción no encontrada');
    return orden;
  }

  private parseEstadoOrden(estado?: string): EstadoOrdenProduccion | undefined {
    if (!estado) return undefined;
    const validos: EstadoOrdenProduccion[] = [
      'BORRADOR',
      'PLANIFICADA',
      'EN_PROCESO',
      'COMPLETADA',
      'CANCELADA',
    ];
    return validos.includes(estado as EstadoOrdenProduccion)
      ? (estado as EstadoOrdenProduccion)
      : undefined;
  }

  async crearOrden(
    empresaId: string,
    dto: CreateOrdenDto,
    actorId: string,
    ip?: string,
  ) {
    await this.exigirProducto(empresaId, dto.productoId);

    let detallesFormula: {
      materiaPrimaId: string;
      cantidad: Prisma.Decimal;
    }[] = [];
    if (dto.formulaId) {
      const formula = await this.prisma.formula.findFirst({
        where: { id: dto.formulaId, empresaId },
        include: { detalles: true },
      });
      if (!formula) throw new BadRequestException('Fórmula inválida');
      if (formula.productoId !== dto.productoId) {
        throw new BadRequestException(
          'La fórmula no corresponde al producto de la orden',
        );
      }
      detallesFormula = formula.detalles.map((detalle) => ({
        materiaPrimaId: detalle.materiaPrimaId,
        cantidad: new Prisma.Decimal(detalle.cantidad),
      }));
    }

    const planificada = new Prisma.Decimal(dto.cantidadPlanificada);
    const orden = await conReintentoConsecutivo(() =>
      this.prisma.$transaction(async (tx) => {
        const consecutivo = await generarConsecutivo(
          'OP',
          () => tx.ordenProduccion.count({ where: { empresaId } }),
          async (c) =>
            (await tx.ordenProduccion.findFirst({
              where: { empresaId, consecutivo: c },
              select: { id: true },
            })) !== null,
        );
        return tx.ordenProduccion.create({
          data: {
            empresaId,
            productoId: dto.productoId,
            formulaId: dto.formulaId,
            consecutivo,
            estado: 'BORRADOR',
            cantidadPlanificada: dto.cantidadPlanificada,
            observaciones: dto.observaciones,
            creadoPorId: actorId,
            detalles: {
              create: detallesFormula.map((detalle) => ({
                materiaPrimaId: detalle.materiaPrimaId,
                cantidadTeorica: detalle.cantidad.mul(planificada),
              })),
            },
          },
          include: { detalles: true },
        });
      }),
    );

    await this.auditar(
      empresaId,
      actorId,
      'orden_produccion.creada',
      'OrdenProduccion',
      orden.id,
      { consecutivo: orden.consecutivo },
      ip,
    );
    return orden;
  }

  async iniciarOrden(empresaId: string, id: string, actorId: string) {
    const orden = await this.enTransaccion(async () =>
      this.prisma.$transaction(async (tx) => {
        const actual = await tx.ordenProduccion.findFirst({
          where: { id, empresaId },
          include: { detalles: true },
        });
        if (!actual) throw new NotFoundException('Orden no encontrada');
        // Transición atómica: solo una petición concurrente inicia la orden.
        const transicion = await tx.ordenProduccion.updateMany({
          where: {
            id,
            empresaId,
            estado: { in: ['BORRADOR', 'PLANIFICADA'] },
          },
          data: { estado: 'EN_PROCESO', iniciadaEn: new Date() },
        });
        if (transicion.count === 0) {
          throw new BadRequestException(
            'Solo se inician ordenes en estado borrador o planificada',
          );
        }
        for (const detalle of actual.detalles) {
          const mp = await tx.materiaPrima.findUnique({
            where: { id: detalle.materiaPrimaId },
          });
          if (!mp) continue;
          const reserva = new Prisma.Decimal(detalle.cantidadTeorica);
          // Reserva atómica con control de disponible: si no alcanza, 0 filas.
          const reservado = await tx.materiaPrima.updateMany({
            where: {
              id: mp.id,
              empresaId,
              disponible: {
                gte: new Prisma.Decimal(mp.reservado).plus(reserva),
              },
            },
            data: { reservado: { increment: reserva } },
          });
          if (reservado.count === 0) {
            throw new BadRequestException(
              `Materia prima insuficiente para iniciar la orden (${mp.nombre})`,
            );
          }
        }
        return tx.ordenProduccion.findUniqueOrThrow({ where: { id } });
      }),
    );

    await this.auditar(
      empresaId,
      actorId,
      'orden_produccion.iniciada',
      'OrdenProduccion',
      id,
      { consecutivo: orden.consecutivo },
    );
    return orden;
  }

  private async ajustarExistenciaProducto(
    tx: Prisma.TransactionClient,
    empresaId: string,
    productoId: string,
    bodegaId: string,
    delta: Prisma.Decimal,
    nombreProducto: string,
  ) {
    const clave = { empresaId, productoId, bodegaId };
    if (delta.isZero()) return;
    if (delta.isNegative()) {
      const requerido = delta.abs();
      const afectadas = await tx.existencia.updateMany({
        where: { ...clave, cantidad: { gte: requerido } },
        data: { cantidad: { decrement: requerido } },
      });
      if (afectadas.count === 0) {
        throw new BadRequestException(
          `Stock insuficiente de "${nombreProducto}" para completar la operación`,
        );
      }
      return;
    }
    await tx.existencia.upsert({
      where: { empresaId_productoId_bodegaId: clave },
      create: { ...clave, cantidad: delta },
      update: { cantidad: { increment: delta } },
    });
  }

  async completarOrden(
    empresaId: string,
    id: string,
    dto: CompletarOrdenDto,
    actorId: string,
  ) {
    await this.exigirBodega(empresaId, dto.bodegaId);
    const producida = new Prisma.Decimal(dto.cantidadProducida);
    const consumos = new Map(
      (dto.consumos ?? []).map((consumo) => [consumo.materiaPrimaId, consumo]),
    );

    const orden = await this.enTransaccion(async () =>
      this.prisma.$transaction(async (tx) => {
        const actual = await tx.ordenProduccion.findFirst({
          where: { id, empresaId },
          include: {
            detalles: { include: { materiaPrima: true } },
            producto: { select: { nombre: true, costo: true } },
          },
        });
        if (!actual) throw new NotFoundException('Orden no encontrada');
        // Transición atómica a COMPLETADA: dos completados concurrentes no pueden
        // consumir ni producir dos veces.
        const transicion = await tx.ordenProduccion.updateMany({
          where: { id, empresaId, estado: 'EN_PROCESO' },
          data: {
            estado: 'COMPLETADA',
            cantidadProducida: producida,
            completadaEn: new Date(),
          },
        });
        if (transicion.count === 0) {
          throw new BadRequestException('Solo se completan órdenes en proceso');
        }

        for (const detalle of actual.detalles) {
          const mp = detalle.materiaPrima;
          const consumo = consumos.get(detalle.materiaPrimaId);
          const teorica = new Prisma.Decimal(detalle.cantidadTeorica);
          const consumida = new Prisma.Decimal(
            consumo?.cantidadConsumida ?? detalle.cantidadTeorica,
          );
          const merma = new Prisma.Decimal(consumo?.merma ?? 0);
          if (consumida.lessThan(0)) {
            throw new BadRequestException('El consumo no puede ser negativo');
          }
          // Descuento atómico con control de disponible.
          const liberado = Prisma.Decimal.max(
            new Prisma.Decimal(mp.reservado).minus(teorica),
            new Prisma.Decimal(0),
          );
          const descontado = await tx.materiaPrima.updateMany({
            where: { id: mp.id, empresaId, disponible: { gte: consumida } },
            data: {
              disponible: { decrement: consumida },
              reservado: liberado,
            },
          });
          if (descontado.count === 0) {
            throw new BadRequestException(
              `Materia prima insuficiente para completar la orden (${mp.nombre})`,
            );
          }
          await tx.ordenProduccionDetalle.update({
            where: { id: detalle.id },
            data: { cantidadConsumida: consumida, merma },
          });
        }

        await this.ajustarExistenciaProducto(
          tx,
          empresaId,
          actual.productoId,
          dto.bodegaId,
          producida,
          actual.producto.nombre,
        );

        await tx.movimientoInventario.create({
          data: {
            empresaId,
            productoId: actual.productoId,
            bodegaId: dto.bodegaId,
            tipo: 'PRODUCCION',
            cantidad: producida,
            costoUnitario: actual.producto.costo,
            referencia: actual.consecutivo,
            usuarioId: actorId,
          },
        });

        return tx.ordenProduccion.findUniqueOrThrow({ where: { id } });
      }),
    );

    await this.auditar(
      empresaId,
      actorId,
      'orden_produccion.completada',
      'OrdenProduccion',
      id,
      {
        consecutivo: orden.consecutivo,
        cantidadProducida: dto.cantidadProducida,
      },
    );
    return orden;
  }

  async cancelarOrden(empresaId: string, id: string, actorId: string) {
    const orden = await this.enTransaccion(async () =>
      this.prisma.$transaction(async (tx) => {
        const actual = await tx.ordenProduccion.findFirst({
          where: { id, empresaId },
          include: { detalles: true },
        });
        if (!actual) throw new NotFoundException('Orden no encontrada');
        // Transición atómica: evita doble liberacion de reservas.
        const transicion = await tx.ordenProduccion.updateMany({
          where: {
            id,
            empresaId,
            estado: { in: ['BORRADOR', 'PLANIFICADA', 'EN_PROCESO'] },
          },
          data: { estado: 'CANCELADA' },
        });
        if (transicion.count === 0) {
          throw new BadRequestException(
            'La orden ya está completada o cancelada',
          );
        }
        if (actual.estado === 'EN_PROCESO') {
          for (const detalle of actual.detalles) {
            const mp = await tx.materiaPrima.findUnique({
              where: { id: detalle.materiaPrimaId },
            });
            if (!mp) continue;
            const liberado = Prisma.Decimal.max(
              new Prisma.Decimal(mp.reservado).minus(detalle.cantidadTeorica),
              new Prisma.Decimal(0),
            );
            await tx.materiaPrima.update({
              where: { id: mp.id },
              data: { reservado: liberado },
            });
          }
        }
        return tx.ordenProduccion.findUniqueOrThrow({ where: { id } });
      }),
    );

    await this.auditar(
      empresaId,
      actorId,
      'orden_produccion.cancelada',
      'OrdenProduccion',
      id,
      { consecutivo: orden.consecutivo },
    );
    return orden;
  }

  // --------------------------------- Mermas --------------------------------

  async listarMermas(empresaId: string, filtros: ListarMermasDto) {
    const where: Prisma.MermaWhereInput = {
      empresaId,
      ...(filtros.estado ? { estado: filtros.estado } : {}),
    };
    const [mermas, total] = await Promise.all([
      this.prisma.merma.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip: filtros.skip,
        take: filtros.take,
        include: {
          orden: { select: { id: true, consecutivo: true } },
          producto: { select: { id: true, nombre: true } },
          materiaPrima: { select: { id: true, nombre: true } },
          creadoPor: { select: { id: true, nombre: true, email: true } },
          aprobadoPor: { select: { id: true, nombre: true, email: true } },
        },
      }),
      this.prisma.merma.count({ where }),
    ]);
    return construirPaginado(mermas, total, filtros.pagina, filtros.limite);
  }

  async crearMerma(
    empresaId: string,
    dto: CreateMermaDto,
    actorId: string,
    ip?: string,
  ) {
    if (!dto.materiaPrimaId && !dto.productoId) {
      throw new BadRequestException(
        'La merma debe indicar una materia prima o un producto',
      );
    }
    if (dto.materiaPrimaId) {
      await this.exigirMateriaPrima(empresaId, dto.materiaPrimaId);
    }
    if (dto.productoId) await this.exigirProducto(empresaId, dto.productoId);
    if (dto.ordenId) {
      if (
        !(await this.prisma.ordenProduccion.count({
          where: { id: dto.ordenId, empresaId },
        }))
      ) {
        throw new BadRequestException('Orden inválida');
      }
    }

    const merma = await this.prisma.merma.create({
      data: {
        empresaId,
        ordenId: dto.ordenId,
        productoId: dto.productoId,
        materiaPrimaId: dto.materiaPrimaId,
        cantidad: dto.cantidad,
        motivo: dto.motivo,
        estado: 'PENDIENTE',
        creadoPorId: actorId,
      },
    });
    await this.auditar(
      empresaId,
      actorId,
      'merma.creada',
      'Merma',
      merma.id,
      { cantidad: dto.cantidad, motivo: dto.motivo },
      ip,
    );
    return merma;
  }

  async aprobarMerma(empresaId: string, id: string, actorId: string) {
    const merma = await this.enTransaccion(async () =>
      this.prisma.$transaction(async (tx) => {
        const actual = await tx.merma.findFirst({
          where: { id, empresaId },
        });
        if (!actual) throw new NotFoundException('Merma no encontrada');
        // Transición atómica: la merma no puede aprobarse dos veces.
        const transicion = await tx.merma.updateMany({
          where: { id, empresaId, estado: 'PENDIENTE' },
          data: {
            estado: 'APROBADA',
            aprobadoPorId: actorId,
            aprobadoEn: new Date(),
          },
        });
        if (transicion.count === 0) {
          throw new BadRequestException('La merma no está pendiente');
        }
        if (actual.materiaPrimaId) {
          const mp = await tx.materiaPrima.findUnique({
            where: { id: actual.materiaPrimaId },
          });
          if (!mp) throw new BadRequestException('Materia prima inválida');
          const descontado = await tx.materiaPrima.updateMany({
            where: {
              id: mp.id,
              empresaId,
              disponible: {
                gte: new Prisma.Decimal(actual.cantidad),
              },
            },
            data: { disponible: { decrement: actual.cantidad } },
          });
          if (descontado.count === 0) {
            throw new BadRequestException(
              `Inventario insuficiente para aprobar la merma (${mp.nombre})`,
            );
          }
        }
        return tx.merma.findUniqueOrThrow({ where: { id } });
      }),
    );

    await this.auditar(empresaId, actorId, 'merma.aprobada', 'Merma', id, {
      cantidad: merma.cantidad,
    });
    return merma;
  }

  async rechazarMerma(empresaId: string, id: string, actorId: string) {
    const actual = await this.prisma.merma.findFirst({
      where: { id, empresaId },
    });
    if (!actual) throw new NotFoundException('Merma no encontrada');
    const transicion = await this.prisma.merma.updateMany({
      where: { id, empresaId, estado: 'PENDIENTE' },
      data: {
        estado: 'RECHAZADA',
        aprobadoPorId: actorId,
        aprobadoEn: new Date(),
      },
    });
    if (transicion.count === 0) {
      throw new BadRequestException('La merma no está pendiente');
    }
    const merma = await this.prisma.merma.findUniqueOrThrow({ where: { id } });
    await this.auditar(empresaId, actorId, 'merma.rechazada', 'Merma', id, {
      motivo: actual.motivo,
    });
    return merma;
  }
}
