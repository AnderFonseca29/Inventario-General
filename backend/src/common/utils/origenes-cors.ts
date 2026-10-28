// Origenes que el navegador tiene permitido llamar en la API.

/**
 * Origenes del propio producto. Se aceptan siempre, ademas de los que lleguen
 * por `CORS_ORIGINS`.
 *
 * Motivo: si la variable del panel de despliegue se queda atras, la web
 * publicada pierde la API y el sintoma es dificil de diagnosticar (el service
 * worker de Angular convierte el fallo de CORS en un 504 sin cuerpo). Por eso
 * los origenes propios no dependen de una variable que se pueda desincronizar.
 *
 * PROVISIONAL hasta el dominio propio (fase 9): al comprar el dominio se
 * agrega aqui y en `CORS_ORIGINS`.
 */
export const ORIGENES_PROPIOS = [
  'https://inventario-general-delta.vercel.app',
  'https://anderfonseca29.github.io',
];

/**
 * Une los origenes propios con los de `CORS_ORIGINS` (lista separada por
 * comas), sin duplicados ni espacios sueltos.
 */
export function resolverOrigenes(corsOrigins?: string | null): string[] {
  const declarados = (corsOrigins ?? '')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);

  return [...new Set([...ORIGENES_PROPIOS, ...declarados])];
}
