import { BadRequestException } from '@nestjs/common';
import { DocumentoLegal, MetodoAceptacion } from '@prisma/client';
import { LegalService } from './legal.service';
import { VERSION_DOCUMENTOS_LEGALES } from './documentos-legales';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

describe('LegalService', () => {
  const usuario: AuthenticatedUser = {
    id: 'usuario-1',
    email: 'dueno@example.test',
    empresaId: 'empresa-1',
    esSuperAdmin: false,
    esPropietario: true,
    permisos: [],
  };

  const crearMocks = () => {
    const prisma = {
      aceptacionLegal: {
        findMany: jest.fn(),
        createMany: jest.fn(),
      },
    };
    const auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
    const servicio = new LegalService(
      prisma as never,
      auditoria as never,
    );
    return { prisma, auditoria, servicio };
  };

  it('devuelve los tres documentos cuando no hay aceptaciones', async () => {
    const { prisma, servicio } = crearMocks();
    prisma.aceptacionLegal.findMany.mockResolvedValue([]);

    const resultado = await servicio.pendientes(usuario);

    expect(resultado.version).toBe(VERSION_DOCUMENTOS_LEGALES);
    expect(resultado.documentos.map((d) => d.documento)).toEqual([
      DocumentoLegal.TERMINOS,
      DocumentoLegal.PRIVACIDAD,
      DocumentoLegal.USO_ACEPTABLE,
    ]);
  });

  it('excluye los documentos aceptados en la version vigente', async () => {
    const { prisma, servicio } = crearMocks();
    prisma.aceptacionLegal.findMany.mockResolvedValue([
      {
        documento: DocumentoLegal.TERMINOS,
        version: VERSION_DOCUMENTOS_LEGALES,
      },
      {
        documento: DocumentoLegal.PRIVACIDAD,
        version: '0.0-anterior',
      },
    ]);

    const resultado = await servicio.pendientes(usuario);

    expect(resultado.documentos.map((d) => d.documento)).toEqual([
      DocumentoLegal.PRIVACIDAD,
      DocumentoLegal.USO_ACEPTABLE,
    ]);
  });

  it('registra la aceptacion con la version del servidor y audita', async () => {
    const { prisma, auditoria, servicio } = crearMocks();
    prisma.aceptacionLegal.createMany.mockResolvedValue({ count: 3 });

    const resultado = await servicio.aceptar(
      usuario,
      {
        documentos: [
          DocumentoLegal.TERMINOS,
          DocumentoLegal.PRIVACIDAD,
          DocumentoLegal.USO_ACEPTABLE,
        ],
        metodo: MetodoAceptacion.PRIMER_LOGIN,
      },
      '127.0.0.1',
      'jest',
    );

    expect(resultado).toMatchObject({
      registradas: 3,
      version: VERSION_DOCUMENTOS_LEGALES,
    });
    const datos = prisma.aceptacionLegal.createMany.mock.calls[0][0].data;
    expect(datos).toHaveLength(3);
    expect(datos.every((d: { version: string }) => d.version === VERSION_DOCUMENTOS_LEGALES)).toBe(
      true,
    );
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'ACEPTAR_DOCUMENTOS_LEGALES',
        usuarioId: usuario.id,
        empresaId: usuario.empresaId,
        ip: '127.0.0.1',
      }),
    );
  });

  it('rechaza una aceptacion sin documentos vigentes', async () => {
    const { servicio } = crearMocks();

    await expect(
      servicio.aceptar(usuario, { documentos: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
