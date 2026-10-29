import { BadRequestException, Injectable } from '@nestjs/common';
import { MetodoAceptacion } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import {
  DOCUMENTOS_LEGALES_VIGENTES,
  FECHA_DOCUMENTOS_LEGALES,
  VERSION_DOCUMENTOS_LEGALES,
} from './documentos-legales';
import { AceptarDocumentosDto } from './dto/aceptacion-legal.dto';

@Injectable()
export class LegalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /**
   * Documentos que el usuario aun no ha aceptado en la version vigente.
   * La version la define el backend; el navegador no puede saltarse el aviso
   * enviando una version distinta.
   */
  async pendientes(usuario: AuthenticatedUser) {
    const aceptadas = await this.prisma.aceptacionLegal.findMany({
      where: { usuarioId: usuario.id },
      select: { documento: true, version: true },
    });

    const documentos = DOCUMENTOS_LEGALES_VIGENTES.filter(
      (documento) =>
        !aceptadas.some(
          (aceptada) =>
            aceptada.documento === documento.documento &&
            aceptada.version === VERSION_DOCUMENTOS_LEGALES,
        ),
    );

    return {
      version: VERSION_DOCUMENTOS_LEGALES,
      fecha: FECHA_DOCUMENTOS_LEGALES,
      documentos,
    };
  }

  async aceptar(
    usuario: AuthenticatedUser,
    dto: AceptarDocumentosDto,
    ip?: string | null,
    userAgent?: string | null,
  ) {
    const documentos = DOCUMENTOS_LEGALES_VIGENTES.filter((documento) =>
      dto.documentos.includes(documento.documento),
    );

    if (documentos.length === 0) {
      throw new BadRequestException(
        'Debe aceptar al menos un documento legal vigente',
      );
    }

    const metodo = dto.metodo ?? MetodoAceptacion.PRIMER_LOGIN;
    const resultado = await this.prisma.aceptacionLegal.createMany({
      data: documentos.map((documento) => ({
        usuarioId: usuario.id,
        documento: documento.documento,
        version: VERSION_DOCUMENTOS_LEGALES,
        hash: documento.hash,
        metodo,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      })),
      skipDuplicates: true,
    });

    await this.auditoria.registrar({
      empresaId: usuario.empresaId,
      usuarioId: usuario.id,
      accion: 'ACEPTAR_DOCUMENTOS_LEGALES',
      entidad: 'AceptacionLegal',
      datosNuevos: {
        version: VERSION_DOCUMENTOS_LEGALES,
        metodo,
        documentos: documentos.map((documento) => ({
          documento: documento.documento,
          hash: documento.hash,
        })),
      },
      ip: ip ?? null,
    });

    return {
      registradas: resultado.count,
      version: VERSION_DOCUMENTOS_LEGALES,
      documentos: documentos.map((documento) => documento.documento),
    };
  }

  historial(usuario: AuthenticatedUser) {
    return this.prisma.aceptacionLegal.findMany({
      where: { usuarioId: usuario.id },
      orderBy: { aceptadoEn: 'desc' },
      take: 100,
      select: {
        documento: true,
        version: true,
        hash: true,
        metodo: true,
        aceptadoEn: true,
      },
    });
  }
}
