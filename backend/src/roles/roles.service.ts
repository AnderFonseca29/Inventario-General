import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { PermisosCacheService } from '../common/cache/permisos-cache.service';
import { CreateRolDto, UpdateRolDto } from './dto/rol.dto';

/** Actor que ejecuta la operación: id + permisos efectivos. */
export interface ActorRoles {
  id: string;
  permisos: string[];
  esSuperAdmin: boolean;
}

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly permisosCache: PermisosCacheService,
  ) {}

  /**
   * Evita la escalada de privilegios (hallazgo E): el actor no puede crear ni
   * modificar roles con permisos que el mismo no posee; de lo contrario podia
   * fabricar un rol "Administrador" y asignarselo.
   */
  private exigirPermisosNoSuperiores(
    actor: ActorRoles,
    codigos: string[],
  ): void {
    if (actor.esSuperAdmin) return;
    const propios = new Set(actor.permisos);
    const excedidos = codigos.filter((codigo) => !propios.has(codigo));
    if (excedidos.length > 0) {
      throw new ForbiddenException(
        `No puede otorgar permisos que usted no tiene: ${excedidos.join(', ')}`,
      );
    }
  }

  /** Comprueba que un rol existente no exceda los permisos del actor. */
  private exigirRolNoSuperior(
    actor: ActorRoles,
    rol: { nombre: string; permisos: { permiso: { codigo: string } }[] },
  ): void {
    if (actor.esSuperAdmin) return;
    const propios = new Set(actor.permisos);
    const excedidos = rol.permisos
      .map((p) => p.permiso.codigo)
      .filter((codigo) => !propios.has(codigo));
    if (excedidos.length > 0) {
      throw new ForbiddenException(
        `No puede administrar el rol "${rol.nombre}": contiene permisos que usted no tiene`,
      );
    }
  }

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

  /**
   * Invalida la cache de permisos de todos los usuarios que tienen asignado
   * un rol (hallazgo R): cambiar los permisos de un rol surte efecto de
   * inmediato y no espera al TTL.
   */
  private async invalidarPermisosDeUsuariosDelRol(rolId: string): Promise<void> {
    const asignaciones = await this.prisma.usuarioRol.findMany({
      where: { rolId },
      select: { usuarioId: true },
    });
    this.permisosCache.invalidarVarios(
      asignaciones.map((a) => a.usuarioId),
    );
  }

  async crear(    empresaId: string,
    dto: CreateRolDto,
    actor: ActorRoles,
    ip?: string,
  ) {
    const existe = await this.prisma.rol.findFirst({
      where: { empresaId, nombre: dto.nombre },
    });
    if (existe) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }

    this.exigirPermisosNoSuperiores(actor, dto.permisos);
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
      usuarioId: actor.id,
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
    actor: ActorRoles,
    ip?: string,
  ) {
    const rol = await this.obtener(empresaId, id);

    if (rol.esSistema && dto.nombre && dto.nombre !== rol.nombre) {
      throw new BadRequestException('No se puede renombrar un rol de sistema');
    }

    this.exigirRolNoSuperior(actor, rol);
    if (dto.permisos) {
      this.exigirPermisosNoSuperiores(actor, dto.permisos);
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
      usuarioId: actor.id,
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

    await this.invalidarPermisosDeUsuariosDelRol(id);

    return this.obtener(empresaId, id);
  }

  async eliminar(
    empresaId: string,
    id: string,
    actor: ActorRoles,
    ip?: string,
  ) {
    const rol = await this.obtener(empresaId, id);
    if (rol.esSistema) {
      throw new BadRequestException('No se puede eliminar un rol de sistema');
    }
    this.exigirRolNoSuperior(actor, rol);

    const asignados = await this.prisma.usuarioRol.count({
      where: { rolId: id },
    });
    if (asignados > 0) {
      throw new ConflictException('El rol tiene usuarios asignados');
    }

    await this.prisma.rol.delete({ where: { id } });
    await this.auditoria.registrar({
      empresaId,
      usuarioId: actor.id,
      accion: 'rol.eliminado',
      entidad: 'Rol',
      entidadId: id,
      datosAnteriores: { nombre: rol.nombre },
      ip,
    });
    return { ok: true };
  }
}
