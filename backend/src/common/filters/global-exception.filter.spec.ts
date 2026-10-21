import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GlobalExceptionFilter } from './global-exception.filter';

interface HostFalso {
  host: ArgumentsHost;
  json: jest.Mock;
  status: jest.Mock;
}

function hostConUrl(url: string): HostFalso {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const respuesta = { status };
  const host = {
    switchToHttp: () => ({
      getResponse: () => respuesta,
      getRequest: () => ({ url, method: 'GET' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, json, status };
}

describe('GlobalExceptionFilter (hallazgo L)', () => {
  let filtro: GlobalExceptionFilter;

  beforeEach(() => {
    filtro = new GlobalExceptionFilter();
  });

  it('traduce P2002 (unico) a 409', () => {
    const error = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: '6',
    });
    expect(filtro.comoHttpException(error)!.getStatus()).toBe(HttpStatus.CONFLICT);
  });

  it('traduce P2025 (no existe) a 404', () => {
    const error = new Prisma.PrismaClientKnownRequestError('no existe', {
      code: 'P2025',
      clientVersion: '6',
    });
    expect(filtro.comoHttpException(error)!.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('traduce P2003 (FK) a 409', () => {
    const error = new Prisma.PrismaClientKnownRequestError('fk', {
      code: 'P2003',
      clientVersion: '6',
    });
    expect(filtro.comoHttpException(error)!.getStatus()).toBe(HttpStatus.CONFLICT);
  });

  it('devuelve null para errores no traducibles', () => {
    expect(filtro.comoHttpException(new Error('boom'))).toBeNull();
  });

  it('preserva una HttpException tal cual', () => {
    const original = new HttpException('no autorizado', HttpStatus.UNAUTHORIZED);
    expect(filtro.comoHttpException(original)).toBe(original);
  });

  it('responde con la forma estandar de error', () => {
    const { host, json, status } = hostConUrl('/api/catalogos/categorias');

    filtro.catch(new HttpException('fallo', HttpStatus.BAD_REQUEST), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/api/catalogos/categorias',
        error: 'BAD_REQUEST',
      }),
    );
  });

  it('nunca filtra el detalle interno de un error desconocido', () => {
    const { host, json } = hostConUrl('/api/x');

    filtro.catch(new Error('detalle interno secreto'), host);

    const cuerpo = json.mock.calls[0][0] as { message: string };
    expect(cuerpo.message).not.toContain('detalle interno secreto');
  });
});
