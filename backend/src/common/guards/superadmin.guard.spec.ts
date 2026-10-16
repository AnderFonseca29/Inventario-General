import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SuperAdminGuard } from './superadmin.guard';

function contexto(user?: unknown): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function reflectorCon(soloSuper: boolean | undefined): Reflector {
  return { getAllAndOverride: () => soloSuper } as unknown as Reflector;
}

describe('SuperAdminGuard', () => {
  it('no interviene cuando el endpoint no es exclusivo de plataforma', () => {
    const guard = new SuperAdminGuard(reflectorCon(undefined));
    expect(guard.canActivate(contexto({ esSuperAdmin: false }))).toBe(true);
  });

  it('permite al superadmin en endpoints de plataforma', () => {
    const guard = new SuperAdminGuard(reflectorCon(true));
    expect(guard.canActivate(contexto({ esSuperAdmin: true }))).toBe(true);
  });

  it('rechaza a usuarios de empresa en endpoints de plataforma', () => {
    const guard = new SuperAdminGuard(reflectorCon(true));
    expect(() => guard.canActivate(contexto({ esSuperAdmin: false }))).toThrow(
      ForbiddenException,
    );
  });
});
