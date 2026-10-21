import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoMembresia, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { construirPaginado } from '../common/utils/paginacion';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  CreateClienteDto,
  CreateMembresiaDto,
  CreatePlanMembresiaDto,
  ListarClientesDto,
  ListarMembresiasDto,
  ListarPlanesMembresiaDto,
  RenovarMembresiaDto,
  UpdateClienteDto,
  UpdatePlanMembresiaDto,
} from './dto/membresia.dto';

@Injectable()
export class MembresiaService {
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

  private estadoEfectivo(
    estado: EstadoMembresia,
    fechaFin: Date,
  ): EstadoMembresia {
    if (estado === EstadoMembresia.ACTIVA && fechaFin.getTime() < Date.now()) {
      return EstadoMembresia.VENCIDA;
    }
    return estado;
  }

  private fechaFinDesde(fechaInicio: Date, duracionDias: number): Date {
    return new Date(fechaInicio.getTime() + duracionDias * 24 * 60 * 60 * 1000);
  }

  // -------------------------------- Clientes -------------------------------

  async listarClientes(empresaId: string, filtros: ListarClientesDto) {
    const buscar = filtros.buscar?.trim();
    const where: Prisma.ClienteWhereInput = {
      empresaId,
      ...(buscar
        ? {
            OR: [
              { nombre: { contains: buscar, mode: 'insensitive' as const } },
              {
                documento: { contains: buscar, mode: 'insensitive' as const },
              },
              { email: { contains: buscar, mode: 'insensitive' as const } },
              {
                telefono: { contains: buscar, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };
    const [clientes, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: filtros.skip,
        take: filtros.take,
        include: { _count: { select: { membresias: true } } },
      }),
      this.prisma.cliente.count({ where }),
    ]);
    return construirPaginado(clientes, total, filtros.pagina, filtros.limite);
  }

  async crearCliente(
    empresaId: string,
    dto: CreateClienteDto,
    actorId: string,
    ip?: string,
  ) {
    const creado = await this.ejecutar(
      () =>
        this.prisma.cliente.create({
          data: {
            empresaId,
            nombre: dto.nombre,
            documento: dto.documento,
            email: dto.email,
            telefono: dto.telefono,
            direccion: dto.direccion,
            activo: dto.activo ?? true,
          },
        }),
      'Ya existe un cliente con ese documento',
    );
    await this.auditar(
      empresaId,
      actorId,
      'cliente.creado',
      'Cliente',
      creado.id,
      { nombre: creado.nombre, documento: creado.documento },
      ip,
    );
    return creado;
  }

  async actualizarCliente(
    empresaId: string,
    id: string,
    dto: UpdateClienteDto,
    actorId: string,
    ip?: string,
  ) {
    await this.obtenerCliente(empresaId, id);
    const actualizado = await this.ejecutar(
      () => this.prisma.cliente.update({ where: { id }, data: dto }),
      'Ya existe un cliente con ese documento',
    );
    await this.auditar(
      empresaId,
      actorId,
      'cliente.actualizado',
      'Cliente',
      id,
      dto as Prisma.InputJsonValue,
      ip,
    );
    return actualizado;
  }

  async eliminarCliente(empresaId: string, id: string) {
    await this.obtenerCliente(empresaId, id);
    const referencias = await this.prisma.membresiaCliente.count({
      where: { clienteId: id },
    });
    if (referencias > 0) {
      throw new ConflictException(
        'El cliente tiene membresias asociadas; desactivalo en su lugar',
      );
    }
    await this.prisma.cliente.delete({ where: { id } });
    return { ok: true };
  }

  private async obtenerCliente(empresaId: string, id: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, empresaId },
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  private async exigirCliente(empresaId: string, id: string) {
    if (!(await this.prisma.cliente.count({ where: { id, empresaId } }))) {
      throw new BadRequestException('Cliente invalido');
    }
  }

  // ----------------------------- Planes de membresia -----------------------

  async listarPlanesMembresia(
    empresaId: string,
    filtros: ListarPlanesMembresiaDto,
  ) {
    const buscar = filtros.buscar?.trim();
    const where: Prisma.PlanMembresiaWhereInput = {
      empresaId,
      ...(buscar
        ? { nombre: { contains: buscar, mode: 'insensitive' as const } }
        : {}),
    };
    const [planes, total] = await Promise.all([
      this.prisma.planMembresia.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: filtros.skip,
        take: filtros.take,
        include: { _count: { select: { membresias: true } } },
      }),
      this.prisma.planMembresia.count({ where }),
    ]);
    return construirPaginado(planes, total, filtros.pagina, filtros.limite);
  }

