import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsNumber, validate } from 'class-validator';
import {
  DECIMALES_MAXIMOS,
  normalizarDecimal,
  TransformDecimal,
} from './decimal';

describe('normalizarDecimal (hallazgo S)', () => {
  it('acepta numeros', () => {
    expect(normalizarDecimal(12)).toBe(12);
    expect(normalizarDecimal(12.5)).toBe(12.5);
  });

  it('acepta texto plano', () => {
    expect(normalizarDecimal('12.5')).toBe(12.5);
    expect(normalizarDecimal(' -3.25 ')).toBe(-3.25);
  });

  it('acepta formato es-CO con separador de miles', () => {
    expect(normalizarDecimal('1.234,56')).toBe(1234.56);
    expect(normalizarDecimal('1.234.567,89')).toBe(1234567.89);
  });

  it('acepta coma decimal sin separador de miles', () => {
    expect(normalizarDecimal('12,5')).toBe(12.5);
  });

  it('redondea a 4 decimales', () => {
    expect(normalizarDecimal(1.234567)).toBe(1.2346);
    expect(normalizarDecimal('1,23456')).toBe(1.2346);
    expect(DECIMALES_MAXIMOS).toBe(4);
  });

  it('rechaza valores no numericos', () => {
    expect(normalizarDecimal('abc')).toBeUndefined();
    expect(normalizarDecimal(NaN)).toBeUndefined();
    expect(normalizarDecimal(Infinity)).toBeUndefined();
    expect(normalizarDecimal({})).toBeUndefined();
    expect(normalizarDecimal('')).toBeUndefined();
    expect(normalizarDecimal(null)).toBeUndefined();
  });

  it('rechaza valores fuera del rango de Decimal(18,4)', () => {
    expect(normalizarDecimal(1e15)).toBeUndefined();
  });
});

describe('TransformDecimal en DTOs', () => {
  class Dto {
    @IsNumber({ maxDecimalPlaces: DECIMALES_MAXIMOS })
    @TransformDecimal()
    valor!: number;
  }

  it('transforma el texto es-CO a numero antes de validar', async () => {
    const dto = plainToInstance(Dto, { valor: '1.234,50' });
    expect(dto.valor).toBe(1234.5);
    const errores = await validate(dto);
    expect(errores).toHaveLength(0);
  });

  it('deja sin valor un texto no numerico', async () => {
    const dto = plainToInstance(Dto, { valor: 'no-numero' });
    const errores = await validate(dto);
    expect(errores.length).toBeGreaterThan(0);
  });
});
