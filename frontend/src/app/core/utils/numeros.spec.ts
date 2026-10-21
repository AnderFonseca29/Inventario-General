import { aNumero, aNumeroOCero } from './numeros';

describe('aNumero (hallazgo S)', () => {
  it('acepta numeros', () => {
    expect(aNumero(12)).toBe(12);
    expect(aNumero(12.5)).toBe(12.5);
  });

  it('acepta texto plano', () => {
    expect(aNumero('12.5')).toBe(12.5);
    expect(aNumero(' -3.25 ')).toBe(-3.25);
  });

  it('acepta formato es-CO', () => {
    expect(aNumero('1.234,56')).toBe(1234.56);
    expect(aNumero('12,5')).toBe(12.5);
  });

  it('redondea a 4 decimales', () => {
    expect(aNumero(1.234567)).toBe(1.2346);
  });

  it('devuelve undefined para valores no numericos', () => {
    expect(aNumero('abc')).toBeUndefined();
    expect(aNumero('')).toBeUndefined();
    expect(aNumero(null)).toBeUndefined();
    expect(aNumero(NaN)).toBeUndefined();
  });

  it('aNumeroOCero reemplaza por 0', () => {
    expect(aNumeroOCero('abc')).toBe(0);
    expect(aNumeroOCero('1.234,50')).toBe(1234.5);
  });
});
