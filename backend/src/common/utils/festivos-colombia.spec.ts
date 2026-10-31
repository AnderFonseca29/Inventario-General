import {
  domingoDePascua,
  esFestivo,
  festivosDe,
} from './festivos-colombia';

const fecha = (texto: string): Date => new Date(`${texto}T12:00:00.000Z`);

describe('festivos de Colombia', () => {
  it('calcula el domingo de Pascua de 2026 y 2027', () => {
    expect(domingoDePascua(2026).toISOString().slice(0, 10)).toBe('2026-04-05');
    expect(domingoDePascua(2027).toISOString().slice(0, 10)).toBe('2027-03-28');
  });

  it('incluye Jueves y Viernes Santo', () => {
    const festivos = festivosDe(2026);
    expect(festivos.has('2026-04-02')).toBe(true);
    expect(festivos.has('2026-04-03')).toBe(true);
  });

  it('traslada al lunes los festivos de la Ley 51 de 1983', () => {
    const festivos = festivosDe(2026);
    // El 6 de enero de 2026 es martes: pasa al lunes 12.
    expect(festivos.has('2026-01-12')).toBe(true);
    expect(festivos.has('2026-01-06')).toBe(false);
    // La Ascension, Corpus Christi y Sagrado Corazon caen en lunes.
    expect(festivos.has('2026-05-18')).toBe(true);
    expect(festivos.has('2026-06-08')).toBe(true);
    expect(festivos.has('2026-06-15')).toBe(true);
  });

  it('conserva los festivos fijos que no se trasladan', () => {
    const festivos = festivosDe(2026);
    expect(festivos.has('2026-01-01')).toBe(true);
    expect(festivos.has('2026-07-20')).toBe(true);
    expect(festivos.has('2026-12-25')).toBe(true);
  });

  it('reconoce un festivo y descarta un dia habil', () => {
    expect(esFestivo(fecha('2026-05-18'))).toBe(true);
    expect(esFestivo(fecha('2026-05-19'))).toBe(false);
  });
});
