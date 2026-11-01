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
    const consentimientoCookies = {
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    };
    const servicio = crear({
      refreshToken,
      intentoLogin,
      consentimientoCookies,
    });

    const resultado = await servicio.purgar();

    expect(resultado).toEqual({
      tokens: 3,
      intentos: 1,
      consentimientos: 2,
    });
    expect(refreshToken.deleteMany).toHaveBeenCalledTimes(1);
    expect(intentoLogin.deleteMany).toHaveBeenCalledTimes(1);
    expect(consentimientoCookies.deleteMany).toHaveBeenCalledTimes(1);
  });

  it('espera la purga en curso antes de cerrar el modulo', async () => {
    let resolver: (valor: { count: number }) => void = () => {};
    const pendiente = new Promise<{ count: number }>((resolve) => {
      resolver = resolve;
    });
    const refreshToken = {
      deleteMany: jest.fn().mockReturnValue(pendiente),
    };
    const intentoLogin = {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    };
    const consentimientoCookies = {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    };
    const servicio = crear({
      refreshToken,
      intentoLogin,
      consentimientoCookies,
    });

    servicio.onModuleInit();
    const cierre = servicio.onModuleDestroy();
    let cerrado = false;
    void cierre.then(() => {
      cerrado = true;
    });

    await Promise.resolve();
    expect(cerrado).toBe(false);

    resolver({ count: 0 });
    await cierre;

    expect(cerrado).toBe(true);
  });

  it('no propaga errores si la base de datos falla', async () => {
    const refreshToken = {
      deleteMany: jest.fn().mockRejectedValue(new Error('BD caida')),
    };
    const intentoLogin = { deleteMany: jest.fn() };
    const consentimientoCookies = { deleteMany: jest.fn() };
    const servicio = crear({
      refreshToken,
      intentoLogin,
      consentimientoCookies,
    });

    await expect(servicio.purgar()).resolves.toEqual({
      tokens: 0,
      intentos: 0,
      consentimientos: 0,
    });
  });
});
