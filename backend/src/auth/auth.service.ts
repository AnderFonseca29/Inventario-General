import {
  BadRequestException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomUUID } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { PermisosCacheService } from '../common/cache/permisos-cache.service';
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
    private readonly auditoria: AuditoriaService,
    private readonly permisosCache: PermisosCacheService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Hash ficticio (mismo algoritmo y parametros que el real) para consumir el
   * mismo tiempo cuando el correo no existe (hallazgo D: evita enumerar
   * usuarios por diferencia de tiempos).
   */
  private hashFicticio =
    '$argon2id$v=19$m=65536,t=3,p=4$c2FsdGZha2VzYWx0$0000000000000000000000000000000000000000000000';

  private async consumirTiempoDeHash(password: string): Promise<void> {
    try {
      await argon2.verify(this.hashFicticio, password);
    } catch {
      // El hash ficticio nunca válida: solo consume tiempo comparable.
    }
  }

  // --------------------- Bloqueo progresivo (hallazgo D) --------------------

  private ventanaBloqueoMs = 15 * 60 * 1000;

  /** Numero de intentos fallidos recientes por correo o por IP. */
  private async fallosRecientes(
    email: string,
    ip?: string,
  ): Promise<{ porEmail: number; porIp: number }> {
    const desde = new Date(Date.now() - this.ventanaBloqueoMs);
    const [porEmail, porIp] = await Promise.all([
      this.prisma.intentoLogin.count({
        where: { email, exito: false, creadoEn: { gte: desde } },
      }),
      ip
        ? this.prisma.intentoLogin.count({
            where: { ip, exito: false, creadoEn: { gte: desde } },
          })
        : Promise.resolve(0),
    ]);
    return { porEmail, porIp };
  }

  /**
   * Bloqueo temporal progresivo: a partir de 5 fallos se exige esperar
   * (5 s, 15 s, 30 s, 60 s...) con un tope de 5 minutos.
   */
  private esperaBloqueo(fallos: number): number {
    if (fallos < 5) return 0;
    const escalones = [5000, 15000, 30000, 60000, 120000, 300000];
    const indice = Math.min(fallos - 5, escalones.length - 1);
    return escalones[indice];
  }

  private async registrarIntento(
    email: string,
    ip: string | undefined,
    exito: boolean,
  ): Promise<void> {
    await this.prisma.intentoLogin.create({
      data: { email, ip, exito },
    });
  }

  private async exigirSinBloqueo(email: string, ip?: string): Promise<void> {
    const { porEmail, porIp } = await this.fallosRecientes(email, ip);
    const ultimo = await this.prisma.intentoLogin.findFirst({
      where: { email, exito: false },
      orderBy: { creadoEn: 'desc' },
      select: { creadoEn: true },
    });
    const esperaMs = Math.max(
      this.esperaBloqueo(porEmail),
      this.esperaBloqueo(porIp),
    );
    if (esperaMs === 0 || !ultimo) return;
    const transcurrido = Date.now() - ultimo.creadoEn.getTime();
    if (transcurrido < esperaMs) {
      const segundos = Math.ceil((esperaMs - transcurrido) / 1000);
      throw new HttpException(
        {
          statusCode: 429,
          message: `Demasiados intentos. Espera ${segundos} segundos e intenta de nuevo.`,
        },
        429,
      );
    }
  }

  private async permisosDeUsuario(usuarioId: string): Promise<string[]> {
    const cacheados = this.permisosCache.obtener(usuarioId);
    if (cacheados) {
      return cacheados;
    }

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
    const permisos = [...set];
    this.permisosCache.guardar(usuarioId, permisos);
    return permisos;
  }

  async loadAuthenticatedUser(usuarioId: string): Promise<AuthenticatedUser> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        email: true,
        activo: true,
        esSuperAdmin: true,
        esPropietario: true,
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
      esPropietario: usuario.esPropietario,
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
    const email = dto.email.trim().toLowerCase();
    await this.exigirSinBloqueo(email, ip);

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario || !usuario.activo) {
      // Tiempo comparable al caso válido y mensaje uniforme (hallazgo D).
      await this.consumirTiempoDeHash(dto.password);
      await this.registrarIntento(email, ip, false);
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const valida = await argon2.verify(usuario.passwordHash, dto.password);
    if (!valida) {
      await this.registrarIntento(email, ip, false);
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const user = await this.loadAuthenticatedUser(usuario.id);
    const tokens = await this.emitirTokens(user, ip, userAgent);

    await Promise.all([
      this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { ultimoLogin: new Date() },
      }),
      this.registrarIntento(email, ip, true),
    ]);

    return { ...tokens, user };
  }

  async refresh(dto: RefreshDto, ip?: string, userAgent?: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string }>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const almacenado = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(dto.refreshToken) },
    });

    // Deteccion de reuso (hallazgo H): si el token existe pero ya fue revocado,
    // alguien esta reutilizando un token rotado (posible robo). Se revocan
    // TODAS las sesiones del usuario y se rechaza.
    if (almacenado && almacenado.revocado) {
      await this.prisma.refreshToken.updateMany({
        where: { usuarioId: almacenado.usuarioId, revocado: false },
        data: { revocado: true },
      });
      await this.auditoria.registrar({
        empresaId: null,
        usuarioId: almacenado.usuarioId,
        accion: 'auth.refresh_reuso_detectado',
        entidad: 'RefreshToken',
        entidadId: almacenado.id,
        ip,
      });
      throw new UnauthorizedException('Refresh token revocado o expirado');
    }

    if (!almacenado || almacenado.expiresAt < new Date()) {
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
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    // Regla de contraseña: mínimo 10 caracteres, mayúscula, minúscula y número.
    const nuevas = dto.newPassword ?? '';
    const reglas = [
      nuevas.length >= 10,
      /[a-z]/.test(nuevas),
      /[A-Z]/.test(nuevas),
      /[0-9]/.test(nuevas),
    ];
    if (!reglas.every(Boolean)) {
      throw new BadRequestException(
        'La nueva contraseña debe tener al menos 10 caracteres e incluir mayúscula, minúscula y número',
      );
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
