import { TokensPurgaService } from './tokens-purga.service';

describe('TokensPurgaService (hallazgo H)', () => {
  function crear(prisma: unknown) {
    return new TokensPurgaService(prisma as never);
  }

  it('elimina tokens vencidos o revocados antiguos e intentos antiguos', async () => {
    const refreshToken = {
      deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
    };
    const intentoLogin = {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    };
    const servicio = crear({ refreshToken, intentoLogin });

    const resultado = await servicio.purgar();

    expect(resultado).toEqual({ tokens: 3, intentos: 1 });
    expect(refreshToken.deleteMany).toHaveBeenCalledTimes(1);
    expect(intentoLogin.deleteMany).toHaveBeenCalledTimes(1);
  });

  it('no propaga errores si la base de datos falla', async () => {
    const refreshToken = {
      deleteMany: jest.fn().mockRejectedValue(new Error('BD caida')),
    };
    const intentoLogin = { deleteMany: jest.fn() };
    const servicio = crear({ refreshToken, intentoLogin });

    await expect(servicio.purgar()).resolves.toEqual({
      tokens: 0,
      intentos: 0,
    });
  });
});
