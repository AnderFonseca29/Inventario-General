import { ForbiddenException } from '@nestjs/common';
import { RolesService } from './roles.service';
import type { ActorRoles } from './roles.service';

/**
 * Pruebas de la proteccion contra escalada de privilegios (hallazgo E) en roles:
 * el actor no puede crear/modificar/eliminar roles con permisos que no posee.
 */

const actorLimitado: ActorRoles = {
  id: 'actor-1',
  permisos: ['roles.ver', 'roles.administrar'],
  esSuperAdmin: false,
};

function crearServicio(rolExistente?: {
  id: string;
  nombre: string;
  esSistema: boolean;
  permisos: { permiso: { codigo: string } }[];
}) {
  const prisma = {
    rol: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    permiso: { findMany: jest.fn().mockResolvedValue([]) },
    rolPermiso: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    usuarioRol: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(),
  };
  const auditoria = { registrar: jest.fn() };
  const permisosCache = { invalidar: jest.fn(), invalidarVarios: jest.fn() };
  const servicio = new RolesService(prisma as never, auditoria as never, permisosCache as never);
  if (rolExistente) {
    jest.spyOn(servicio, 'obtener').mockResolvedValue(rolExistente as never);
  }
  return { servicio, prisma, permisosCache };
}

describe('RolesService - proteccion contra escalada (hallazgo E)', () => {
  it('rechaza crear un rol con permisos que el actor no posee', async () => {
    const { servicio } = crearServicio();
    await expect(
      servicio.crear(
        'empresa-1',
        {
          nombre: 'Rol escalado',
          descripcion: 'x',
          permisos: ['roles.administrar', 'usuarios.crear', 'inventario.ajustar'],
        },
        actorLimitado,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('permite crear un rol con permisos que el actor si posee', async () => {
    const { servicio, prisma } = crearServicio();
    prisma.permiso.findMany.mockResolvedValue([
      { id: 'p1', codigo: 'roles.ver' },
      { id: 'p2', codigo: 'roles.administrar' },
    ]);
    prisma.rol.create.mockResolvedValue({
      id: 'r1',
      nombre: 'Rol valido',
      permisos: [],
    });
    await expect(
      servicio.crear(
        'empresa-1',
        { nombre: 'Rol valido', descripcion: 'x', permisos: ['roles.ver'] },
        actorLimitado,
      ),
    ).resolves.toMatchObject({ id: 'r1' });
  });

  it('rechaza modificar un rol que contiene permisos que el actor no posee', async () => {
    const { servicio } = crearServicio({
      id: 'r-admin',
      nombre: 'Administrador',
      esSistema: false,
      permisos: [
        { permiso: { codigo: 'roles.ver' } },
        { permiso: { codigo: 'inventario.ajustar' } },
      ],
    });
    await expect(
      servicio.actualizar('empresa-1', 'r-admin', { descripcion: 'cambio' }, actorLimitado),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rechaza eliminar un rol que contiene permisos que el actor no posee', async () => {
    const { servicio } = crearServicio({
      id: 'r-admin',
      nombre: 'Administrador',
      esSistema: false,
      permisos: [{ permiso: { codigo: 'inventario.ajustar' } }],
    });
    await expect(servicio.eliminar('empresa-1', 'r-admin', actorLimitado)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('el superadmin no queda sujeto a la validacion', async () => {
    const { servicio, prisma } = crearServicio();
    prisma.permiso.findMany.mockResolvedValue([
      { id: 'p1', codigo: 'roles.administrar' },
      { id: 'p2', codigo: 'usuarios.crear' },
    ]);
    prisma.rol.create.mockResolvedValue({
      id: 'r1',
      nombre: 'X',
      permisos: [],
    });
    const superActor: ActorRoles = { ...actorLimitado, esSuperAdmin: true };
    await expect(
      servicio.crear(
        'empresa-1',
        {
          nombre: 'X',
          descripcion: 'x',
          permisos: ['usuarios.crear'],
        },
        superActor,
      ),
    ).resolves.toMatchObject({ id: 'r1' });
  });

  it('invalida la cache de permisos de los usuarios del rol al actualizarlo (hallazgo R)', async () => {
    const { servicio, prisma, permisosCache } = crearServicio({
      id: 'r-admin',
      nombre: 'Administrador',
      esSistema: false,
      permisos: [],
    });
    prisma.usuarioRol.findMany.mockResolvedValue([{ usuarioId: 'u1' }, { usuarioId: 'u2' }]);
    prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
      Promise.resolve(cb(prisma)),
    );
    prisma.rol.update.mockResolvedValue({ id: 'r-admin' });

    await servicio.actualizar(
      'empresa-1',
      'r-admin',
      { permisos: [] },
      { ...actorLimitado, esSuperAdmin: true },
    );

    expect(permisosCache.invalidarVarios).toHaveBeenCalledWith(['u1', 'u2']);
  });
});
