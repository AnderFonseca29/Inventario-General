import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { exigirEmpresa, TenantGuard } from './tenant.guard';
import type { AuthenticatedUser } from '../types/authenticated-user';

function contexto(
  user: AuthenticatedUser | undefined,
  query: Record<string, string> = {},
): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user, query }),
    }),
  } as unknown as ExecutionContext;
}

function reflectorCon(valores: {
  publico?: boolean;
  tenant?: boolean;
}): Reflector {
  return {
    getAllAndOverride: (clave: string) => {
      if (clave === 'isPublic') return valores.publico;
      if (clave === 'tenant_requerido') return valores.tenant;
      return undefined;
    },
  } as unknown as Reflector;
}

const usuarioEmpresa: AuthenticatedUser = {
  id: 'u1',
  email: 'u@empresa.com',
  empresaId: 'e1',
  esSuperAdmin: false,
  permisos: [],
};

const superAdmin: AuthenticatedUser = {
  id: 's1',
  email: 'sa@plataforma.com',
  empresaId: null,
  esSuperAdmin: true,
  permisos: [],
};

describe('TenantGuard (hallazgo K)', () => {
  it('deja pasar rutas publicas', () => {
    const guard = new TenantGuard(
      reflectorCon({ publico: true, tenant: true }),
    );
    expect(guard.canActivate(contexto(undefined))).toBe(true);
  });

  it('deja pasar endpoints de plataforma no marcados como tenant', () => {
    const guard = new TenantGuard(reflectorCon({ tenant: false }));
    expect(guard.canActivate(contexto(superAdmin))).toBe(true);
  });

  it('permite al usuario con empresa', () => {
    const guard = new TenantGuard(reflectorCon({ tenant: true }));
    expect(guard.canActivate(contexto(usuarioEmpresa))).toBe(true);
  });

  it('bloquea al superadmin sin empresaId explicito', () => {
    const guard = new TenantGuard(reflectorCon({ tenant: true }));
    expect(() => guard.canActivate(contexto(superAdmin))).toThrow(
      ForbiddenException,
    );
  });

  it('bloquea al superadmin aunque declare empresaId por query', () => {
    const guard = new TenantGuard(reflectorCon({ tenant: true }));
    expect(() =>
      guard.canActivate(contexto(superAdmin, { empresaId: 'e9' })),
    ).toThrow(ForbiddenException);
  });

  it('exigirEmpresa devuelve la empresa del usuario', () => {
    expect(exigirEmpresa(usuarioEmpresa)).toBe('e1');
  });

  it('exigirEmpresa rechaza al superadmin sin empresa', () => {
    expect(() => exigirEmpresa(superAdmin)).toThrow(ForbiddenException);
  });

  it('exigirEmpresa rechaza al usuario sin empresa que no es superadmin', () => {
    const usuarioSinEmpresa: AuthenticatedUser = {
      ...usuarioEmpresa,
      empresaId: null,
    };
    expect(() => exigirEmpresa(usuarioSinEmpresa)).toThrow(ForbiddenException);
  });
});
