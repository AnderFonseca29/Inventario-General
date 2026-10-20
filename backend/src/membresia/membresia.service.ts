import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoMembresia, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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

  listarClientes(empresaId: string, filtros: ListarClientesDto) {
    const buscar = filtros.buscar?.trim();
    return this.prisma.cliente.findMany({
      where: {
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
      },
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { membresias: true } } },
    });
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

  listarPlanesMembresia(empresaId: string, filtros: ListarPlanesMembresiaDto) {
    const buscar = filtros.buscar?.trim();
    return this.prisma.planMembresia.findMany({
      where: {
        empresaId,
        ...(buscar
          ? { nombre: { contains: buscar, mode: 'insensitive' as const } }
          : {}),
      },
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { membresias: true } } },
    });
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
    const membresias = await this.prisma.membresiaCliente.findMany({
      where: {
        empresaId,
        ...(filtros.clienteId ? { clienteId: filtros.clienteId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        cliente: {
          select: { id: true, nombre: true, documento: true, telefono: true },
        },
        plan: {
          select: { id: true, nombre: true, precio: true, duracionDias: true },
        },
      },
    });
    const lista = membresias.map((m) => ({
      ...m,
      estado: this.estadoEfectivo(m.estado, m.fechaFin),
    }));
    if (filtros.estado) {
      return lista.filter((m) => m.estado === filtros.estado);
    }
    return lista;
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

    const creada = await this.prisma.$transaction(async (tx) => {
      await tx.membresiaCliente.update({
        where: { id: anterior.id },
        data: { estado: EstadoMembresia.VENCIDA },
      });
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
    if (membresia.estado === EstadoMembresia.CANCELADA) {
      throw new BadRequestException('La membresia ya esta cancelada');
    }
    const actualizada = await this.prisma.membresiaCliente.update({
      where: { id: membresia.id },
      data: { estado: EstadoMembresia.CANCELADA },
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
