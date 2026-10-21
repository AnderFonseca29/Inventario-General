/**
 * Formateo de fechas en la zona horaria del negocio (hallazgo T).
 *
 * El backend responde en UTC (ISO 8601) y el negocio opera en Colombia
 * (`America/Bogota`, UTC-5). Sin fijar la zona, `toLocaleString` usa la zona
 * del navegador: el mismo registro se mostraba con horas distintas segun
 * donde se abriera la aplicacion, y los filtros por dia incluian o
 * excluian registros del dia equivocado.
 */

/** Zona horaria de operacion del negocio. */
export const ZONA_HORARIA = 'America/Bogota';

const opciones: Intl.DateTimeFormatOptions = {
  timeZone: ZONA_HORARIA,
};

export function formatearFechaHora(valor: string | Date | null | undefined): string {
  if (!valor) return '-';
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '-';
  return fecha.toLocaleString('es-CO', {
    ...opciones,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatearFecha(valor: string | Date | null | undefined): string {
  if (!valor) return '-';
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '-';
  return fecha.toLocaleDateString('es-CO', {
    ...opciones,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Devuelve el valor de un `input[type=date]` ya convertido a fecha local de
 * Colombia. El input entrega texto `YYYY-MM-DD` sin zona, que `new Date`
 * interpretaria como UTC (y por tanto como el dia anterior en Colombia).
 */
export function fechaDesdeInput(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
  if (!coincidencia) {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
  const [, anio, mes, dia] = coincidencia;
  return new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia),
    0,
    0,
    0,
    0,
  );
}
