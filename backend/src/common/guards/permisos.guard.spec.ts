import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermisosGuard } from './permisos.guard';

function contexto(user?: unknown): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function reflectorCon(requeridos: string[] | undefined): Reflector {
  return { getAllAndOverride: () => requeridos } as unknown as Reflector;
}

describe('PermisosGuard', () => {
  it('permite el acceso cuando el endpoint no exige permisos', () => {
    const guard = new PermisosGuard(reflectorCon(undefined));
    expect(guard.canActivate(contexto({ permisos: [] }))).toBe(true);
  });

  it('permite cuando el usuario posee todos los permisos requeridos', () => {
    const guard = new PermisosGuard(
      reflectorCon(['inventario.ver', 'inventario.operar']),
    );
    const user = {
      permisos: ['inventario.ver', 'inventario.operar', 'reportes.ver'],
    };
    expect(guard.canActivate(contexto(user))).toBe(true);
  });

  it('rechaza cuando al usuario le falta un permiso', () => {
    const guard = new PermisosGuard(
      reflectorCon(['inventario.ver', 'inventario.operar']),
    );
    const user = { permisos: ['inventario.ver'] };
    expect(() => guard.canActivate(contexto(user))).toThrow(ForbiddenException);
  });

  it('rechaza cuando no hay usuario autenticado', () => {
    const guard = new PermisosGuard(reflectorCon(['inventario.ver']));
    expect(() => guard.canActivate(contexto(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
