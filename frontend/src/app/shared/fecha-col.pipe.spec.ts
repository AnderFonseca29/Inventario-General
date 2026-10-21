import { TestBed } from '@angular/core/testing';
import { FechaColPipe } from './fecha-col.pipe';

describe('FechaColPipe (hallazgo T)', () => {
  let pipe: FechaColPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FechaColPipe] });
    pipe = TestBed.inject(FechaColPipe);
  });

  it('devuelve guion cuando no hay valor', () => {
    expect(pipe.transform(null)).toBe('-');
    expect(pipe.transform(undefined)).toBe('-');
    expect(pipe.transform('')).toBe('-');
  });

  it('devuelve guion para una fecha invalida', () => {
    expect(pipe.transform('no-es-fecha')).toBe('-');
  });

  it('muestra la hora en la zona de Colombia, no en la del navegador', () => {
    // 15:30 UTC son las 10:30 en Colombia (UTC-5).
    const resultado = pipe.transform('2026-01-15T15:30:00.000Z', 'short');
    expect(resultado).toContain('10:30');
    expect(resultado).not.toContain('15:30');
  });

  it('formatea la fecha sin hora segun la zona de Colombia', () => {
    const resultado = pipe.transform('2026-01-15T02:00:00.000Z', 'shortDate');
    expect(resultado).toContain('14/01/2026');
  });
});
