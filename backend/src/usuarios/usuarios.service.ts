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
      select: { id: true },
    });
    if (roles.length !== rolIds.length) {
      throw new BadRequestException(
        'Uno o mas roles no pertenecen a la empresa',
      );
    }
    return roles.map((r) => r.id);
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
    actorId: string,
    ip?: string,
  ) {
    const email = dto.email.toLowerCase();
    const existe = await this.prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      throw new ConflictException('El correo ya esta registrado');
    }

    const rolIds = await this.validarRolesDeEmpresa(empresaId, dto.roles);
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
      usuarioId: actorId,
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
    actorId: string,
    ip?: string,
  ) {
    await this.obtener(empresaId, id);

    if (id === actorId && dto.activo === false) {
      throw new BadRequestException('No puede desactivar su propio usuario');
    }

    if (dto.roles) {
      await this.validarRolesDeEmpresa(empresaId, dto.roles);
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
      usuarioId: actorId,
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
    actorId: string,
    ip?: string,
  ) {
    if (id === actorId) {
      throw new BadRequestException('No puede desactivar su propio usuario');
    }
    await this.obtener(empresaId, id);
    await this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
    });
    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
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
    actorId: string,
    ip?: string,
  ) {
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
      usuarioId: actorId,
      accion: 'usuario.password_reseteado',
      entidad: 'Usuario',
      entidadId: id,
      ip,
    });
    return { ok: true };
  }
}
