/**
 * Utilidades de paginacion (hallazgo Q).
 *
 * Los listados devuelven un arreglo (misma forma que antes) y el total de
 * registros se expone en la cabecera `X-Total-Count`. Asi el frontend puede
 * saber si hay mas paginas sin romper los clientes existentes.
 */
export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export function construirPaginado<T>(
  items: T[],
  total: number,
  pagina = 1,
  limite = items.length,
): ResultadoPaginado<T> {
  const limiteSeguro = limite > 0 ? limite : 1;
  return {
    items,
    total,
    pagina,
    limite: limiteSeguro,
    totalPaginas: Math.ceil(total / limiteSeguro),
  };
}
