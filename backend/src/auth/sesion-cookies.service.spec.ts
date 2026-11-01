import { SesionCookiesService } from './sesion-cookies.service';

describe('SesionCookiesService', () => {
  function crear(nodeEnv = 'production') {
    const config = {
      get: jest.fn((clave: string) => {
        if (clave === 'NODE_ENV') return nodeEnv;
        if (clave === 'COOKIE_SECURE') return 'false';
        return undefined;
      }),
    };
    const res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    return {
      res,
      servicio: new SesionCookiesService(config as never),
    };
  }

  const tokens = () => ({
    accessToken: 'a',
    refreshToken: 'r',
    accessExpiraEn: Date.now() + 15 * 60 * 1000,
    refreshExpiraEn: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  it('fija cookies httpOnly con rutas separadas y Max-Age', () => {
    const { res, servicio } = crear();
    servicio.establecer(res as never, tokens());

    expect(res.cookie).toHaveBeenNthCalledWith(
      1,
      'inv_access_token',
      'a',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/api',
        maxAge: expect.any(Number),
      }),
    );
    expect(res.cookie).toHaveBeenNthCalledWith(
      2,
      'inv_refresh_token',
      'r',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/api/auth',
        maxAge: expect.any(Number),
      }),
    );
  });

  it('en desarrollo usa SameSite=Lax y no exige HTTPS', () => {
    const { res, servicio } = crear('development');
    servicio.establecer(res as never, tokens());

    expect(res.cookie).toHaveBeenCalledWith(
      'inv_access_token',
      'a',
      expect.objectContaining({ secure: false, sameSite: 'lax' }),
    );
  });

  it('limpia las dos cookies con la misma ruta', () => {
    const { res, servicio } = crear();
    servicio.limpiar(res as never);

    expect(res.clearCookie).toHaveBeenNthCalledWith(
      1,
      'inv_access_token',
      expect.objectContaining({ path: '/api' }),
    );
    expect(res.clearCookie).toHaveBeenNthCalledWith(
      2,
      'inv_refresh_token',
      expect.objectContaining({ path: '/api/auth' }),
    );
  });

  it('lee las cookies de la cabecera', () => {
    const { servicio } = crear();
    const req = {
      headers: {
        cookie: 'inv_access_token=a; inv_refresh_token=r',
      },
    };

    expect(servicio.leerAcceso(req)).toBe('a');
    expect(servicio.leerRefresco(req)).toBe('r');
  });
});
