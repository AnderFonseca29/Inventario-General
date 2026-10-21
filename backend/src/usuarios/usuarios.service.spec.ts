import { ForbiddenException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import type { ActorUsuarios } from './usuarios.service';

/**
 * Pruebas de la proteccion contra escalada de privilegios (hallazgo E).
 *
 * El mock de Prisma solo expone lo que usan las rutas bajo prueba:
 *  - usuarios.service.crear -> validarRolesDeEmpresa (rol.findMany)
 *  - usuarios.service.actualizar/desactivar/resetPassword -> exigirNoSuperaAlObjetivo
 */

interface MockOptions {
  rolesDeEmpresa?: {
    id: string;
    nombre: string;
    permisos: { permiso: { codigo: string } }[];
  }[];
  permisosDelObjetivo?: string[];
  objetoEsSuperAdmin?: boolean;
}

function crearServicio(opciones: MockOptions = {}) {
  const objetivo = {
    id: 'objetivo-1',
    nombre: 'Objetivo',
    email: 'objetivo@x.com',
    activo: true,
    esSuperAdmin: opciones.objetoEsSuperAdmin ?? false,
    empresaId: 'empresa-1',
    ultimoLogin: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    roles: [] as { rol: { id: string; nombre: string } }[],
    passwordHash: 'hash',
  };
  const prisma = {
    rol: {
      findMany: jest.fn().mockResolvedValue(opciones.rolesDeEmpresa ?? []),
    },
    usuario: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(objetivo),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    usuarioRol: {
      findMany: jest.fn().mockResolvedValue(
        (opciones.permisosDelObjetivo ?? []).map((codigo) => ({
          rol: { permisos: [{ permiso: { codigo } }] },
        })),
      ),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    refreshToken: { updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const suscripciones = { limites: jest.fn() };

  const servicio = new UsuariosService(
    prisma as never,
    auditoria as never,
    suscripciones as never,
  );
  return { servicio, prisma };
}

const actorLimitado: ActorUsuarios = {
  id: 'actor-1',
  permisos: ['usuarios.ver', 'usuarios.crear', 'usuarios.editar'],
  esSuperAdmin: false,
};

const rolAdministrador = {
  id: 'rol-admin',
  nombre: 'Administrador',
  permisos: [
    { permiso: { codigo: 'usuarios.ver' } },
    { permiso: { codigo: 'roles.administrar' } },
    { permiso: { codigo: 'inventario.ajustar' } },
  ],
};

describe('UsuariosService - proteccion contra escalada (hallazgo E)', () => {
  it('rechaza crear un usuario con un rol que tiene permisos que el actor no posee', async () => {
    const { servicio } = crearServicio({
      rolesDeEmpresa: [rolAdministrador],
    });
    await expect(
      servicio.crear(
        'empresa-1',
        {
          nombre: 'X',
          email: 'x@x.com',
          password: 'PruebaX12345',
          roles: ['rol-admin'],
        },
        actorLimitado,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('permite crear un usuario con un rol cuyos permisos son subconjunto del actor', async () => {
    const { servicio, prisma } = crearServicio({
      rolesDeEmpresa: [
        {
          id: 'rol-basico',
          nombre: 'Basico',
          permisos: [
            { permiso: { codigo: 'usuarios.ver' } },
            { permiso: { codigo: 'usuarios.editar' } },
          ],
        },
      ],
    });
    // El flujo real continua en $transaction; basta confirmar que paso la
    // validacion de roles y llego a la transaccion.
    prisma.$transaction.mockRejectedValue(new Error('LLEGO_A_TRANSACCION'));
    await expect(
      servicio.crear(
        'empresa-1',
        {
          nombre: 'Y',
          email: 'y@y.com',
          password: 'PruebaY12345',
          roles: ['rol-basico'],
        },
        actorLimitado,
      ),
    ).rejects.toThrow('LLEGO_A_TRANSACCION');
  });

  it('rechaza resetear la contrasena de un usuario con mas privilegios', async () => {
    const { servicio } = crearServicio({
      permisosDelObjetivo: ['usuarios.ver', 'roles.administrar'],
    });
    await expect(
      servicio.resetPassword(
        'empresa-1',
        'objetivo-1',
        { newPassword: 'PruebaNueva12345' },
        actorLimitado,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rechaza desactivar a un usuario con mas privilegios', async () => {
    const { servicio } = crearServicio({
      permisosDelObjetivo: ['inventario.ajustar'],
    });
    await expect(
      servicio.desactivar('empresa-1', 'objetivo-1', actorLimitado),
    ).rejects.toThrow(ForbiddenException);
  });

  it('permite operar sobre un usuario con iguales o menores privilegios', async () => {
    const { servicio, prisma } = crearServicio({
      permisosDelObjetivo: ['usuarios.ver'],
    });
    prisma.$transaction.mockResolvedValue([]);
    // Solo comprobamos que la validacion de privilegios NO lanza: la operacion
    // llega a la transaccion.
    await expect(
      servicio.resetPassword(
        'empresa-1',
        'objetivo-1',
        { newPassword: 'PruebaNueva12345' },
        actorLimitado,
      ),
    ).resolves.toEqual({ ok: true });
  });

  it('el superadmin no queda sujeto a la validacion', async () => {
    const { servicio, prisma } = crearServicio({});
    prisma.$transaction.mockResolvedValue([]);
    const superActor: ActorUsuarios = { ...actorLimitado, esSuperAdmin: true };
    await expect(
      servicio.desactivar('empresa-1', 'objetivo-1', superActor),
    ).resolves.toEqual({ ok: true });
  });
});
