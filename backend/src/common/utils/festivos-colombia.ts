/**
 * Festivos nacionales de Colombia.
 *
 * Fuente: Ley 51 de 1983 (traslado de festivos al lunes siguiente) y
 * calendario oficial de la Superintendencia de Industria y Comercio.
 *
 * Los festivos de fecha fija que no se trasladan son: 1 de enero, 1 de mayo,
 * 20 de julio, 7 de agosto, 8 de diciembre y 25 de diciembre. Los demás se
 * llevan al lunes siguiente. A ellos se suman el Jueves Santo, el Viernes
 * Santo y los tres festivos que dependen de la Pascua (Ascension, Corpus
 * Christi y Sagrado Corazon), que tambien se trasladan al lunes.
 *
 * El calculo se hace con fechas UTC a mediodia para no depender de la zona
 * horaria del servidor.
 */

const FESTIVOS_FIJOS = [
  '01-01',
  '05-01',
  '07-20',
  '08-07',
  '12-08',
  '12-25',
] as const;

const FESTIVOS_EMILIANI = [
  '01-06',
  '03-19',
  '06-29',
  '08-15',
  '10-12',
  '11-01',
  '11-11',
] as const;

const MILISEGUNDOS_DIA = 24 * 60 * 60 * 1000;

/** Clave `AAAA-MM-DD` de una fecha representada en UTC. */
function clave(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * MILISEGUNDOS_DIA);
}

/** Traslada una fecha al lunes siguiente (Ley 51 de 1983). */
function lunesSiguiente(fecha: Date): Date {
  const diaSemana = fecha.getUTCDay();
  if (diaSemana === 1) return fecha;
  const dias = (8 - diaSemana) % 7;
  return sumarDias(fecha, dias === 0 ? 7 : dias);
}

function fechaFija(anio: number, mesDia: string): Date {
  const mes = Number(mesDia.slice(0, 2));
  const dia = Number(mesDia.slice(3));
  return new Date(Date.UTC(anio, mes - 1, dia, 12));
}

/**
 * Domingo de Pascua segun el algoritmo gregoriano de Meeus/Jones/Butcher.
 * Devuelve una fecha UTC a mediodia.
 */
export function domingoDePascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anio, mes - 1, dia, 12));
}

const cache = new Map<number, ReadonlySet<string>>();

/** Conjunto de festivos nacionales del ano, como claves `AAAA-MM-DD`. */
export function festivosDe(anio: number): ReadonlySet<string> {
  const existente = cache.get(anio);
  if (existente) return existente;

  const fechas = new Set<string>();
  const agregar = (fecha: Date) => fechas.add(clave(fecha));

  for (const mesDia of FESTIVOS_FIJOS) {
    agregar(fechaFija(anio, mesDia));
  }

  for (const mesDia of FESTIVOS_EMILIANI) {
    agregar(lunesSiguiente(fechaFija(anio, mesDia)));
  }

  const pascua = domingoDePascua(anio);
  agregar(sumarDias(pascua, -3)); // Jueves Santo
  agregar(sumarDias(pascua, -2)); // Viernes Santo
  agregar(lunesSiguiente(sumarDias(pascua, 39))); // Ascension
  agregar(lunesSiguiente(sumarDias(pascua, 60))); // Corpus Christi
  agregar(lunesSiguiente(sumarDias(pascua, 68))); // Sagrado Corazon

  cache.set(anio, fechas);
  return fechas;
}

/** Indica si la fecha (calendario UTC) es festivo nacional en Colombia. */
export function esFestivo(fecha: Date): boolean {
  return festivosDe(fecha.getUTCFullYear()).has(clave(fecha));
}
