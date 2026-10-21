import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsuariosService } from './usuarios.service';
import {
  CreateUsuarioDto,
  ResetPasswordDto,
  UpdateUsuarioDto,
} from './dto/usuario.dto';
import {
  Permisos,
  RequiereEmpresa,
} from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { exigirEmpresa } from '../common/guards/tenant.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@RequiereEmpresa()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Permisos(PERMISOS.USUARIOS_VER)
  listar(@CurrentUser() user: AuthenticatedUser) {
    return this.usuariosService.listar(exigirEmpresa(user));
  }

  @Get(':id')
  @Permisos(PERMISOS.USUARIOS_VER)
  obtener(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.usuariosService.obtener(exigirEmpresa(user), id);
  }

  @Post()
  @Permisos(PERMISOS.USUARIOS_CREAR)
  crear(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateUsuarioDto,
    @Req() req: Request,
  ) {
    return this.usuariosService.crear(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
  }

  @Patch(':id')
  @Permisos(PERMISOS.USUARIOS_EDITAR)
  actualizar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUsuarioDto,
    @Req() req: Request,
  ) {
    return this.usuariosService.actualizar(
      exigirEmpresa(user),
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Patch(':id/desactivar')
  @Permisos(PERMISOS.USUARIOS_DESACTIVAR)
  desactivar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.usuariosService.desactivar(
      exigirEmpresa(user),
      id,
      user.id,
      req.ip,
    );
  }

  @Patch(':id/password')
  @Permisos(PERMISOS.USUARIOS_EDITAR)
  resetPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    return this.usuariosService.resetPassword(
      exigirEmpresa(user),
      id,
      dto,
      user.id,
      req.ip,
    );
  }
}
