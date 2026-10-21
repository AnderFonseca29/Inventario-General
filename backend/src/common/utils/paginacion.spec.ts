import { construirPaginado } from './paginacion';

describe('construirPaginado (hallazgo Q)', () => {
  it('calcula el total de paginas', () => {
    const resultado = construirPaginado(['a', 'b'], 10, 1, 3);
    expect(resultado.items).toEqual(['a', 'b']);
    expect(resultado.total).toBe(10);
    expect(resultado.pagina).toBe(1);
    expect(resultado.limite).toBe(3);
    expect(resultado.totalPaginas).toBe(4);
  });

  it('devuelve una sola pagina cuando no hay registros', () => {
    const resultado = construirPaginado([], 0, 1, 25);
    expect(resultado.totalPaginas).toBe(0);
  });

  it('nunca divide entre cero con limite 0', () => {
    const resultado = construirPaginado([], 0, 1, 0);
    expect(resultado.limite).toBe(1);
    expect(resultado.totalPaginas).toBe(0);
  });
});
