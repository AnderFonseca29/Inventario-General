import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegistroDto } from './dto/registro.dto';
import { Public } from '../common/decorators/public.decorator';
import { RequiereEmpresa } from '../common/decorators/permisos.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { SesionCookiesService } from './sesion-cookies.service';

// El superadministrador de plataforma (empresaId null) usa login, refresh y
// cambio de contraseña: no son endpoints operativos de empresa.
@RequiereEmpresa(false)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sesionCookies: SesionCookiesService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  // Límite estricto por IP además del bloqueo progresivo por correo (hallazgo D).
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.authService.login(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    this.sesionCookies.establecer(res, resultado);
    return { user: resultado.user };
  }

  @Public()
  @Post('registro')
  // Registro público: límite estricto por IP para frenar altas masivas.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async registro(
    @Body() dto: RegistroDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.authService.registro(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    this.sesionCookies.establecer(res, resultado);
    return { user: resultado.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.sesionCookies.leerRefresco(req) ?? dto?.refreshToken;
    if (!token) {
      this.sesionCookies.limpiar(res);
      throw new UnauthorizedException('Sesión expirada');
    }

    try {
      const resultado = await this.authService.refresh(
        { refreshToken: token },
        req.ip,
        req.headers['user-agent'],
      );
      this.sesionCookies.establecer(res, resultado);
      return { user: resultado.user };
    } catch (error) {
      // Si el refresh ya no sirve, se borran las cookies para que el navegador
      // no reintente con un token revocado en cada peticion. Un fallo
      // transitorio (por ejemplo, base de datos caida) no debe cerrar sesion.
      if (error instanceof UnauthorizedException) {
        this.sesionCookies.limpiar(res);
      }
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async logout(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.sesionCookies.leerRefresco(req) ?? dto?.refreshToken;
    if (token) {
      await this.authService.logout({ refreshToken: token });
    }
    this.sesionCookies.limpiar(res);
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Post('change-password')
  @HttpCode(200)
  @RequiereEmpresa(false)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }
}