  async crearPlanMembresia(
    empresaId: string,
    dto: CreatePlanMembresiaDto,
    actorId: string,
    ip?: string,
  ) {
    const creado = await this.ejecutar(
      () =>
        this.prisma.planMembresia.create({
          data: {
            empresaId,
            nombre: dto.nombre,
            descripcion: dto.descripcion,
            precio: dto.precio ?? 0,
            duracionDias: dto.duracionDias,
            activo: dto.activo ?? true,
          },
        }),
      'Ya existe un plan de membresia con ese nombre',
    );
    await this.auditar(
      empresaId,
      actorId,
      'plan_membresia.creado',
      'PlanMembresia',
      creado.id,
      { nombre: creado.nombre, duracionDias: creado.duracionDias },
      ip,
    );
    return creado;
  }

  async actualizarPlanMembresia(
    empresaId: string,
    id: string,
    dto: UpdatePlanMembresiaDto,
    actorId: string,
    ip?: string,
  ) {
    await this.obtenerPlanMembresia(empresaId, id);
    const actualizado = await this.ejecutar(
      () => this.prisma.planMembresia.update({ where: { id }, data: dto }),
      'Ya existe un plan de membresia con ese nombre',
    );
    await this.auditar(
      empresaId,
      actorId,
      'plan_membresia.actualizado',
      'PlanMembresia',
      id,
      dto as Prisma.InputJsonValue,
      ip,
    );
    return actualizado;
  }

  async eliminarPlanMembresia(empresaId: string, id: string) {
    await this.obtenerPlanMembresia(empresaId, id);
    const referencias = await this.prisma.membresiaCliente.count({
      where: { planId: id },
    });
    if (referencias > 0) {
      throw new ConflictException(
        'El plan tiene membresias asociadas; desactivalo en su lugar',
      );
    }
    await this.prisma.planMembresia.delete({ where: { id } });
    return { ok: true };
  }

  private async obtenerPlanMembresia(empresaId: string, id: string) {
    const plan = await this.prisma.planMembresia.findFirst({
      where: { id, empresaId },
    });
    if (!plan) throw new NotFoundException('Plan de membresia no encontrado');
    return plan;
  }

  private async exigirPlanMembresia(empresaId: string, id: string) {
    const plan = await this.prisma.planMembresia.findFirst({
      where: { id, empresaId },
    });
    if (!plan) throw new BadRequestException('Plan de membresia invalido');
    return plan;
  }

  // ------------------------------ Afiliaciones -----------------------------

