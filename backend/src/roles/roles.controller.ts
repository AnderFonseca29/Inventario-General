import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { RolesService } from './roles.service';
import { CreateRolDto, UpdateRolDto } from './dto/rol.dto';
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
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permisos(PERMISOS.ROLES_VER)
  listar(@CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.listar(exigirEmpresa(user));
  }

  @Get(':id')
  @Permisos(PERMISOS.ROLES_VER)
  obtener(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.rolesService.obtener(exigirEmpresa(user), id);
  }

  @Post()
  @Permisos(PERMISOS.ROLES_ADMINISTRAR)
  crear(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRolDto,
    @Req() req: Request,
  ) {
    return this.rolesService.crear(
      exigirEmpresa(user),
      dto,
      actorDe(user),
      req.ip,
    );
  }

  @Patch(':id')
  @Permisos(PERMISOS.ROLES_ADMINISTRAR)
  actualizar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRolDto,
    @Req() req: Request,
  ) {
    return this.rolesService.actualizar(
      exigirEmpresa(user),
      id,
      dto,
      actorDe(user),
      req.ip,
    );
  }

  @Delete(':id')
  @Permisos(PERMISOS.ROLES_ADMINISTRAR)
  eliminar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.rolesService.eliminar(
      exigirEmpresa(user),
      id,
      actorDe(user),
      req.ip,
    );
  }
}
