import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import {
  CreateModuloDto,
  ReordenarModulosDto,
  UpdateModuloDto,
} from './dto/modulo.dto';

@Injectable()
export class ModulosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  listar(empresaId: string, soloActivos = false) {
    return this.prisma.modulo.findMany({
      where: { empresaId, ...(soloActivos ? { activo: true } : {}) },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
  }

  async obtener(empresaId: string, id: string) {
    const modulo = await this.prisma.modulo.findFirst({
      where: { id, empresaId },
    });
    if (!modulo) {
      throw new NotFoundException('Modulo no encontrado');
    }
    return modulo;
  }

  private generarClave(nombre: string): string {
    const base = nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    return base || 'modulo';
  }

  private async claveUnica(empresaId: string, nombre: string) {
    const base = this.generarClave(nombre);
    let clave = base;
    let sufijo = 2;
    while (
      await this.prisma.modulo.findFirst({ where: { empresaId, clave } })
    ) {
      clave = `${base}-${sufijo}`;
      sufijo += 1;
    }
    return clave;
  }

  private async siguienteOrden(empresaId: string): Promise<number> {
    const ultimo = await this.prisma.modulo.aggregate({
      where: { empresaId },
      _max: { orden: true },
    });
    return (ultimo._max.orden ?? 0) + 1;
  }

  async crear(
    empresaId: string,
    dto: CreateModuloDto,
    actorId: string,
    ip?: string,
  ) {
    const modulo = await this.prisma.modulo.create({
      data: {
        empresaId,
        clave: await this.claveUnica(empresaId, dto.nombre),
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        icono: dto.icono ?? 'box',
        ruta: dto.ruta,
        orden: dto.orden ?? (await this.siguienteOrden(empresaId)),
        tipo: 'PERSONALIZADO',
        activo: dto.activo ?? true,
      },
    });

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'modulo.creado',
      entidad: 'Modulo',
      entidadId: modulo.id,
      datosNuevos: { nombre: modulo.nombre, clave: modulo.clave },
      ip,
    });

    return modulo;
  }

  async actualizar(
    empresaId: string,
    id: string,
    dto: UpdateModuloDto,
    actorId: string,
    ip?: string,
  ) {
    const modulo = await this.obtener(empresaId, id);

    const data: Prisma.ModuloUpdateInput = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.icono !== undefined) data.icono = dto.icono;
    if (dto.orden !== undefined) data.orden = dto.orden;
    if (dto.activo !== undefined) data.activo = dto.activo;
    // La ruta solo se administra para modulos personalizados; los modulos de
    // sistema tienen su enrutamiento fijo en la aplicacion.
    if (dto.ruta !== undefined && modulo.tipo === 'PERSONALIZADO') {
      data.ruta = dto.ruta;
    }

    const actualizado = await this.prisma.modulo.update({
      where: { id },
      data,
    });

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'modulo.actualizado',
      entidad: 'Modulo',
      entidadId: id,
      datosAnteriores: {
        nombre: modulo.nombre,
        icono: modulo.icono,
        orden: modulo.orden,
        activo: modulo.activo,
      },
      datosNuevos: dto as Prisma.InputJsonValue,
      ip,
    });

    return actualizado;
  }

  async eliminar(empresaId: string, id: string, actorId: string, ip?: string) {
    const modulo = await this.obtener(empresaId, id);
    if (modulo.tipo === 'SISTEMA') {
      throw new BadRequestException(
        'No se puede eliminar un modulo del sistema',
      );
    }

    await this.prisma.modulo.delete({ where: { id } });
    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'modulo.eliminado',
      entidad: 'Modulo',
      entidadId: id,
      datosAnteriores: { nombre: modulo.nombre, clave: modulo.clave },
      ip,
    });

    return { ok: true };
  }

  async reordenar(
    empresaId: string,
    dto: ReordenarModulosDto,
    actorId: string,
    ip?: string,
  ) {
    const ids = dto.items.map((item) => item.id);
    const existentes = await this.prisma.modulo.count({
      where: { empresaId, id: { in: ids } },
    });
    if (existentes !== ids.length) {
      throw new BadRequestException(
        'Alguno de los modulos no pertenece a la empresa',
      );
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.modulo.update({
          where: { id: item.id },
          data: { orden: item.orden },
        }),
      ),
    );

    await this.auditoria.registrar({
      empresaId,
      usuarioId: actorId,
      accion: 'modulos.reordenados',
      entidad: 'Modulo',
      datosNuevos: {
        items: dto.items.map((item) => ({ id: item.id, orden: item.orden })),
      },
      ip,
    });

    return this.listar(empresaId);
  }
}
