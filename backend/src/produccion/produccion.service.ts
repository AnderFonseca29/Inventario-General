import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoOrdenProduccion, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
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
      throw new BadRequestException('Materia prima invalida');
    }
  }

  private async exigirProducto(empresaId: string, id: string) {
    if (!(await this.prisma.producto.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Producto invalido');
    }
  }

  private async exigirBodega(empresaId: string, id: string) {
    if (!(await this.prisma.bodega.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Bodega invalida');
    }
  }

  // ----------------------------- Materias primas ---------------------------

  listarMateriasPrimas(empresaId: string, filtros: ListarMateriasPrimasDto) {
    const buscar = filtros.buscar?.trim();
    return this.prisma.materiaPrima.findMany({
      where: {
        empresaId,
        ...(buscar
          ? { nombre: { contains: buscar, mode: 'insensitive' as const } }
          : {}),
      },
      orderBy: { nombre: 'asc' },
      include: {
        unidad: { select: { id: true, nombre: true, abreviatura: true } },
        _count: { select: { recepciones: true, formulaDetalles: true } },
      },
    });
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
      throw new BadRequestException('Unidad invalida');
    }
  }

  // ------------------------------- Recepciones -----------------------------

  listarRecepciones(empresaId: string, filtros: ListarRecepcionesDto) {
    return this.prisma.recepcionMateriaPrima.findMany({
      where: {
        empresaId,
        ...(filtros.materiaPrimaId
          ? { materiaPrimaId: filtros.materiaPrimaId }
          : {}),
      },
      orderBy: { recibidoEn: 'desc' },
      take: 200,
      include: {
        materiaPrima: { select: { id: true, nombre: true } },
        proveedor: { select: { id: true, nombre: true } },
        responsable: { select: { id: true, nombre: true, email: true } },
      },
    });
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
        throw new BadRequestException('Proveedor invalido');
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

  // -------------------------------- Formulas -------------------------------

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
    if (!formula) throw new NotFoundException('Formula no encontrada');
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
      throw new BadRequestException('Una o mas materias primas son invalidas');
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
      'Ya existe una formula con esa version para el producto',
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
        'La formula tiene ordenes de produccion asociadas',
      );
    }
    await this.prisma.formula.delete({ where: { id } });
    return { ok: true };
  }

  // --------------------------- Ordenes de produccion -----------------------

  listarOrdenes(empresaId: string, filtros: ListarOrdenesDto) {
    const estado = this.parseEstadoOrden(filtros.estado);
    return this.prisma.ordenProduccion.findMany({
      where: { empresaId, ...(estado ? { estado } : {}) },
      orderBy: { creadoEn: 'desc' },
      take: 200,
      include: {
        producto: { select: { id: true, sku: true, nombre: true } },
        formula: { select: { id: true, nombre: true, version: true } },
        creadoPor: { select: { id: true, nombre: true, email: true } },
        _count: { select: { detalles: true, mermas: true } },
      },
    });
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
      throw new NotFoundException('Orden de produccion no encontrada');
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
      if (!formula) throw new BadRequestException('Formula invalida');
      if (formula.productoId !== dto.productoId) {
        throw new BadRequestException(
          'La formula no corresponde al producto de la orden',
        );
      }
      detallesFormula = formula.detalles.map((detalle) => ({
        materiaPrimaId: detalle.materiaPrimaId,
        cantidad: new Prisma.Decimal(detalle.cantidad),
      }));
    }

    const planificada = new Prisma.Decimal(dto.cantidadPlanificada);
    const orden = await this.prisma.$transaction(async (tx) => {
      const total = await tx.ordenProduccion.count({ where: { empresaId } });
      const consecutivo = `OP-${String(total + 1).padStart(6, '0')}`;
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
    });

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
    const orden = await this.prisma.$transaction(async (tx) => {
      const actual = await tx.ordenProduccion.findFirst({
        where: { id, empresaId },
        include: { detalles: true },
      });
      if (!actual) throw new NotFoundException('Orden no encontrada');
      // Transicion atomica: solo una peticion concurrente inicia la orden.
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
        // Reserva atomica con control de disponible: si no alcanza, 0 filas.
        const reservado = await tx.materiaPrima.updateMany({
          where: {
            id: mp.id,
            empresaId,
            disponible: { gte: new Prisma.Decimal(mp.reservado).plus(reserva) },
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
    });

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
          `Stock insuficiente de "${nombreProducto}" para completar la operacion`,
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

    const orden = await this.prisma.$transaction(async (tx) => {
      const actual = await tx.ordenProduccion.findFirst({
        where: { id, empresaId },
        include: {
          detalles: { include: { materiaPrima: true } },
          producto: { select: { nombre: true, costo: true } },
        },
      });
      if (!actual) throw new NotFoundException('Orden no encontrada');
      // Transicion atomica a COMPLETADA: dos completados concurrentes no pueden
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
        throw new BadRequestException('Solo se completan ordenes en proceso');
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
        // Descuento atomico con control de disponible.
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
    });

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
    const orden = await this.prisma.$transaction(async (tx) => {
      const actual = await tx.ordenProduccion.findFirst({
        where: { id, empresaId },
        include: { detalles: true },
      });
      if (!actual) throw new NotFoundException('Orden no encontrada');
      // Transicion atomica: evita doble liberacion de reservas.
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
          'La orden ya esta completada o cancelada',
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
    });

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

  listarMermas(empresaId: string, filtros: ListarMermasDto) {
    return this.prisma.merma.findMany({
      where: {
        empresaId,
        ...(filtros.estado ? { estado: filtros.estado } : {}),
      },
      orderBy: { creadoEn: 'desc' },
      take: 200,
      include: {
        orden: { select: { id: true, consecutivo: true } },
        producto: { select: { id: true, nombre: true } },
        materiaPrima: { select: { id: true, nombre: true } },
        creadoPor: { select: { id: true, nombre: true, email: true } },
        aprobadoPor: { select: { id: true, nombre: true, email: true } },
      },
    });
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
        throw new BadRequestException('Orden invalida');
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
    const merma = await this.prisma.$transaction(async (tx) => {
      const actual = await tx.merma.findFirst({
        where: { id, empresaId },
      });
      if (!actual) throw new NotFoundException('Merma no encontrada');
      // Transicion atomica: la merma no puede aprobarse dos veces.
      const transicion = await tx.merma.updateMany({
        where: { id, empresaId, estado: 'PENDIENTE' },
        data: {
          estado: 'APROBADA',
          aprobadoPorId: actorId,
          aprobadoEn: new Date(),
        },
      });
      if (transicion.count === 0) {
        throw new BadRequestException('La merma no esta pendiente');
      }
      if (actual.materiaPrimaId) {
        const mp = await tx.materiaPrima.findUnique({
          where: { id: actual.materiaPrimaId },
        });
        if (!mp) throw new BadRequestException('Materia prima invalida');
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
    });

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
      throw new BadRequestException('La merma no esta pendiente');
    }
    const merma = await this.prisma.merma.findUniqueOrThrow({ where: { id } });
    await this.auditar(empresaId, actorId, 'merma.rechazada', 'Merma', id, {
      motivo: actual.motivo,
    });
    return merma;
  }
}
