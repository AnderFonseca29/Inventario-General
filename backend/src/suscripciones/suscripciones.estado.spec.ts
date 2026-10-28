import { calcularEstadoSuscripcion } from './suscripciones.estado';

const inicio = new Date('2026-01-01T00:00:00.000Z');
const fin = new Date('2026-01-04T00:00:00.000Z'); // inicio + 3 dias

function suscripcion(extra: Record<string, unknown> = {}) {
  return {
    estado: 'ACTIVA' as const,
    fechaInicio: inicio,
    fechaFin: fin,
    diasGracia: 1,
    ...extra,
  };
}

describe('calcularEstadoSuscripcion', () => {
  it('sin suscripcion no bloquea (empresas anteriores a la prueba)', () => {
    const estado = calcularEstadoSuscripcion(null);
    expect(estado.estado).toBe('SIN_PLAN');
    expect(estado.bloqueado).toBe(false);
    expect(estado.diasRestantes).toBeNull();
  });

  it('el primer dia quedan los 3 dias de prueba', () => {
    const estado = calcularEstadoSuscripcion(
      suscripcion(),
      new Date('2026-01-01T00:00:00.000Z'),
    );
    expect(estado.estado).toBe('ACTIVA');
    expect(estado.diasRestantes).toBe(3);
    expect(estado.bloqueado).toBe(false);
  });

  it('redondea hacia arriba los dias que faltan', () => {
    const estado = calcularEstadoSuscripcion(
      suscripcion(),
      new Date('2026-01-03T12:00:00.000Z'),
    );
    expect(estado.diasRestantes).toBe(1);
  });

  it('justo al vencer la prueba pasa al dia de gracia sin bloquear', () => {
    const estado = calcularEstadoSuscripcion(
      suscripcion(),
      new Date('2026-01-04T00:00:00.001Z'),
    );
    expect(estado.estado).toBe('EN_GRACIA');
    expect(estado.bloqueado).toBe(false);
    expect(estado.diasRestantes).toBe(0);
    expect(estado.finGracia?.toISOString()).toBe('2026-01-05T00:00:00.000Z');
  });

  it('al terminar la gracia queda vencida y bloqueada', () => {
    const estado = calcularEstadoSuscripcion(
      suscripcion(),
      new Date('2026-01-05T00:00:00.001Z'),
    );
    expect(estado.estado).toBe('VENCIDA');
    expect(estado.bloqueado).toBe(true);
  });

  it('una suscripcion sin fecha fin no caduca', () => {
    const estado = calcularEstadoSuscripcion(
      suscripcion({ fechaFin: null }),
      new Date('2030-01-01T00:00:00.000Z'),
    );
    expect(estado.estado).toBe('ACTIVA');
    expect(estado.diasRestantes).toBeNull();
  });

  it('suspender o cancelar bloquea de inmediato', () => {
    for (const estadoGuardado of ['SUSPENDIDA', 'CANCELADA'] as const) {
      const estado = calcularEstadoSuscripcion(
        suscripcion({ estado: estadoGuardado }),
        new Date('2026-01-02T00:00:00.000Z'),
      );
      expect(estado.estado).toBe(estadoGuardado);
      expect(estado.bloqueado).toBe(true);
    }
  });

  it('una gracia de 0 dias bloquea en cuanto vence', () => {
    const estado = calcularEstadoSuscripcion(
      suscripcion({ diasGracia: 0 }),
      new Date('2026-01-04T00:00:00.001Z'),
    );
    expect(estado.estado).toBe('VENCIDA');
    expect(estado.bloqueado).toBe(true);
  });
});
