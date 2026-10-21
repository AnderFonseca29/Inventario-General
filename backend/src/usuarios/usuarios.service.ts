import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { SuscripcionesService } from '../suscripciones/suscripciones.service';
import {
  CreateUsuarioDto,
  ResetPasswordDto,
  UpdateUsuarioDto,
} from './dto/usuario.dto';

/** Actor que ejecuta la operacion: id + permisos efectivos. */
export interface ActorUsuarios {
  id: string;
  permisos: string[];
  esSuperAdmin: boolean;
}

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly suscripciones: SuscripcionesService,
  ) {}

  private async validarRolesDeEmpresa(empresaId: string, rolIds: string[]) {
    if (rolIds.length === 0) {
      throw new BadRequestException('Debe asignar al menos un rol');
    }
    const roles = await this.prisma.rol.findMany({
      where: { id: { in: rolIds }, empresaId },
      select: {
        id: true,
        nombre: true,
        permisos: { select: { permiso: { select: { codigo: true } } } },
      },
    });
    if (roles.length !== rolIds.length) {
      throw new BadRequestException(
        'Uno o mas roles no pertenecen a la empresa',
      );
    }
    return roles;
  }

  /**
   * Evita la escalada de privilegios (hallazgo E): el actor no puede asignar
   * roles cuyos permisos excedan los que el mismo posee. Sin esto, un usuario
   * con "usuarios.crear" o "usuarios.editar" podia asignarse (o asignar a otra
   * cuenta) el rol Administrador, que incluye todos los permisos.
   */
  private exigirRolesNoSuperiores(
    actor: ActorUsuarios,
    roles: { nombre: string; permisos: { permiso: { codigo: string } }[] }[],
  ): void {
    if (actor.esSuperAdmin) return;
    const propios = new Set(actor.permisos);
    for (const rol of roles) {
      const excedidos = rol.permisos
        .map((p) => p.permiso.codigo)
        .filter((codigo) => !propios.has(codigo));
      if (excedidos.length > 0) {
        throw new ForbiddenException(
          `No puede asignar el rol "${rol.nombre}": contiene permisos que usted no tiene (${excedidos.join(', ')})`,
        );
      }
    }
  }

  /** Permisos efectivos de un usuario objetivo (para comparar privilegios). */
  private async permisosDeUsuario(usuarioId: string): Promise<Set<string>> {
    const filas = await this.prisma.usuarioRol.findMany({
      where: { usuarioId },
      select: {
        rol: {
          select: {
            permisos: { select: { permiso: { select: { codigo: true } } } },
          },
        },
      },
    });
    const set = new Set<string>();
    for (const fila of filas) {
      for (const rp of fila.rol.permisos) set.add(rp.permiso.codigo);
    }
    return set;
  }

  /**
   * Impide operar sobre cuentas con mas privilegios que el actor (hallazgo E):
   * sin esto, alguien con "usuarios.editar" podia resetear la contrasena del
   * Administrador y tomar su cuenta (robo de sesion permanente).
   */
  private async exigirNoSuperaAlObjetivo(
    actor: ActorUsuarios,
    empresaId: string,
    objetivoId: string,
  ): Promise<void> {
    if (actor.esSuperAdmin || objetivoId === actor.id) return;
    const objetivo = await this.prisma.usuario.findFirst({
      where: { id: objetivoId, empresaId },
      select: { esSuperAdmin: true },
    });
    if (objetivo?.esSuperAdmin) {
      throw new ForbiddenException(
        'No puede modificar una cuenta de administracion de plataforma',
      );
    }
    const permisosObjetivo = await this.permisosDeUsuario(objetivoId);
    const propios = new Set(actor.permisos);
    const excedidos = [...permisosObjetivo].filter((c) => !propios.has(c));
    if (excedidos.length > 0) {
      throw new ForbiddenException(
        'No puede modificar un usuario con mas privilegios que usted',
      );
    }
  }

  // Un usuario solo puede asignar roles cuyos permisos no excedan los propios.
  private serialize(usuario: {
    id: string;
    nombre: string;
    email: string;
    activo: boolean;
    esSuperAdmin: boolean;
    empresaId: string | null;
    ultimoLogin: Date | null;
    createdAt: Date;
    roles: { rol: { id: string; nombre: string } }[];
  }) {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      activo: usuario.activo,
      esSuperAdmin: usuario.esSuperAdmin,
      empresaId: usuario.empresaId,
      ultimoLogin: usuario.ultimoLogin,
      createdAt: usuario.createdAt,
      roles: usuario.roles.map((r) => r.rol),
    };
  }

  async listar(empresaId: string) {
    const usuarios = await this.prisma.usuario.findMany({
      where: { empresaId },
      orderBy: { nombre: 'asc' },
      include: {
        roles: { include: { rol: { select: { id: true, nombre: true } } } },
      },
    });
    return usuarios.map((u) => this.serialize(u));
  }

  async obtener(empresaId: string, id: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, empresaId },
      include: {
        roles: { include: { rol: { select: { id: true, nombre: true } } } },
      },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.serialize(usuario);
  }

  async crear(
    empresaId: string,
    dto: CreateUsuarioDto,
    actor: ActorUsuarios,
    ip?: string,
  ) {
    const email = dto.email.toLowerCase();
    const existe = await this.prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      throw new ConflictException('El correo ya esta registrado');
    }

    const roles = await this.validarRolesDeEmpresa(empresaId, dto.roles);
    this.exigirRolesNoSuperiores(actor, roles);
    const rolIds = roles.map((r) => r.id);
    const passwordHash = await argon2.hash(dto.password);

    const usuario = await this.prisma.$transaction(async (tx) => {
      const limite = await this.suscripciones.limites(empresaId);
      if (limite.maxUsuarios !== null) {
        const activos = await tx.usuario.count({
          where: { empresaId, activo: true },
        });
        if (activos >= limite.maxUsuarios) {
          throw new ForbiddenException(
            `Limite del plan alcanzado (${limite.maxUsuarios} usuarios activos)`,
          );
        }
      }

      const creado = await tx.usuario.create({
        data: {
          empresaId,
          nombre: dto.nombre,
          email,
          passwordHash,
          activo: dto.activo ?? true,
        },
      });

      await tx.usuarioRol.createMany({
        data: rolIds.map((rolId) => ({ usuarioId: creado.id, rolId })),
      });

      return tx.usuario.findUniqueOrThrow({
        where: { id: creado.id },
        include: {
          roles: { include: { rol: { select: { id: true, nombre: true } } } },
        },
      });
    });

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actor.id,
      accion: 'usuario.creado',
      entidad: 'Usuario',
      entidadId: usuario.id,
      datosNuevos: { email: usuario.email, roles: dto.roles },
      ip,
    });

    return this.serialize(usuario);
  }

  async actualizar(
    empresaId: string,
    id: string,
    dto: UpdateUsuarioDto,
    actor: ActorUsuarios,
    ip?: string,
  ) {
    await this.obtener(empresaId, id);
    await this.exigirNoSuperaAlObjetivo(actor, empresaId, id);

    if (id === actor.id && dto.activo === false) {
      throw new BadRequestException('No puede desactivar su propio usuario');
    }

    let rolIds: string[] | undefined;
    if (dto.roles) {
      const roles = await this.validarRolesDeEmpresa(empresaId, dto.roles);
      this.exigirRolesNoSuperiores(actor, roles);
      rolIds = roles.map((r) => r.id);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id },
        data: { nombre: dto.nombre, activo: dto.activo },
      });

      if (rolIds) {
        await tx.usuarioRol.deleteMany({ where: { usuarioId: id } });
        await tx.usuarioRol.createMany({
          data: rolIds.map((rolId) => ({ usuarioId: id, rolId })),
        });
      }
    });

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actor.id,
      accion: 'usuario.actualizado',
      entidad: 'Usuario',
      entidadId: id,
      datosNuevos: dto as unknown as Prisma.InputJsonValue,
      ip,
    });

    return this.obtener(empresaId, id);
  }

  async desactivar(
    empresaId: string,
    id: string,
    actor: ActorUsuarios,
    ip?: string,
  ) {
    if (id === actor.id) {
      throw new BadRequestException('No puede desactivar su propio usuario');
    }
    await this.obtener(empresaId, id);
    await this.exigirNoSuperaAlObjetivo(actor, empresaId, id);
    await this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
    });
    await this.auditoria.registrar({
      empresaId,
      usuarioId: actor.id,
      accion: 'usuario.desactivado',
      entidad: 'Usuario',
      entidadId: id,
      ip,
    });
    return { ok: true };
  }

  async resetPassword(
    empresaId: string,
    id: string,
    dto: ResetPasswordDto,
    actor: ActorUsuarios,
    ip?: string,
  ) {
    await this.obtener(empresaId, id);
    await this.exigirNoSuperaAlObjetivo(actor, empresaId, id);
    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.usuario.update({ where: { id }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({
        where: { usuarioId: id, revocado: false },
        data: { revocado: true },
      }),
    ]);
    await this.auditoria.registrar({
      empresaId,
      usuarioId: actor.id,
      accion: 'usuario.password_reseteado',
      entidad: 'Usuario',
      entidadId: id,
      ip,
    });
    return { ok: true };
  }
}
