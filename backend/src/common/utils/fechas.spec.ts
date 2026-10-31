import {
  aInstanteUtc,
  finDelDiaUtc,
  sumarDiasHabiles,
  ZONA_HORARIA,
} from './fechas';

describe('fechas (hallazgo T)', () => {
  it('interpreta una fecha sin hora como medianoche de Colombia', () => {
    const instante = aInstanteUtc('2026-01-15');
    expect(instante).toBeDefined();
    expect(instante!.toISOString()).toBe('2026-01-15T05:00:00.000Z');
  });

  it('interpreta una fecha con hora sin zona como hora de Colombia', () => {
    const instante = aInstanteUtc('2026-01-15T08:30');
    expect(instante!.toISOString()).toBe('2026-01-15T13:30:00.000Z');
  });

  it('respeta las fechas con zona explicita', () => {
    const instante = aInstanteUtc('2026-01-15T08:30:00.000Z');
    expect(instante!.toISOString()).toBe('2026-01-15T08:30:00.000Z');
  });

  it('respeta las fechas con offset numerico', () => {
    const instante = aInstanteUtc('2026-01-15T03:30:00.000-05:00');
    expect(instante!.toISOString()).toBe('2026-01-15T08:30:00.000Z');
  });

  it('acepta objetos Date validos', () => {
    const fecha = new Date('2026-06-01T00:00:00.000Z');
    expect(aInstanteUtc(fecha)!.toISOString()).toBe(fecha.toISOString());
  });

  it('rechaza entradas invalidas', () => {
    expect(aInstanteUtc('no-es-fecha')).toBeUndefined();
    expect(aInstanteUtc('')).toBeUndefined();
    expect(aInstanteUtc(null)).toBeUndefined();
    expect(aInstanteUtc(new Date('invalido'))).toBeUndefined();
  });

  it('el fin del dia incluye el dia completo en Colombia', () => {
    const fin = finDelDiaUtc('2026-01-15');
    expect(fin!.toISOString()).toBe('2026-01-16T04:59:59.999Z');
  });

  it('el fin del dia conserva la zona explicita si la hay', () => {
    const fin = finDelDiaUtc('2026-01-15T10:00:00.000Z');
    expect(fin!.toISOString()).toBe('2026-01-15T10:00:00.000Z');
  });

  it('expone la zona horaria de operacion', () => {
    expect(ZONA_HORARIA).toBe('America/Bogota');
  });

  it('suma dias habiles sin contar sabados ni domingos', () => {
    const desde = aInstanteUtc('2026-01-15')!;
    const limite = sumarDiasHabiles(desde, 10);
    expect(limite.toISOString()).toBe('2026-01-30T04:59:59.999Z');
  });

  it('tampoco cuenta los festivos nacionales', () => {
    // Del lunes 5 al viernes 9 de enero hay 4 dias habiles; el 6 no es
    // festivo porque se traslada al lunes 12 (Ley 51), que si se salta.
    // El quinto dia habil es el martes 13.
    const desde = aInstanteUtc('2026-01-05')!;
    const limite = sumarDiasHabiles(desde, 5);
    expect(limite.toISOString()).toBe('2026-01-14T04:59:59.999Z');
  });
});
