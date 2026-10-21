import { ZONA_HORARIA } from './fechas';

describe('fechas frontend (hallazgo T)', () => {
  it('expone la zona horaria de operacion', () => {
    expect(ZONA_HORARIA).toBe('America/Bogota');
  });
});
