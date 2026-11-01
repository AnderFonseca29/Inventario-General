import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';

describe('AuthController (sesion en cookies)', () => {
  const usuario = {
    id: 'u1',
    email: 'ana@empresa.com',
    empresaId: 'e1',
    esSuperAdmin: false,
    esPropietario: true,
    permisos: [],
  };

  function crear() {
    const authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        accessExpiraEn: Date.now() + 900000,
        refreshExpiraEn: Date.now() + 604800000,
        user: usuario,
      }),
      registro: jest.fn().mockResolvedValue({
        accessToken: 'a',
        refreshToken: 'r',
        accessExpiraEn: Date.now() + 900000,
        refreshExpiraEn: Date.now() + 604800000,
        user: usuario,
      }),
      refresh: jest.fn().mockResolvedValue({
        accessToken: 'a2',
        refreshToken: 'r2',
        accessExpiraEn: Date.now() + 900000,
        refreshExpiraEn: Date.now() + 604800000,
        user: usuario,
      }),
      logout: jest.fn().mockResolvedValue({ ok: true }),
    };
    const cookies = {
      establecer: jest.fn(),
      limpiar: jest.fn(),
      leerRefresco: jest.fn(),
    };
    const controller = new AuthController(
      authService as never,
      cookies as never,
    );
    return { authService, cookies, controller };
  }

  const req = (cookie?: string) =>
    ({
      ip: '10.0.0.1',
      headers: { 'user-agent': 'jest', cookie },
    }) as unknown as Request;
  const res = {} as Response;

  it('login fija cookies y no devuelve tokens al JavaScript', async () => {
    const { authService, cookies, controller } = crear();
    const dto = { email: 'ana@empresa.com', password: 'Roble*2026' };

    const resultado = await controller.login(dto, req(), res);

    expect(authService.login).toHaveBeenCalledWith(dto, '10.0.0.1', 'jest');
    expect(cookies.establecer).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual({ user: usuario });
    expect(resultado).not.toHaveProperty('accessToken');
    expect(resultado).not.toHaveProperty('refreshToken');
  });

  it('refresh usa la cookie httpOnly y renueva las cookies', async () => {
    const { authService, cookies, controller } = crear();
    cookies.leerRefresco.mockReturnValue('r');

    const resultado = await controller.refresh({}, req('inv_refresh_token=r'), res);

    expect(authService.refresh).toHaveBeenCalledWith(
      { refreshToken: 'r' },
      '10.0.0.1',
      'jest',
    );
    expect(cookies.establecer).toHaveBeenCalledTimes(1);
    expect(resultado).toEqual({ user: usuario });
  });

  it('refresh rechaza y limpia cookies si no hay cookie ni token en el cuerpo', async () => {
    const { cookies, controller } = crear();
    cookies.leerRefresco.mockReturnValue(null);

    await expect(controller.refresh({}, req(), res)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(cookies.limpiar).toHaveBeenCalledWith(res);
  });

  it('refresh limpia cookies si el token fue revocado o expirado', async () => {
    const { authService, cookies, controller } = crear();
    cookies.leerRefresco.mockReturnValue('revocado');
    authService.refresh.mockRejectedValue(
      new UnauthorizedException('Refresh token revocado o expirado'),
    );

    await expect(controller.refresh({}, req(), res)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(cookies.limpiar).toHaveBeenCalledWith(res);
    expect(cookies.establecer).not.toHaveBeenCalled();
  });

  it('logout revoca el refresh y borra las cookies', async () => {
    const { authService, cookies, controller } = crear();
    cookies.leerRefresco.mockReturnValue('r');

    const resultado = await controller.logout({}, req(), res);

    expect(authService.logout).toHaveBeenCalledWith({ refreshToken: 'r' });
    expect(cookies.limpiar).toHaveBeenCalledWith(res);
    expect(resultado).toEqual({ ok: true });
  });
});
