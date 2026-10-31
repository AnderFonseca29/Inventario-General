import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AprovisionamientoService } from './aprovisionamiento.service';
import { CreateEmpresaDto, UpdateEmpresaDto } from './dto/empresa.dto';

@Injectable()
export class EmpresasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly aprovisionamiento: AprovisionamientoService,
  ) {}

  async crear(dto: CreateEmpresaDto, actorId: string, ip?: string) {
    const email = dto.admin.email.toLowerCase();
    const existe = await this.prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      throw new ConflictException(
        'El correo del administrador ya está registrado',
      );
    }
    if (dto.nit) {
      const existeNit = await this.prisma.empresa.findUnique({
        where: { nit: dto.nit },
      });
      if (existeNit) {
        throw new ConflictException('El NIT ya está registrado');
      }
    }

    const passwordHash = await argon2.hash(dto.admin.password);

    const resultado = await this.prisma.$transaction((tx) =>
      this.aprovisionamiento.crear(
        tx,
        {
          nombre: dto.nombre,
          razonSocial: dto.razonSocial ?? dto.nombre,
          nit: dto.nit,
          direccion: dto.direccion,
          telefono: dto.telefono,
          email: dto.email,
        },
        {
          nombre: dto.admin.nombre,
          email,
          passwordHash,
          // El alta manual del superadministrador no pasa por verificación
          // de correo: la cuenta se entrega ya activa.
          emailVerificado: true,
        },
      ),
    );
    const empresa = await this.prisma.empresa.findUniqueOrThrow({
      where: { id: resultado.empresa.id },
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
