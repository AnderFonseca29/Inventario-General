import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  PERMISOS_POR_ROL_SISTEMA,
  ROLES_SISTEMA,
} from '../common/constants/permisos';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  private async crearRolesSistema(
    tx: Prisma.TransactionClient,
    empresaId: string,
  ) {
    const permisos = await tx.permiso.findMany({
      select: { id: true, codigo: true },
    });
    const porCodigo = new Map(permisos.map((p) => [p.codigo, p.id]));

    for (const [nombreRol, codigos] of Object.entries(
      PERMISOS_POR_ROL_SISTEMA,
    )) {
      const permisoIds = codigos
        .map((codigo) => porCodigo.get(codigo))
        .filter((id): id is string => Boolean(id));

      await tx.rol.create({
        data: {
          empresaId,
          nombre: nombreRol,
          esSistema: true,
          permisos: { create: permisoIds.map((permisoId) => ({ permisoId })) },
        },
      });
    }
  }

  async crear(dto: CreateEmpresaDto, actorId: string, ip?: string) {
    const email = dto.admin.email.toLowerCase();
    const existe = await this.prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      throw new ConflictException(
        'El correo del administrador ya esta registrado',
      );
    }
    if (dto.nit) {
      const existeNit = await this.prisma.empresa.findUnique({
        where: { nit: dto.nit },
      });
      if (existeNit) {
        throw new ConflictException('El NIT ya esta registrado');
      }
    }

    const passwordHash = await argon2.hash(dto.admin.password);

    const empresa = await this.prisma.$transaction(async (tx) => {
      const nueva = await tx.empresa.create({
        data: {
          nombre: dto.nombre,
          nit: dto.nit,
          razonSocial: dto.razonSocial,
          email: dto.email,
          telefono: dto.telefono,
          direccion: dto.direccion,
        },
      });

      await this.crearRolesSistema(tx, nueva.id);

      const rolAdmin = await tx.rol.findFirst({
        where: { empresaId: nueva.id, nombre: ROLES_SISTEMA.ADMINISTRADOR },
      });

      const admin = await tx.usuario.create({
        data: {
          empresaId: nueva.id,
          nombre: dto.admin.nombre,
          email,
          passwordHash,
          esSuperAdmin: false,
        },
      });

      if (rolAdmin) {
        await tx.usuarioRol.create({
          data: { usuarioId: admin.id, rolId: rolAdmin.id },
        });
      }

      return nueva;
    });

    await this.auditoria.registrar({
      empresaId: empresa.id,
      usuarioId: actorId,
      accion: 'empresa.creada',
      entidad: 'Empresa',
      entidadId: empresa.id,
      datosNuevos: { nombre: empresa.nombre, nit: empresa.nit },
      ip,
    });

    return empresa;
  }

  listar() {
    return this.prisma.empresa.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nombre: true,
        nit: true,
        email: true,
        estado: true,
        createdAt: true,
        _count: { select: { usuarios: true, bodegas: true } },
      },
    });
  }

  async obtener(id: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      include: {
        suscripciones: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada');
    }
    return empresa;
  }

  async actualizar(
    id: string,
    dto: UpdateEmpresaDto,
    actorId: string,
    ip?: string,
  ) {
    await this.obtener(id);
    const empresa = await this.prisma.empresa.update({
      where: { id },
      data: dto,
    });
    await this.auditoria.registrar({
      empresaId: id,
      usuarioId: actorId,
      accion: 'empresa.actualizada',
      entidad: 'Empresa',
      entidadId: id,
      datosNuevos: dto as Prisma.InputJsonValue,
      ip,
    });
    return empresa;
  }

  async cambiarEstado(
    id: string,
    estado: 'ACTIVA' | 'SUSPENDIDA' | 'CANCELADA',
    actorId: string,
    ip?: string,
  ) {
    await this.obtener(id);
    const empresa = await this.prisma.empresa.update({
      where: { id },
      data: { estado },
    });
    await this.auditoria.registrar({
      empresaId: id,
      usuarioId: actorId,
      accion: 'empresa.estado_cambiado',
      entidad: 'Empresa',
      entidadId: id,
      datosNuevos: { estado },
      ip,
    });
    return empresa;
  }
}
