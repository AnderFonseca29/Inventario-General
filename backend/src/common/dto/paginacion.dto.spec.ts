import 'reflect-metadata';
import { PaginacionDto, LIMITE_MAXIMO } from './paginacion.dto';

describe('PaginacionDto (hallazgo Q)', () => {
  it('usa la pagina 1 y el limite maximo por defecto', () => {
    const dto = new PaginacionDto();
    expect(dto.pagina).toBe(1);
    expect(dto.limite).toBe(LIMITE_MAXIMO);
    expect(dto.skip).toBe(0);
    expect(dto.take).toBe(LIMITE_MAXIMO);
  });

  it('calcula el offset a partir de pagina y limite', () => {
    const dto = new PaginacionDto();
    dto.pagina = 3;
    dto.limite = 20;
    expect(dto.skip).toBe(40);
    expect(dto.take).toBe(20);
  });

  it('no devuelve offset negativo para paginas invalidas', () => {
    const dto = new PaginacionDto();
    dto.pagina = 0;
    dto.limite = 10;
    expect(dto.skip).toBe(-10);
  });
});
