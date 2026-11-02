import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

const USUARIO = {
  id: 'u1',
  email: 'ana@empresa.com',
  empresaId: 'e1',
  esSuperAdmin: false,
  esPropietario: true,
  permisos: [],
};

const TOKENS = {
  accessToken: 'a-nuevo',
  refreshToken: 'r-nuevo',
  accessExpiraEn: Date.now() + 15 * 60 * 1000,
  refreshExpiraEn: Date.now() + 7 * 24 * 60 * 60 * 1000,
};

interface ServicioInterno {
  loadAuthenticatedUser: (id: string) => Promise<Record<string, unknown>>;
  emitirTokens: () => Promise<typeof TOKENS>;
}

function crearServicio(
  opciones: {
    revocado?: boolean;
    revocadoEn?: Date | null;
    ip?: string | null;
    userAgent?: string | null;
    expirado?: boolean;
  } = {},
) {
  const almacenado = {
    id: 'rt-1',
    usuarioId: 'u1',
    tokenHash: 'hash',
    expiresAt: opciones.expirado ? new Date(Date.now() - 1000) : new Date(Date.now() + 60_000),
    revocado: opciones.revocado ?? false,
    revocadoEn: opciones.revocadoEn ?? null,
    ip: opciones.ip ?? '127.0.0.1',
    userAgent: opciones.userAgent ?? 'jest',
    createdAt: new Date(),
  };

  const prisma = {
    refreshToken: {
      findUnique: jest.fn().mockResolvedValue(almacenado),
      update: jest.fn().mockResolvedValue(almacenado),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: 'u1' }) };
  const config = {
    getOrThrow: jest.fn(() => 'secreto'),
    get: jest.fn(() => undefined),
  };
  const auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };

  const servicio = new AuthService(
    prisma as never,
    jwt as never,
    config as never,
    auditoria as never,
    {} as never,
    {} as never,
    {} as never,
  );

  const interno = servicio as unknown as ServicioInterno;
  jest.spyOn(interno, 'loadAuthenticatedUser').mockResolvedValue(USUARIO);
  jest.spyOn(interno, 'emitirTokens').mockResolvedValue(TOKENS);

  return { servicio, prisma, auditoria, interno };
}

describe('AuthService.refresh (rotacion y concurrencia)', () => {
  it('marca revocadoEn al rotar un refresh valido', async () => {
    const { servicio, prisma } = crearServicio();

    const resultado = await servicio.refresh({ refreshToken: 'token-viejo' }, '127.0.0.1', 'jest');

    expect(resultado).toMatchObject({ ...TOKENS, user: USUARIO });
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: { revocado: true, revocadoEn: expect.any(Date) },
    });
  });

  it('acepta el refresh concurrente dentro de la ventana de gracia', async () => {
    const { servicio, prisma, auditoria, interno } = crearServicio({
      revocado: true,
      revocadoEn: new Date(Date.now() - 1000),
    });

    const resultado = await servicio.refresh({ refreshToken: 'token-viejo' }, '127.0.0.1', 'jest');

    expect(resultado).toMatchObject({ ...TOKENS, user: USUARIO });
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    expect(interno.emitirTokens).toHaveBeenCalledTimes(1);
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'auth.refresh_concurrente' }),
    );
  });

  it('revoca todas las sesiones si el reuso ocurre fuera de la ventana', async () => {
    const { servicio, prisma, auditoria, interno } = crearServicio({
      revocado: true,
      revocadoEn: new Date(Date.now() - 20_000),
    });

    await expect(
      servicio.refresh({ refreshToken: 'token-viejo' }, '127.0.0.1', 'jest'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { usuarioId: 'u1', revocado: false },
      data: { revocado: true },
    });
    expect(interno.emitirTokens).not.toHaveBeenCalled();
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ accion: 'auth.refresh_reuso_detectado' }),
    );
  });

  it('no aplica la gracia si el reuso viene de otro contexto', async () => {
    const { servicio, prisma, interno } = crearServicio({
      revocado: true,
      revocadoEn: new Date(Date.now() - 1000),
      ip: '10.0.0.1',
      userAgent: 'otro-navegador',
    });

    await expect(
      servicio.refresh({ refreshToken: 'token-viejo' }, '127.0.0.1', 'jest'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    expect(interno.emitirTokens).not.toHaveBeenCalled();
  });

  it('rechaza un refresh expirado sin revocar otras sesiones', async () => {
    const { servicio, prisma } = crearServicio({
      revocado: false,
      expirado: true,
    });

    await expect(
      servicio.refresh({ refreshToken: 'token-viejo' }, '127.0.0.1', 'jest'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});
