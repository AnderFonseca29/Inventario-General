import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { CsrfGuard } from './csrf.guard';

describe('CsrfGuard', () => {
  const guard = new CsrfGuard();

  function contexto(req: {
    method: string;
    authorization?: string;
    solicitado?: string;
  }): ExecutionContext {
    const request = {
      method: req.method,
      headers: req.authorization
        ? { authorization: req.authorization }
        : {},
      get: (nombre: string) =>
        nombre.toLowerCase() === 'x-requested-with'
          ? req.solicitado
          : undefined,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request as unknown as Request,
      }),
    } as unknown as ExecutionContext;
  }

  it('deja pasar metodos seguros', () => {
    expect(guard.canActivate(contexto({ method: 'GET' }))).toBe(true);
    expect(guard.canActivate(contexto({ method: 'OPTIONS' }))).toBe(true);
  });

  it('rechaza un POST sin la cabecera CSRF', () => {
    expect(() => guard.canActivate(contexto({ method: 'POST' }))).toThrow(
      ForbiddenException,
    );
  });

  it('acepta un POST del navegador con X-Requested-With', () => {
    expect(
      guard.canActivate(
        contexto({ method: 'POST', solicitado: 'XMLHttpRequest' }),
      ),
    ).toBe(true);
  });

  it('no exige la cabecera a clientes que usan Bearer', () => {
    expect(
      guard.canActivate(
        contexto({ method: 'POST', authorization: 'Bearer token' }),
      ),
    ).toBe(true);
  });
});
