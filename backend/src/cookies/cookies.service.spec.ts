import { CookiesService } from './cookies.service';
import { HASH_POLITICA_COOKIES, VERSION_POLITICA_COOKIES } from '../legal/documentos-legales';

describe('CookiesService', () => {
  function crear() {
    const prisma = {
      consentimientoCookies: {
        create: jest.fn().mockResolvedValue({
          id: '11111111-1111-4111-8111-111111111111',
        }),
      },
    };
    const servicio = new CookiesService(prisma as never);
    return { prisma, servicio };
  }

  it('registra la decision con la version y el hash del servidor', async () => {
    const { prisma, servicio } = crear();

    const resultado = await servicio.registrar(
      {
        identificador: '22222222-2222-4222-8222-222222222222',
        analitica: true,
        publicidad: false,
      },
      '127.0.0.1',
      'jest',
    );

    expect(resultado).toEqual({ registrado: true });
    expect(prisma.consentimientoCookies.create).toHaveBeenCalledWith({
      data: {
        identificador: '22222222-2222-4222-8222-222222222222',
        version: 1,
        versionPolitica: VERSION_POLITICA_COOKIES,
        hashPolitica: HASH_POLITICA_COOKIES,
        analitica: true,
        publicidad: false,
        ip: '127.0.0.1',
        userAgent: 'jest',
      },
    });
  });
});
