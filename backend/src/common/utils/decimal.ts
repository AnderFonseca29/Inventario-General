import { Transform } from 'class-transformer';

/**
 * Estandarizacion de valores numericos decimales (hallazgo S).
 *
 * La base de datos usa `Decimal(18,4)`: cuatro decimales y dieciocho digitos
 * de precision. Antes, cada DTO declaraba `number` con `@IsNumber()` a secas,
 * lo que permitia:
 *
 * - valores con mas de 4 decimales, que PostgreSQL truncaba en silencio
 *   (el cliente creia haber guardado 1,23456 y quedaba 1,2346);
 * - `NaN` e `Infinity`, que rompian los calculos;
 * - texto con formato es-CO ("1.234,56"), que el backend rechazaba aunque
 *   es exactamente el formato que muestra el frontend.
 *
 * `normalizarDecimal` deja un unico criterio de entrada para todos los DTOs:
 * numero, o texto en formato es-CO o plano, redondeado a 4 decimales.
 */

/** Decimales admitidos, alineados con `Decimal(18,4)` de Prisma. */
export const DECIMALES_MAXIMOS = 4;

/**
 * Cota segura en doble precision para 14 digitos enteros.
 * El limite exacto de `Decimal(18,4)` no se puede representar en JavaScript;
 * esta cota rechaza los valores que, tras redondear, superan los 14 enteros.
 */
export const DECIMAL_MAXIMO = 99_999_999_999_999;

const REGEX_NUMERO_ES_CO = /^-?\d{1,3}(\.\d{3})*,\d+$/;
const REGEX_NUMERO_PLAIN = /^-?\d+(\.\d+)?$/;

/**
 * Convierte la entrada a un numero decimal utilizable.
 * Devuelve `undefined` cuando el valor no representa un numero valido, de
 * modo que la validacion posterior (`@IsNumber`) lo rechace con un error
 * claro en lugar de propagar `NaN` a la base de datos.
 */
export function normalizarDecimal(valor: unknown): number | undefined {
  if (valor === null || valor === undefined || valor === '') return undefined;

  let texto: string;
  if (typeof valor === 'number') {
    texto = String(valor);
  } else if (typeof valor === 'string') {
    texto = valor.trim();
  } else if (typeof valor === 'bigint') {
    texto = valor.toString();
  } else {
    return undefined;
  }

  if (texto === '') return undefined;

  let normalizado = texto;
  if (REGEX_NUMERO_ES_CO.test(texto)) {
    // "1.234,56" -> "1234.56"
    normalizado = texto.replace(/\./g, '').replace(',', '.');
  } else if (texto.includes(',') && !texto.includes('.')) {
    // "12,5" -> "12.5" (coma decimal sin separador de miles)
    normalizado = texto.replace(',', '.');
  } else if (!REGEX_NUMERO_PLAIN.test(texto)) {
    return undefined;
  }

  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) return undefined;

  const redondeado = Number(numero.toFixed(DECIMALES_MAXIMOS));
  if (Math.abs(redondeado) > DECIMAL_MAXIMO) return undefined;

  return redondeado;
}

/**
 * Decorador reutilizable para campos decimales de los DTOs.
 * Normaliza la entrada y delega la validacion en `@IsNumber`, restringida a
 * 4 decimales para que el valor guardado sea exactamente el recibido.
 *
 * Nota sobre el orden de transformacion: con `enableImplicitConversion` la
 * conversion implicita a `Number` ocurre ANTES que la transformacion
 * personalizada, por lo que `'12,5'` ya llega como `NaN`. Por eso se lee el
 * valor original desde el objeto plano de origen (`obj[key]`) y solo se recurre
 * a `value` cuando no hay original disponible.
 */
export function TransformDecimal(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Transform(
      ({
        value,
        obj,
        key,
      }: {
        value: unknown;
        obj?: Record<string, unknown>;
        key: string | symbol;
      }) => {
        const original = obj && key in obj ? obj[key as string] : undefined;
        return normalizarDecimal(original !== undefined ? original : value);
      },
      { toClassOnly: true },
    )(target, propertyKey);
  };
}
