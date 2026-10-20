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
import { assertPermisosNoSuperiores } from '../common/authz/permisos-actor';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly suscripciones: SuscripcionesService,
  ) {}

  // Un usuario solo puede gestionar (editar, desactivar, resetear contraseña)
  // a usuarios cuyos roles no tengan permisos superiores a los propios.
  private async assertPuedeGestionarUsuario(
    empresaId: string,
    id: string,
    actor: Pick<AuthenticatedUser, 'esSuperAdmin' | 'permisos'>,
    accion: string,
  ) {
    if (actor.esSuperAdmin) {
      return;
    }
    const objetivo = await this.prisma.usuario.findFirst({
      where: { id, empresaId },
      select: {
        esSuperAdmin: true,
        roles: {
          select: {
            rol: {
              select: {
                permisos: { select: { permiso: { select: { codigo: true } } } },
              },
            },
          },
        },
      },
    });
    if (!objetivo) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (objetivo.esSuperAdmin) {
      throw new ForbiddenException(
        `No puede ${accion} a un propietario de plataforma`,
      );
    }
    const codigos = objetivo.roles.flatMap((ur) =>
      ur.rol.permisos.map((rp) => rp.permiso.codigo),
    );
    try {
      assertPermisosNoSuperiores(actor, codigos);
    } catch {
      throw new ForbiddenException(
        `No puede ${accion} a un usuario con permisos superiores a los suyos`,
      );
    }
  }

  private async validarRolesDeEmpresa(empresaId: string, rolIds: string[]) {
    if (rolIds.length === 0) {
      throw new BadRequestException('Debe asignar al menos un rol');
    }
    const roles = await this.prisma.rol.findMany({
      where: { id: { in: rolIds }, empresaId },
      select: {
        id: true,
        permisos: { select: { permiso: { select: { codigo: true } } } },
      },
    });
    if (roles.length !== rolIds.length) {
      throw new BadRequestException(
        'Uno o mas roles no pertenecen a la empresa',
      );
    }
    return roles.map((r) => r.id);
  }

  // Un usuario solo puede asignar roles cuyos permisos no excedan los propios.
  private async validarPermisosDeRoles(
    empresaId: string,
    rolIds: string[],
    actor: Pick<AuthenticatedUser, 'esSuperAdmin' | 'permisos'>,
  ) {
    if (actor.esSuperAdmin) {
      return;
    }
    const roles = await this.prisma.rol.findMany({
      where: { id: { in: rolIds }, empresaId },
      select: { permisos: { select: { permiso: { select: { codigo: true } } } } },
    });
    const codigos = roles.flatMap((r) =>
      r.permisos.map((rp) => rp.permiso.codigo),
    );
    assertPermisosNoSuperiores(actor, codigos);
  }

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
    actor: AuthenticatedUser,
    ip?: string,
  ) {
    const email = dto.email.toLowerCase();
    const existe = await this.prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      throw new ConflictException('El correo ya esta registrado');
    }

    const rolIds = await this.validarRolesDeEmpresa(empresaId, dto.roles);
    await this.validarPermisosDeRoles(empresaId, rolIds, actor);
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
    actor: AuthenticatedUser,
    ip?: string,
  ) {
    await this.obtener(empresaId, id);

    if (id === actor.id && dto.activo === false) {
      throw new BadRequestException('No puede desactivar su propio usuario');
    }

    if (id !== actor.id) {
      await this.assertPuedeGestionarUsuario(empresaId, id, actor, 'editar');
    }

    if (dto.roles) {
      const rolIds = await this.validarRolesDeEmpresa(empresaId, dto.roles);
      await this.validarPermisosDeRoles(empresaId, rolIds, actor);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id },
        data: { nombre: dto.nombre, activo: dto.activo },
      });

      if (dto.roles) {
        await tx.usuarioRol.deleteMany({ where: { usuarioId: id } });
        await tx.usuarioRol.createMany({
          data: dto.roles.map((rolId) => ({ usuarioId: id, rolId })),
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
    actor: AuthenticatedUser,
    ip?: string,
  ) {
    if (id === actor.id) {
      throw new BadRequestException('No puede desactivar su propio usuario');
    }
    await this.assertPuedeGestionarUsuario(empresaId, id, actor, 'desactivar');
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
    actor: AuthenticatedUser,
    ip?: string,
  ) {
    await this.assertPuedeGestionarUsuario(empresaId, id, actor, 'resetear la contraseña');
    await this.obtener(empresaId, id);
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
