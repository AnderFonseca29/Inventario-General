import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISOS_ALGUNO_KEY } from '../decorators/permisos.decorator';
import { PermisosGuard } from './permisos.guard';

function contexto(user?: unknown): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

// Devuelve la lista de permisos segun la clave de metadata consultada.
function reflectorCon(requeridos?: string[], alguno?: string[]): Reflector {
  return {
    getAllAndOverride: (key: string) =>
      key === PERMISOS_ALGUNO_KEY ? alguno : requeridos,
  } as unknown as Reflector;
}

describe('PermisosGuard', () => {
  it('permite el acceso cuando el endpoint no exige permisos', () => {
    const guard = new PermisosGuard(reflectorCon());
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

  it('PermisosAlguno permite con cualquiera de los permisos listados', () => {
    const guard = new PermisosGuard(
      reflectorCon(undefined, ['cargues.ver.propios', 'cargues.ver.todos']),
    );
    expect(
      guard.canActivate(contexto({ permisos: ['cargues.ver.todos'] })),
    ).toBe(true);
    expect(
      guard.canActivate(contexto({ permisos: ['cargues.ver.propios'] })),
    ).toBe(true);
  });

  it('PermisosAlguno rechaza si no tiene ninguno de los permisos', () => {
    const guard = new PermisosGuard(
      reflectorCon(undefined, ['cargues.ver.propios', 'cargues.ver.todos']),
    );
    expect(() =>
      guard.canActivate(contexto({ permisos: ['reportes.ver'] })),
    ).toThrow(ForbiddenException);
  });

  it('el superadministrador pasa con cualquier combinacion de permisos', () => {
    const guard = new PermisosGuard(
      reflectorCon(['inventario.ver'], ['cargues.ver.todos']),
    );
    expect(
      guard.canActivate(contexto({ esSuperAdmin: true, permisos: [] })),
    ).toBe(true);
  });

  it('exige ambos grupos cuando se combinan @Permisos y @PermisosAlguno', () => {
    const guard = new PermisosGuard(
      reflectorCon(['inventario.operar'], ['cargues.ver.propios']),
    );
    const user = { permisos: ['inventario.operar'] };
    expect(() => guard.canActivate(contexto(user))).toThrow(ForbiddenException);
    expect(
      guard.canActivate(
        contexto({ permisos: ['inventario.operar', 'cargues.ver.propios'] }),
      ),
    ).toBe(true);
  });
});
