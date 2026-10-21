import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { responderPaginado } from '../common/utils/responder-paginado';
import { UsuariosService } from './usuarios.service';
import {
  CreateUsuarioDto,
  ListarUsuariosDto,
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

/** Actor con sus permisos efectivos, para evitar escalada de privilegios (E). */
function actorDe(user: AuthenticatedUser) {
  return {
    id: user.id,
    permisos: user.permisos,
    esSuperAdmin: user.esSuperAdmin,
  };
}

@RequiereEmpresa()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Permisos(PERMISOS.USUARIOS_VER)
  async listar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarUsuariosDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.usuariosService.listar(
      exigirEmpresa(user),
      filtros,
    );
    return responderPaginado(res, resultado);
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
      actorDe(user),
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
      actorDe(user),
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
      actorDe(user),
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
      actorDe(user),
      req.ip,
    );
  }
}
