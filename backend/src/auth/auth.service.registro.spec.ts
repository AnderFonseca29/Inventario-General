import { BadRequestException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VERSION_DOCUMENTOS_LEGALES } from '../legal/documentos-legales';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hash-ficticio'),
  verify: jest.fn().mockResolvedValue(true),
}));

const dtoBase = {
  razonSocial: 'Distribuidora El Roble S.A.S.',
  nombre: 'El Roble',
  nit: '901.234.567-8',
  direccion: 'Calle 93 No. 15-20',
  ciudad: 'Bogotá D.C.',
  departamento: 'Cundinamarca',
  representante: 'María Fernanda Gómez',
  correoDatos: 'Privacidad@ElRoble.com',
  nombreAdmin: 'Ana Pérez',
  email: 'Ana@Empresa.com',
  password: 'Roble*2026',
  aceptaTerminos: true,
};

type Datos = Record<string, unknown>;

interface ServicioInterno {
  loadAuthenticatedUser: (id: string) => Promise<Record<string, unknown>>;
  emitirTokens: () => Promise<{ accessToken: string; refreshToken: string }>;
}

function crearServicio(opciones: { existeUsuario?: boolean } = {}) {
  const tx = {
    aceptacionLegal: {
      createMany: jest.fn((argumentos: { data: Datos[]; skipDuplicates?: boolean }) => {
        void argumentos;
        return Promise.resolve({ count: 3 });
      }),
    },
  };

  const prisma = {
    usuario: {
      findUnique: jest.fn(() =>
        Promise.resolve(opciones.existeUsuario ? { id: 'u-existente' } : null),
      ),
    },
    $transaction: jest.fn((cb: (cliente: unknown) => unknown) => cb(tx)),
  };

  const aprovisionamiento = {
    crear: jest.fn((_tx: unknown, _empresa: Datos, _admin: Datos) => {
      void [_tx, _empresa, _admin];
      return Promise.resolve({
        empresa: {
          id: 'emp-1',
          nombre: 'El Roble',
          nit: '901.234.567-8',
        },
        administrador: { id: 'usr-1', email: 'ana@empresa.com' },
        suscripcion: { id: 'sus-1', fechaFin: new Date('2026-11-06') },
        plan: { id: 'plan-1', codigo: 'pro', nombre: 'Medio' },
      });
    }),
  };

  const auditoria = {
    registrar: jest.fn((_registro: Datos) => {
      void _registro;
      return Promise.resolve(undefined);
    }),
  };
  const captcha = { verificar: jest.fn(() => Promise.resolve(undefined)) };
  const config = { get: jest.fn(() => 'false') };

  const servicio = new AuthService(
    prisma as never,
    {} as never,
    config as never,
    auditoria as never,
    {} as never,
    aprovisionamiento as never,
    captcha as never,
  );

  const interno = servicio as unknown as ServicioInterno;
  jest.spyOn(interno, 'loadAuthenticatedUser').mockResolvedValue({
    id: 'usr-1',
    email: 'ana@empresa.com',
    empresaId: 'emp-1',
    esSuperAdmin: false,
    esPropietario: true,
    permisos: [],
  });
  jest.spyOn(interno, 'emitirTokens').mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

  return { servicio, prisma, tx, aprovisionamiento, auditoria, captcha };
}

describe('AuthService.registro', () => {
  it('devuelve la misma forma que el login', async () => {
    const { servicio } = crearServicio();
    const resultado = await servicio.registro(dtoBase, '127.0.0.1', 'jest');

    expect(resultado.accessToken).toBe('a');
    expect(resultado.refreshToken).toBe('r');
    expect(resultado.user).toMatchObject({
      id: 'usr-1',
      empresaId: 'emp-1',
      esPropietario: true,
      esSuperAdmin: false,
    });
  });

  it('normaliza el correo y los datos de la empresa', async () => {
    const { servicio, prisma, aprovisionamiento } = crearServicio();
    await servicio.registro(dtoBase, '127.0.0.1');

    expect(prisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { email: 'ana@empresa.com' },
      select: { id: true },
    });
    expect(aprovisionamiento.crear).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        correoDatos: 'privacidad@elroble.com',
        razonSocial: 'Distribuidora El Roble S.A.S.',
        nit: '901.234.567-8',
      }),
      expect.objectContaining({
        email: 'ana@empresa.com',
        nombre: 'Ana Pérez',
      }),
    );
  });

  it('no deja que el cliente decida rol, propietario ni plan', async () => {
    const { servicio, aprovisionamiento } = crearServicio();
    await servicio.registro({
      ...dtoBase,
      rol: 'SuperAdmin',
      esPropietario: false,
      plan: 'empresa',
    } as never);

    const administrador = aprovisionamiento.crear.mock.calls[0][2];
    expect(administrador).toEqual({
      nombre: 'Ana Pérez',
      email: 'ana@empresa.com',
      passwordHash: 'hash-ficticio',
      emailVerificado: true,
    });
  });

  it('registra la aceptación de los tres documentos con la versión del servidor', async () => {
    const { servicio, tx } = crearServicio();
    await servicio.registro(dtoBase, '10.0.0.1', 'jest-agent');

    const { data, skipDuplicates } = tx.aceptacionLegal.createMany.mock.calls[0][0];
    expect(skipDuplicates).toBe(true);
    expect(data).toHaveLength(3);
    for (const fila of data) {
      expect(fila.usuarioId).toBe('usr-1');
      expect(fila.version).toBe(VERSION_DOCUMENTOS_LEGALES);
      expect(fila.metodo).toBe('REGISTRO');
      expect(fila.ip).toBe('10.0.0.1');
      expect(String(fila.hash)).toHaveLength(64);
    }
  });

  it('audita el alta con el plan y los días de prueba', async () => {
    const { servicio, auditoria } = crearServicio();
    await servicio.registro(dtoBase, '127.0.0.1');

    const registro = auditoria.registrar.mock.calls[0][0];
    const datosNuevos = registro.datosNuevos as Datos;
    expect(registro).toMatchObject({
      empresaId: 'emp-1',
      usuarioId: 'usr-1',
      accion: 'empresa.registro_publico',
    });
    expect(datosNuevos.plan).toBe('pro');
    expect(datosNuevos.diasPrueba).toBe(7);
  });

  it('rechaza un correo ya registrado sin abrir transacción', async () => {
    const { servicio, prisma } = crearServicio({ existeUsuario: true });

    await expect(servicio.registro(dtoBase, '127.0.0.1')).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('detiene el alta si el CAPTCHA no valida', async () => {
    const { servicio, captcha, prisma } = crearServicio();
    captcha.verificar.mockRejectedValueOnce(
      new BadRequestException('Falta la verificación anti-robots'),
    );

    await expect(servicio.registro(dtoBase, '127.0.0.1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
