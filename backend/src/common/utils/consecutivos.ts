import { Prisma } from '@prisma/client';

/**
 * Generacion de consecutivos robusta ante concurrencia (hallazgo H).
 *
 * El patron anterior `count(...) + 1` NO es atomico entre transacciones: dos
 * peticiones simultaneas calculan el mismo numero y una de ellas falla con una
 * violacion de unicidad (P2002) que, para el usuario, es un 409 confuso.
 *
 * Estas utilidades mantienen la numeracion correlativa (legible) y reintentan
 * la transaccion completa cuando la base rechaza por consecutivo duplicado.
 * Postgres aborta la transaccion ante el error, por eso el reintento debe
 * envolver a `$transaction`, no solo a la sentencia.
 */

const MAX_INTENTOS = 5;

/** Crea un error sintetico de unicidad (para el generador inyectable). */
function errorUnicidad(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(
    'Restriccion unica violada (consecutivo duplicado)',
    { code: 'P2002', clientVersion: 'consecutivos' },
  );
}

/**
 * Genera un consecutivo del tipo `PREFIJO-000001`.
 *
 * @param contar  funcion que cuenta los registros existentes del tipo.
 * @param repetido funcion que indica si el consecutivo ya existe.
 */
export async function generarConsecutivo(
  prefijo: string,
  contar: () => Promise<number>,
  repetido: (consecutivo: string) => Promise<boolean>,
): Promise<string> {
  const total = await contar();
  let intento = total + 1;
  for (;;) {
    const consecutivo = `${prefijo}-${String(intento).padStart(6, '0')}`;
    if (!(await repetido(consecutivo))) return consecutivo;
    intento += 1;
  }
}

/**
 * Ejecuta `operacion` y, si falla por consecutivo duplicado (P2002), la
 * reintenta hasta `MAX_INTENTOS` veces. Cualquier otro error se propaga.
 */
export async function conReintentoConsecutivo<T>(
  operacion: () => Promise<T>,
): Promise<T> {
  let ultimoError: Error = errorUnicidad();
  for (let intento = 1; intento <= MAX_INTENTOS; intento += 1) {
    try {
      return await operacion();
    } catch (error) {
      if (!esConflictoUnico(error)) throw error;
      ultimoError = error as Error;
    }
  }
  throw ultimoError;
}

/** Detecta la violacion de unicidad de Prisma (P2002). */
export function esConflictoUnico(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}
