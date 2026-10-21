/**
 * Conversion de texto numerico a numero (hallazgo S).
 *
 * Los formularios del frontend manejan los importes como texto para no perder
 * precision mientras se escribe, y el usuario digita en formato es-CO
 * ("1.234,56"). `Number('1.234,56')` devuelve `NaN`, por lo que antes esos
 * valores se enviaban como `NaN` y el backend los rechazaba.
 *
 * `aNumero` centraliza el criterio: acepta numero o texto, en formato es-CO
 * ("1.234,56", "12,5") o plano ("1234.56", "12.5"), y devuelve `undefined`
 * cuando el contenido no es un numero valido.
 */

/** Decimales admitidos, alineados con `Decimal(18,4)` de Prisma. */
export const DECIMALES_MAXIMOS = 4;

const REGEX_NUMERO_ES_CO = /^-?\d{1,3}(\.\d{3})*,\d+$/;
const REGEX_NUMERO_PLAIN = /^-?\d+(\.\d+)?$/;

export function aNumero(valor: unknown): number | undefined {
  if (valor === null || valor === undefined || valor === '') return undefined;

  let texto: string;
  if (typeof valor === 'number') {
    texto = String(valor);
  } else if (typeof valor === 'string') {
    texto = valor.trim();
  } else {
    return undefined;
  }

  if (texto === '') return undefined;

  let normalizado = texto;
  if (REGEX_NUMERO_ES_CO.test(texto)) {
    normalizado = texto.replace(/\./g, '').replace(',', '.');
  } else if (texto.includes(',') && !texto.includes('.')) {
    normalizado = texto.replace(',', '.');
  } else if (!REGEX_NUMERO_PLAIN.test(texto)) {
    return undefined;
  }

  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) return undefined;

  return Number(numero.toFixed(DECIMALES_MAXIMOS));
}

/**
 * Igual que `aNumero` pero devuelve 0 en lugar de `undefined`.
 * Util para campos donde el valor por defecto es cero.
 */
export function aNumeroOCero(valor: unknown): number {
  return aNumero(valor) ?? 0;
}
