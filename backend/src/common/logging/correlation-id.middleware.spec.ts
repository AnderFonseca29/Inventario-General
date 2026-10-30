import type { NextFunction, Request, Response } from 'express';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

describe('CorrelationIdMiddleware (hallazgo N)', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  function ejecutar(headers: Record<string, string>) {
    const req = { headers } as unknown as Request;
    const setHeader = jest.fn();
    const res = { setHeader } as unknown as Response;
    const next = jest.fn() as unknown as NextFunction;
    middleware.use(req, res, next);
    return { req, setHeader, next };
  }

  it('genera un identificador cuando la peticion no trae ninguno', () => {
    const { req, setHeader, next } = ejecutar({});
    expect(req.correlationId).toBeDefined();
    expect(req.correlationId.length).toBeGreaterThan(0);
    expect(setHeader).toHaveBeenCalledWith('X-Correlation-Id', req.correlationId);
    expect(next).toHaveBeenCalled();
  });

  it('reutiliza el identificador enviado por el cliente', () => {
    const { req } = ejecutar({ 'x-correlation-id': 'abc-123' });
    expect(req.correlationId).toBe('abc-123');
  });

  it('ignora un identificador vacio', () => {
    const { req } = ejecutar({ 'x-correlation-id': '   ' });
    expect(req.correlationId).not.toBe('   ');
    expect(req.correlationId.length).toBeGreaterThan(0);
  });

  it('genera identificadores distintos por peticion', () => {
    const a = ejecutar({}).req.correlationId;
    const b = ejecutar({}).req.correlationId;
    expect(a).not.toBe(b);
  });
});
