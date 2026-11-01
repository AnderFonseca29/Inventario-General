import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegistrarConsentimientoCookiesDto } from './consentimiento-cookies.dto';

describe('RegistrarConsentimientoCookiesDto', () => {
  const valido = {
    identificador: '22222222-2222-4222-8222-222222222222',
    analitica: true,
    publicidad: false,
  };

  it('acepta un identificador anonimo UUID v4 y decisiones booleanas', async () => {
    const dto = plainToInstance(RegistrarConsentimientoCookiesDto, valido);

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rechaza identificadores que no son UUID v4', async () => {
    const dto = plainToInstance(RegistrarConsentimientoCookiesDto, {
      ...valido,
      identificador: 'no-es-un-uuid',
    });

    const errores = await validate(dto);

    expect(errores).toHaveLength(1);
    expect(errores[0].property).toBe('identificador');
  });

  it('rechaza decisiones que no son booleanas', async () => {
    const dto = plainToInstance(RegistrarConsentimientoCookiesDto, {
      ...valido,
      analitica: 'si',
    });

    const errores = await validate(dto);

    expect(errores.some((error) => error.property === 'analitica')).toBe(true);
  });
});
