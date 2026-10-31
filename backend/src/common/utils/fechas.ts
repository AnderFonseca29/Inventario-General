/**
 * Normalizacion de fechas y zona horaria (hallazgo T).
 *
 * El backend guarda todo en UTC (columnas `timestamptz` de Prisma), pero el
 * negocio opera en Colombia (`America/Bogota`, UTC-5). Sin normalizacion
 * explicita aparecian dos problemas:
 *
 * 1. Un filtro por fecha, `new Date('2026-01-15')`, se interpreta como
 *    medianoche **UTC**, que en Colombia es el 14 de enero a las 19:00. Los
 *    filtros `desde`/`hasta` incluian o excluian registros del dia
 *    equivocado.
 * 2. Fechas sin hora (como `fechaInicio` de una membresia) se interpretaban
 *    en UTC, desplazando la vigencia un dia hacia adelante.
 *
 * Aqui se centraliza el criterio: las fechas sin hora se toman como
 * medianoche **hora Colombia** y se convierten a UTC; las fechas con hora y
 * zona explicita se respetan tal cual.
 */

import { festivosDe } from './festivos-colombia';

/** Zona horaria de operacion del negocio. */
export const ZONA_HORARIA = 'America/Bogota';

const REGEX_FECHA_SIN_HORA = /^\d{4}-\d{2}-\d{2}$/;
const REGEX_FECHA_HORA_SIN_ZONA = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/**
 * Desplazamiento de la zona horaria (en minutos) respecto a UTC para el
 * instante dado. Colombia no aplica horario de verano, pero se calcula en
 * tiempo real para no depender de esa suposicion.
 */
function desplazamientoZona(instante: Date): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(instante);

  const valor = (tipo: string): number => {
    const parte = partes.find((p) => p.type === tipo);
    return parte ? Number(parte.value) : 0;
  };

  const hora = valor('hour') % 24;
  const comoUtc = Date.UTC(
    valor('year'),
    valor('month') - 1,
    valor('day'),
    hora,
    valor('minute'),
    valor('second'),
  );
  return Math.round((comoUtc - instante.getTime()) / 60000);
}

/**
 * Convierte una fecha/hora de la zona de Colombia a su instante UTC.
 * Ajusta dos veces para resolver el instante exacto en el borde del dia.
 */
function utcDesdeHoraLocal(
  anio: number,
  mes: number,
  dia: number,
  horas = 0,
  minutos = 0,
  segundos = 0,
  milisegundos = 0,
): Date {
  const aproximado = new Date(
    Date.UTC(anio, mes - 1, dia, horas, minutos, segundos, milisegundos),
  );
  const desplazamiento = desplazamientoZona(aproximado);
  const corregido = new Date(aproximado.getTime() - desplazamiento * 60000);
  const ajuste = desplazamientoZona(corregido);
  if (ajuste === desplazamiento) return corregido;
  return new Date(aproximado.getTime() - ajuste * 60000);
}

/**
 * Convierte la entrada a un instante UTC.
 *
 * - Sin hora (`2026-01-15`): medianoche de ese dia en Colombia.
 * - Con hora sin zona (`2026-01-15T08:30`): esa hora en Colombia.
 * - Con zona u offset (`2026-01-15T08:30:00.000Z` o `...-05:00`): se
 *   respeta tal cual.
 *
 * Devuelve `undefined` si la entrada no es una fecha valida.
 */
export function aInstanteUtc(entrada: unknown): Date | undefined {
  if (entrada instanceof Date) {
    return Number.isNaN(entrada.getTime()) ? undefined : entrada;
  }
  if (typeof entrada !== 'string') return undefined;

  const texto = entrada.trim();
  if (texto === '') return undefined;

  if (REGEX_FECHA_SIN_HORA.test(texto)) {
    const [anio, mes, dia] = texto.split('-').map(Number);
    return utcDesdeHoraLocal(anio, mes, dia);
  }

  if (REGEX_FECHA_HORA_SIN_ZONA.test(texto)) {
    const [fecha, hora] = texto.split(/[T ]/);
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const [horas, minutos, segundosConDecimal] = hora.split(':');
    const segundos = Number(segundosConDecimal ?? 0);
    const milisegundos = segundosConDecimal
      ? Math.round((segundos % 1) * 1000)
      : 0;
    return utcDesdeHoraLocal(
      anio,
      mes,
      dia,
      Number(horas),
      Number(minutos),
      Math.floor(segundos),
      milisegundos,
    );
  }

  const conZona = new Date(texto);
  return Number.isNaN(conZona.getTime()) ? undefined : conZona;
}

/**
 * Instante UTC del final del dia indicado en hora Colombia.
 * Se usa para el limite superior de los filtros `hasta`, de modo que el dia
 * completo quede incluido.
 */
export function finDelDiaUtc(entrada: unknown): Date | undefined {
  if (typeof entrada !== 'string') return aInstanteUtc(entrada);
  const texto = entrada.trim();
  if (!REGEX_FECHA_SIN_HORA.test(texto)) return aInstanteUtc(entrada);
  const [anio, mes, dia] = texto.split('-').map(Number);
  return utcDesdeHoraLocal(anio, mes, dia, 23, 59, 59, 999);
}

/**
 * Suma dias habiles a una fecha y devuelve el final de ese dia en hora
 * Colombia. No cuenta sabados, domingos ni festivos nacionales
 * (Ley 51 de 1983), porque los plazos legales de PQR se cuentan en dias
 * habiles.
 */
export function sumarDiasHabiles(desde: Date, dias: number): Date {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(desde);
  const valor = (tipo: string): number =>
    Number(partes.find((parte) => parte.type === tipo)?.value ?? 0);

  let cursor = new Date(
    Date.UTC(valor('year'), valor('month') - 1, valor('day'), 12),
  );
  const anio = valor('year');
  // La suma puede cruzar de ano (por ejemplo, radicado el 20 de diciembre).
  const festivos = new Set([
    ...festivosDe(anio),
    ...festivosDe(anio + 1),
  ]);
  let sumados = 0;
  const total = Math.max(0, Math.trunc(dias));
  while (sumados < total) {
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    const diaSemana = cursor.getUTCDay();
    if (
      diaSemana !== 0 &&
      diaSemana !== 6 &&
      !festivos.has(cursor.toISOString().slice(0, 10))
    ) {
      sumados += 1;
    }
  }

  return utcDesdeHoraLocal(
    cursor.getUTCFullYear(),
    cursor.getUTCMonth() + 1,
    cursor.getUTCDate(),
    23,
    59,
    59,
    999,
  );
}
