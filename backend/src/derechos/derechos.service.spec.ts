import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  EstadoSolicitudDerechos,
  TipoSolicitudDerechos,
} from '@prisma/client';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { PrismaService } from '../prisma/prisma.service';
import { DerechosService } from './derechos.service';

describe('DerechosService', () => {
  let service: DerechosService;
  let prisma: {
    solicitudDerechos: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let auditoria: { registrar: jest.Mock };

  beforeEach(async () => {
    prisma = {
      solicitudDerechos: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    auditoria = { registrar: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        DerechosService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditoriaService, useValue: auditoria },
      ],
    }).compile();

    service = module.get(DerechosService);
  });

  it('radica una consulta y calcula un plazo de 10 dias habiles', async () => {
    prisma.solicitudDerechos.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: '11111111-1111-1111-1111-111111111111',
          estado: EstadoSolicitudDerechos.RECIBIDA,
          ...data,
        }),
    );

    const resultado = await service.crear(
      {
        tipo: TipoSolicitudDerechos.CONSULTA,
        nombre: 'Ana Pérez',
        documento: '123456789',
        correo: 'ana@example.com',
        mensaje: 'Solicito conocer los datos que tienen sobre mí.',
        autorizacion: true,
      },
      '127.0.0.1',
      'jest',
    );

    expect(resultado.radicado).toMatch(/^DER-\d{8}-[A-F0-9]{8}$/);
    expect(resultado.estado).toBe(EstadoSolicitudDerechos.RECIBIDA);
    expect(resultado.fechaLimite.getTime()).toBeGreaterThan(
      resultado.fechaRecepcion.getTime(),
    );
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'RADICAR_SOLICITUD_DERECHOS' }),
    );
  });

  it('no revela solicitudes cuando el radicado y el correo no coinciden', async () => {
    prisma.solicitudDerechos.findFirst.mockResolvedValue(null);

    await expect(
      service.consultar('DER-20261028-ABCDEF12', 'otro@example.com'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('devuelve la respuesta cuando la solicitud ya fue atendida', async () => {
    const atendida = {
      radicado: 'DER-20261028-ABCDEF12',
      tipo: TipoSolicitudDerechos.CONSULTA,
      estado: EstadoSolicitudDerechos.RESPONDIDA,
      fechaRecepcion: new Date('2026-10-28T15:00:00.000Z'),
      fechaLimite: new Date('2026-11-11T04:59:59.999Z'),
      fechaRespuesta: new Date('2026-10-30T15:00:00.000Z'),
      respuesta: 'Se remitió la información solicitada por correo.',
    };
    prisma.solicitudDerechos.findFirst.mockResolvedValue(atendida);

    const resultado = await service.consultar(
      'der-20261028-abcdef12',
      'ana@example.com',
    );

    expect(resultado).toEqual(atendida);
    expect(prisma.solicitudDerechos.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          radicado: 'DER-20261028-ABCDEF12',
          correo: { equals: 'ana@example.com', mode: 'insensitive' },
        },
        select: expect.objectContaining({ respuesta: true }),
      }),
    );
  });

  it('responde y deja auditoria de la solicitud', async () => {
    const anterior = {
      id: '22222222-2222-2222-2222-222222222222',
      estado: EstadoSolicitudDerechos.RECIBIDA,
      respuesta: null,
    };
    const actualizada = {
      ...anterior,
      estado: EstadoSolicitudDerechos.RESPONDIDA,
      respuesta: 'Se atendió la solicitud y se remitió la información.',
    };
    prisma.solicitudDerechos.findUnique.mockResolvedValue(anterior);
    prisma.solicitudDerechos.update.mockResolvedValue(actualizada);

    const resultado = await service.responder(
      anterior.id,
      {
        respuesta: 'Se atendió la solicitud y se remitió la información.',
        estado: EstadoSolicitudDerechos.RESPONDIDA,
      },
      '33333333-3333-3333-3333-333333333333',
      '127.0.0.1',
    );

    expect(resultado.estado).toBe(EstadoSolicitudDerechos.RESPONDIDA);
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'RESPONDER_SOLICITUD_DERECHOS',
        entidadId: anterior.id,
      }),
    );
  });
});
