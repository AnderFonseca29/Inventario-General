import type { EstadoSuscripcion } from '@prisma/client';

/**
 * Regla del periodo de prueba (decision P1):
 *  - 3 dias de prueba completa.
 *  - 1 dia mas de gracia, con aviso, antes de bloquear.
 *
 * El calculo se hace al leer, no con un cron: asi el estado siempre es coherente
 * aunque el servidor haya estado apagado (plan gratuito de Render) justo el dia
 * del vencimiento.
 */
export const DIAS_PRUEBA = 3;
export const DIAS_GRACIA = 1;

const DIA_MS = 24 * 60 * 60 * 1000;

export type EstadoEmpresaSuscripcion =
  | 'SIN_PLAN'
  | 'ACTIVA'
  | 'EN_GRACIA'
  | 'VENCIDA'
  | 'SUSPENDIDA'
  | 'CANCELADA';

export interface SuscripcionParaCalcular {
  estado: EstadoSuscripcion;
  fechaInicio: Date;
  fechaFin: Date | null;
  diasGracia: number;
}

export interface EstadoCalculado {
  estado: EstadoEmpresaSuscripcion;
  /** Si es true, el guard responde 402 y la UI muestra la pantalla de bloqueo. */
  bloqueado: boolean;
  /** Dias enteros que quedan del periodo; 0 en gracia o vencido. */
  diasRestantes: number | null;
  /** Ultimo instante permitido (fin + dias de gracia). */
  finGracia: Date | null;
}

/**
 * Sin suscripcion no se bloquea: hay empresas anteriores al periodo de prueba
 * que nunca tuvieron una. Se bloquea cuando existe una suscripcion y su plazo
 * (incluida la gracia) ya paso.
 *
 * PENDIENTE se trata como ACTIVA: mientras no exista una pasarela de pago, la
 * suscripcion de prueba nace ACTIVA y PENDIENTE solo aparece en flujos futuros.
 */
export function calcularEstadoSuscripcion(
  suscripcion: SuscripcionParaCalcular | null,
  ahora: Date = new Date(),
): EstadoCalculado {
  if (!suscripcion) {
    return {
      estado: 'SIN_PLAN',
      bloqueado: false,
      diasRestantes: null,
      finGracia: null,
    };
  }

  if (suscripcion.estado === 'CANCELADA' || suscripcion.estado === 'SUSPENDIDA') {
    return {
      estado: suscripcion.estado,
      bloqueado: true,
      diasRestantes: null,
      finGracia: null,
    };
  }

  if (!suscripcion.fechaFin) {
    return {
      estado: 'ACTIVA',
      bloqueado: false,
      diasRestantes: null,
      finGracia: null,
    };
  }

  const fin = suscripcion.fechaFin.getTime();
  const diasGracia = Math.max(0, Math.trunc(suscripcion.diasGracia ?? 0));
  const finGracia = new Date(fin + diasGracia * DIA_MS);
  const momento = ahora.getTime();

  if (momento > finGracia.getTime()) {
    return {
      estado: 'VENCIDA',
      bloqueado: true,
      diasRestantes: 0,
      finGracia,
    };
  }

  if (momento > fin) {
    return {
      estado: 'EN_GRACIA',
      bloqueado: false,
      diasRestantes: 0,
      finGracia,
    };
  }

  return {
    estado: 'ACTIVA',
    bloqueado: false,
    diasRestantes: Math.max(0, Math.ceil((fin - momento) / DIA_MS)),
    finGracia,
  };
}
