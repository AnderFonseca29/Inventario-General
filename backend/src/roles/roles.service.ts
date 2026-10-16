import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateRolDto, UpdateRolDto } from './dto/rol.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  private async resolverPermisoIds(codigos: string[]): Promise<string[]> {
    const permisos = await this.prisma.permiso.findMany({
      where: { codigo: { in: codigos } },
      select: { id: true, codigo: true },
    });
    const encontrados = new Set(permisos.map((p) => p.codigo));
    const faltantes = codigos.filter((c) => !encontrados.has(c));
    if (faltantes.length > 0) {
      throw new BadRequestException(
        `Permisos inexistentes: ${faltantes.join(', ')}`,
      );
    }
    return permisos.map((p) => p.id);
  }

  async listar(empresaId: string) {
    return this.prisma.rol.findMany({
      where: { empresaId },
      orderBy: [{ esSistema: 'desc' }, { nombre: 'asc' }],
      include: {
        permisos: { include: { permiso: { select: { codigo: true } } } },
        _count: { select: { usuarios: true } },
      },
    });
  }

  async obtener(empresaId: string, id: string) {
    const rol = await this.prisma.rol.findFirst({
      where: { id, empresaId },
      include: { permisos: { include: { permiso: true } } },
    });
    if (!rol) {
      throw new NotFoundException('Rol no encontrado');
    }
    return rol;
  }

  async crear(
    empresaId: string,
    dto: CreateRolDto,
    actorId: string,
    ip?: string,
  ) {
    const existe = await this.prisma.rol.findFirst({
      where: { empresaId, nombre: dto.nombre },
    });
    if (existe) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }

    const permisoIds = await this.resolverPermisoIds(dto.permisos);

    const rol = await this.prisma.rol.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        permisos: { create: permisoIds.map((permisoId) => ({ permisoId })) },
      },
      include: { permisos: { include: { permiso: true } } },
    });

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'rol.creado',
      entidad: 'Rol',
      entidadId: rol.id,
      datosNuevos: { nombre: rol.nombre, permisos: dto.permisos },
      ip,
    });

    return rol;
  }

  async actualizar(
    empresaId: string,
    id: string,
    dto: UpdateRolDto,
    actorId: string,
    ip?: string,
  ) {
    const rol = await this.obtener(empresaId, id);

    if (rol.esSistema && dto.nombre && dto.nombre !== rol.nombre) {
      throw new BadRequestException('No se puede renombrar un rol de sistema');
    }

    const data: Prisma.RolUpdateInput = {};
    if (dto.nombre) data.nombre = dto.nombre;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;

    await this.prisma.$transaction(async (tx) => {
      await tx.rol.update({ where: { id }, data });

      if (dto.permisos) {
        const permisoIds = await this.resolverPermisoIds(dto.permisos);
        await tx.rolPermiso.deleteMany({ where: { rolId: id } });
        await tx.rolPermiso.createMany({
          data: permisoIds.map((permisoId) => ({ rolId: id, permisoId })),
        });
      }
    });

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'rol.actualizado',
      entidad: 'Rol',
      entidadId: id,
      datosAnteriores: {
        nombre: rol.nombre,
        permisos: rol.permisos.map((p) => p.permiso.codigo),
      },
      datosNuevos: dto as Prisma.InputJsonValue,
      ip,
    });

    return this.obtener(empresaId, id);
  }

  async eliminar(empresaId: string, id: string, actorId: string, ip?: string) {
    const rol = await this.obtener(empresaId, id);
    if (rol.esSistema) {
      throw new BadRequestException('No se puede eliminar un rol de sistema');
    }

    const asignados = await this.prisma.usuarioRol.count({
      where: { rolId: id },
    });
    if (asignados > 0) {
      throw new ConflictException('El rol tiene usuarios asignados');
    }

    await this.prisma.rol.delete({ where: { id } });
    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'rol.eliminado',
      entidad: 'Rol',
      entidadId: id,
      datosAnteriores: { nombre: rol.nombre },
      ip,
    });
    return { ok: true };
  }
}