  async listarMembresias(empresaId: string, filtros: ListarMembresiasDto) {
    const where: Prisma.MembresiaClienteWhereInput = {
      empresaId,
      ...(filtros.clienteId ? { clienteId: filtros.clienteId } : {}),
    };

    // El estado efectivo se calcula en memoria (depende de fechaFin), por lo
    // que cuando se filtra por estado la paginacion se aplica despues del
    // filtro para no devolver paginas incompletas (hallazgo Q).
    if (filtros.estado) {
      const todas = await this.prisma.membresiaCliente.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 2000,
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              documento: true,
              telefono: true,
            },
          },
          plan: {
            select: { id: true, nombre: true, precio: true, duracionDias: true },
          },
        },
      });
      const filtradas = todas
        .map((m) => ({ ...m, estado: this.estadoEfectivo(m.estado, m.fechaFin) }))
        .filter((m) => m.estado === filtros.estado);
      const inicio = filtros.skip;
      const items = filtradas.slice(inicio, inicio + filtros.take);
      return construirPaginado(items, filtradas.length, filtros.pagina, filtros.limite);
    }

    const [membresias, total] = await Promise.all([
      this.prisma.membresiaCliente.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filtros.skip,
        take: filtros.take,
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              documento: true,
              telefono: true,
            },
          },
          plan: {
            select: { id: true, nombre: true, precio: true, duracionDias: true },
          },
        },
      }),
      this.prisma.membresiaCliente.count({ where }),
    ]);

    return construirPaginado(
      membresias.map((m) => ({
        ...m,
        estado: this.estadoEfectivo(m.estado, m.fechaFin),
      })),
      total,
      filtros.pagina,
      filtros.limite,
    );
  }

  async crearMembresia(
    empresaId: string,
    dto: CreateMembresiaDto,
    actorId: string,
    ip?: string,
  ) {
    await this.exigirCliente(empresaId, dto.clienteId);
    const plan = await this.exigirPlanMembresia(empresaId, dto.planId);
    const fechaInicio = dto.fechaInicio
      ? new Date(dto.fechaInicio)
      : new Date();
    const fechaFin = this.fechaFinDesde(fechaInicio, plan.duracionDias);

    const creada = await this.prisma.membresiaCliente.create({
      data: {
        empresaId,
        clienteId: dto.clienteId,
        planId: dto.planId,
        estado: EstadoMembresia.ACTIVA,
        fechaInicio,
        fechaFin,
        creadoPorId: actorId,
      },
      include: {
        cliente: { select: { id: true, nombre: true } },
        plan: { select: { id: true, nombre: true } },
      },
    });
    await this.auditar(
      empresaId,
      actorId,
      'membresia.creada',
      'MembresiaCliente',
      creada.id,
      {
        clienteId: dto.clienteId,
        planId: dto.planId,
        fechaFin: fechaFin.toISOString(),
      },
      ip,
    );
    return creada;
  }

  async renovarMembresia(
    empresaId: string,
    id: string,
    dto: RenovarMembresiaDto,
    actorId: string,
    ip?: string,
  ) {
    const anterior = await this.obtenerMembresia(empresaId, id);
    const planId = dto.planId ?? anterior.planId;
    const plan = await this.exigirPlanMembresia(empresaId, planId);
    const fechaInicio = dto.fechaInicio
      ? new Date(dto.fechaInicio)
      : new Date();
    const fechaFin = this.fechaFinDesde(fechaInicio, plan.duracionDias);

    // Transicion atomica (hallazgo A/H): solo una renovacion concurrente puede
    // pasar la membresia de ACTIVA a VENCIDA. updateMany con guardia de estado
    // evita que dos peticiones simultaneas creen dos membresias activas.
    const creada = await this.prisma.$transaction(async (tx) => {
      const afectadas = await tx.membresiaCliente.updateMany({
        where: { id: anterior.id, empresaId, estado: EstadoMembresia.ACTIVA },
        data: { estado: EstadoMembresia.VENCIDA },
      });
      if (afectadas.count === 0) {
        throw new ConflictException(
          'La membresia ya fue renovada o no esta activa',
        );
      }
      return tx.membresiaCliente.create({
        data: {
          empresaId,
          clienteId: anterior.clienteId,
          planId,
          estado: EstadoMembresia.ACTIVA,
          fechaInicio,
          fechaFin,
          creadoPorId: actorId,
        },
        include: {
          cliente: { select: { id: true, nombre: true } },
          plan: { select: { id: true, nombre: true } },
        },
      });
    });
    await this.auditar(
      empresaId,
      actorId,
      'membresia.renovada',
      'MembresiaCliente',
      creada.id,
      { anteriorId: anterior.id, planId, fechaFin: fechaFin.toISOString() },
      ip,
    );
    return creada;
  }

  async cancelarMembresia(
    empresaId: string,
    id: string,
    actorId: string,
    ip?: string,
  ) {
    const membresia = await this.obtenerMembresia(empresaId, id);
    // Transicion atomica (hallazgo A/H): solo una cancelacion concurrente pasa
    // de no-cancelada a CANCELADA; la segunda recibe 409 en lugar de "cancelar"
    // dos veces (o cancelar una membresia recien renovada).
    const afectadas = await this.prisma.membresiaCliente.updateMany({
      where: {
        id: membresia.id,
        empresaId,
        estado: { not: EstadoMembresia.CANCELADA },
      },
      data: { estado: EstadoMembresia.CANCELADA },
    });
    if (afectadas.count === 0) {
      throw new BadRequestException('La membresia ya esta cancelada');
    }
    const actualizada = await this.prisma.membresiaCliente.findUniqueOrThrow({
      where: { id: membresia.id },
    });
    await this.auditar(
      empresaId,
      actorId,
      'membresia.cancelada',
      'MembresiaCliente',
      id,
      { estadoAnterior: membresia.estado },
      ip,
    );
    return actualizada;
  }

  private async obtenerMembresia(empresaId: string, id: string) {
    const membresia = await this.prisma.membresiaCliente.findFirst({
      where: { id, empresaId },
    });
    if (!membresia) throw new NotFoundException('Membresia no encontrada');
    return membresia;
  }
}
