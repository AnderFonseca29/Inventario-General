import { ServiceUnavailableException } from '@nestjs/common';
import { AprovisionamientoService, DIAS_PRUEBA } from './aprovisionamiento.service';
import { PERMISOS_POR_ROL_SISTEMA } from '../common/constants/permisos';

type Datos = Record<string, unknown>;

interface DatosSuscripcion {
  empresaId: string;
  planId: string;
  estado: string;
  fechaInicio: Date;
  fechaFin: Date;
  diasGracia: number;
}

function crearTx(opciones: { conPlan?: boolean } = {}) {
  return {
    empresa: {
      create: jest.fn((argumentos: { data: Datos }) => {
        void argumentos;
        return Promise.resolve({
          id: 'emp-1',
          nombre: 'El Roble',
          nit: '901.234.567-8',
        });
      }),
    },
    permiso: {
      findMany: jest.fn(() => Promise.resolve([{ id: 'perm-1', codigo: 'usuarios.ver' }])),
    },
    rol: {
      create: jest.fn((argumentos: { data: Datos }) => {
        void argumentos;
        return Promise.resolve({});
      }),
      findFirst: jest.fn(() => Promise.resolve({ id: 'rol-admin' })),
    },
    modulo: {
      createMany: jest.fn(() => Promise.resolve({ count: 1 })),
    },
    usuario: {
      create: jest.fn((argumentos: { data: Datos }) => {
        void argumentos;
        return Promise.resolve({ id: 'usr-1', email: 'ana@empresa.com' });
      }),
    },
    usuarioRol: {
      create: jest.fn((argumentos: { data: Datos }) => {
        void argumentos;
        return Promise.resolve({});
      }),
    },
    plan: {
      findUnique: jest.fn(() =>
        Promise.resolve(
          opciones.conPlan === false
            ? null
            : { id: 'plan-1', codigo: 'pro', nombre: 'Medio', diasGracia: 15 },
        ),
      ),
    },
    suscripcion: {
      create: jest.fn((argumentos: { data: DatosSuscripcion }) =>
        Promise.resolve({ id: 'sus-1', fechaFin: argumentos.data.fechaFin }),
      ),
    },
    historialSuscripcion: {
      create: jest.fn((argumentos: { data: Datos }) => {
        void argumentos;
        return Promise.resolve({});
      }),
    },
  };
}

const empresa = {
  nombre: 'El Roble',
  razonSocial: 'Distribuidora El Roble S.A.S.',
  nit: '901.234.567-8',
  direccion: 'Calle 93 No. 15-20',
  ciudad: 'Bogotá D.C.',
  departamento: 'Cundinamarca',
  representante: 'María Fernanda Gómez',
  correoDatos: 'privacidad@elroble.com',
};

const admin = {
  nombre: 'Ana Pérez',
  email: 'ana@empresa.com',
  passwordHash: 'hash',
  emailVerificado: true,
};

describe('AprovisionamientoService', () => {
  it('crea la empresa en estado ACTIVA con los datos legales', async () => {
    const tx = crearTx();
    const servicio = new AprovisionamientoService();

    await servicio.crear(tx as never, empresa, admin);

    const { data } = tx.empresa.create.mock.calls[0][0];
    expect(data.estado).toBe('ACTIVA');
    expect(data.razonSocial).toBe('Distribuidora El Roble S.A.S.');
    expect(data.representante).toBe('María Fernanda Gómez');
  });

  it('crea todos los roles del sistema y asigna Administrador al propietario', async () => {
    const tx = crearTx();
    const servicio = new AprovisionamientoService();

    await servicio.crear(tx as never, empresa, admin);

    expect(tx.rol.create).toHaveBeenCalledTimes(Object.keys(PERMISOS_POR_ROL_SISTEMA).length);
    expect(tx.usuario.create.mock.calls[0][0].data).toMatchObject({
      esPropietario: true,
      esSuperAdmin: false,
      email: 'ana@empresa.com',
    });
    expect(tx.usuarioRol.create).toHaveBeenCalledWith({
      data: { usuarioId: 'usr-1', rolId: 'rol-admin' },
    });
  });

  it('crea la suscripción de prueba de 7 días con el plan pro', async () => {
    const tx = crearTx();
    const servicio = new AprovisionamientoService();

    await servicio.crear(tx as never, empresa, admin);

    expect(tx.plan.findUnique).toHaveBeenCalledWith({
      where: { codigo: 'pro' },
      select: { id: true, codigo: true, nombre: true, diasGracia: true },
    });

    const suscripcion = tx.suscripcion.create.mock.calls[0][0].data;
    expect(suscripcion.estado).toBe('ACTIVA');
    expect(suscripcion.planId).toBe('plan-1');

    const dias = (suscripcion.fechaFin.getTime() - suscripcion.fechaInicio.getTime()) / 86_400_000;
    expect(dias).toBeCloseTo(DIAS_PRUEBA, 5);
  });

  it('deja rastro de la prueba en el historial', async () => {
    const tx = crearTx();
    const servicio = new AprovisionamientoService();

    await servicio.crear(tx as never, empresa, admin);

    expect(tx.historialSuscripcion.create).toHaveBeenCalledTimes(1);
    const historial = tx.historialSuscripcion.create.mock.calls[0][0].data;
    expect(historial).toMatchObject({
      empresaId: 'emp-1',
      estadoNuevo: 'ACTIVA',
      planNuevoId: 'plan-1',
      usuarioId: 'usr-1',
    });
    expect(String(historial.motivo)).toContain('7 días');
  });

  it('falla si el plan de prueba no está configurado', async () => {
    const tx = crearTx({ conPlan: false });
    const servicio = new AprovisionamientoService();

    await expect(servicio.crear(tx as never, empresa, admin)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
