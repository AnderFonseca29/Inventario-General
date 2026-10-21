import type { Response } from 'express';
import type { ResultadoPaginado } from './paginacion';

/**
 * Escribe las cabeceras de paginacion y devuelve el arreglo de items.
 *
 * Se mantiene la forma de la respuesta (un arreglo) para no romper los
 * clientes existentes; el total se expone en `X-Total-Count` (hallazgo Q).
 */
export function responderPaginado<T>(
  res: Response,
  resultado: ResultadoPaginado<T>,
): T[] {
  res.setHeader('X-Total-Count', resultado.total);
  res.setHeader('X-Pagina', resultado.pagina);
  res.setHeader('X-Limite', resultado.limite);
  res.setHeader('X-Total-Paginas', resultado.totalPaginas);
  return resultado.items;
}
