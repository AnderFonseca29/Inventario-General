import { ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

function contextoCon(url: string, usuario?: unknown): ExecutionContext {
  const respuesta = { statusCode: 200 };
  const peticion = {
    method: 'GET',
    url,
    originalUrl: url,
    ip: '10.0.0.1',
    headers: {},
    user: usuario,
  };
  return {
    switchToHttp: () => ({
      getRequest: () => peticion,
      getResponse: () => respuesta,
    }),
  } as unknown as ExecutionContext;
}

describe('LoggingInterceptor (hallazgo N)', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('deja pasar la respuesta sin modificarla', (done) => {
    const siguiente = { handle: () => of('ok') };
    interceptor
      .intercept(contextoCon('/api/catalogos'), siguiente)
      .subscribe((valor) => {
        expect(valor).toBe('ok');
        done();
      });
  });

  it('no rompe cuando la peticion no tiene usuario ni empresa', (done) => {
    const siguiente = { handle: () => of('ok') };
    interceptor
      .intercept(contextoCon('/api/health'), siguiente)
      .subscribe(() => {
        expect(true).toBe(true);
        done();
      });
  });

  it('propaga el error del handler', (done) => {
    const siguiente = { handle: () => throwError(() => new Error('fallo')) };
    interceptor.intercept(contextoCon('/api/x'), siguiente).subscribe({
      error: (err: Error) => {
        expect(err.message).toBe('fallo');
        done();
      },
    });
  });
});
