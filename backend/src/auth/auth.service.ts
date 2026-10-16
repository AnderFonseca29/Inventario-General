import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async permisosDeUsuario(usuarioId: string): Promise<string[]> {
    const roles = await this.prisma.usuarioRol.findMany({
      where: { usuarioId },
      include: {
        rol: { include: { permisos: { include: { permiso: true } } } },
      },
    });

    const set = new Set<string>();
    for (const ur of roles) {
      for (const rp of ur.rol.permisos) {
        set.add(rp.permiso.codigo);
      }
    }
    return [...set];
  }

  async loadAuthenticatedUser(usuarioId: string): Promise<AuthenticatedUser> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        email: true,
        activo: true,
        esSuperAdmin: true,
        empresaId: true,
        empresa: { select: { estado: true } },
      },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo o inexistente');
    }

    if (usuario.empresa && usuario.empresa.estado === 'CANCELADA') {
      throw new UnauthorizedException('La empresa esta cancelada');
    }

    const permisos = await this.permisosDeUsuario(usuario.id);

    return {
      id: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
      esSuperAdmin: usuario.esSuperAdmin,
      permisos,
    };
  }

  private async emitirTokens(
    user: AuthenticatedUser,
    ip?: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      empresaId: user.empresaId,
      esSuperAdmin: user.esSuperAdmin,
    };

    const accessTtl = (this.config.get<string>('JWT_EXPIRES_IN') ??
      '15m') as JwtSignOptions['expiresIn'];
    const refreshTtl = (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ??
      '7d') as JwtSignOptions['expiresIn'];

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: accessTtl,
    });

    const refreshToken = await this.jwt.signAsync(
      { ...payload, jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTtl,
      },
    );

    const decoded = this.jwt.decode<{ exp: number }>(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        usuarioId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
        userAgent,
        ip,
      },
    });

    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const valida = await argon2.verify(usuario.passwordHash, dto.password);
    if (!valida) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const user = await this.loadAuthenticatedUser(usuario.id);
    const tokens = await this.emitirTokens(user, ip, userAgent);

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    return { ...tokens, user };
  }

  async refresh(dto: RefreshDto, ip?: string, userAgent?: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string }>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalido o expirado');
    }

    const almacenado = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(dto.refreshToken) },
    });

    if (
      !almacenado ||
      almacenado.revocado ||
      almacenado.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Refresh token revocado o expirado');
    }

    await this.prisma.refreshToken.update({
      where: { id: almacenado.id },
      data: { revocado: true },
    });

    const user = await this.loadAuthenticatedUser(payload.sub);
    const tokens = await this.emitirTokens(user, ip, userAgent);
    return { ...tokens, user };
  }

  async logout(dto: RefreshDto): Promise<{ ok: true }> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(dto.refreshToken) },
      data: { revocado: true },
    });
    return { ok: true };
  }

  async changePassword(
    usuarioId: string,
    dto: ChangePasswordDto,
  ): Promise<{ ok: true }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) {
      throw new UnauthorizedException('Usuario inexistente');
    }

    const valida = await argon2.verify(
      usuario.passwordHash,
      dto.currentPassword,
    );
    if (!valida) {
      throw new UnauthorizedException('La contrasena actual no es correcta');
    }

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: usuarioId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { usuarioId, revocado: false },
        data: { revocado: true },
      }),
    ]);

    return { ok: true };
  }
}
