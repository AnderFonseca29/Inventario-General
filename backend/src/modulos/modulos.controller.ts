import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ModulosService } from './modulos.service';
import {
  CreateModuloDto,
  ReordenarModulosDto,
  UpdateModuloDto,
} from './dto/modulo.dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('modulos')
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

  // Menu operativo: cualquier usuario autenticado ve los modulos activos de su
  // empresa. El superadministrador debe indicar la empresa (empresaId).
  @Get()
  listarMenu(
    @CurrentUser() user: AuthenticatedUser,
    @Query('empresaId', new ParseUUIDPipe({ optional: true }))
    empresaIdQuery?: string,
  ) {
    const empresaId = this.resolverEmpresaOpcional(user, empresaIdQuery);
    if (!empresaId) return [];
    return this.modulosService.listar(empresaId, true);
  }

  @Get('gestion')
  @Permisos(PERMISOS.MODULOS_VER)
  listarGestion(
    @CurrentUser() user: AuthenticatedUser,
    @Query('empresaId', new ParseUUIDPipe({ optional: true }))
    empresaIdQuery?: string,
  ) {
    return this.modulosService.listar(
      this.resolverEmpresaRequerida(user, empresaIdQuery),
    );
  }

  @Get(':id')
  @Permisos(PERMISOS.MODULOS_VER)
  obtener(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('empresaId', new ParseUUIDPipe({ optional: true }))
    empresaIdQuery?: string,
  ) {
    return this.modulosService.obtener(
      this.resolverEmpresaRequerida(user, empresaIdQuery),
      id,
    );
  }

  @Post()
  @Permisos(PERMISOS.MODULOS_ADMINISTRAR)
  crear(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateModuloDto,
    @Req() req: Request,
    @Query('empresaId', new ParseUUIDPipe({ optional: true }))
    empresaIdQuery?: string,
  ) {
    return this.modulosService.crear(
      this.resolverEmpresaRequerida(user, empresaIdQuery),
      dto,
      user.id,
      req.ip,
    );
  }

  @Patch('reordenar')
  @Permisos(PERMISOS.MODULOS_ADMINISTRAR)
  reordenar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReordenarModulosDto,
    @Req() req: Request,
    @Query('empresaId', new ParseUUIDPipe({ optional: true }))
    empresaIdQuery?: string,
  ) {
    return this.modulosService.reordenar(
      this.resolverEmpresaRequerida(user, empresaIdQuery),
      dto,
      user.id,
      req.ip,
    );
  }

  @Patch(':id')
  @Permisos(PERMISOS.MODULOS_ADMINISTRAR)
  actualizar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateModuloDto,
    @Req() req: Request,
    @Query('empresaId', new ParseUUIDPipe({ optional: true }))
    empresaIdQuery?: string,
  ) {
    return this.modulosService.actualizar(
      this.resolverEmpresaRequerida(user, empresaIdQuery),
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete(':id')
  @Permisos(PERMISOS.MODULOS_ADMINISTRAR)
  eliminar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
    @Query('empresaId', new ParseUUIDPipe({ optional: true }))
    empresaIdQuery?: string,
  ) {
    return this.modulosService.eliminar(
      this.resolverEmpresaRequerida(user, empresaIdQuery),
      id,
      user.id,
      req.ip,
    );
  }

  private resolverEmpresaOpcional(
    user: AuthenticatedUser,
    empresaIdQuery?: string,
  ): string | null {
    if (user.esSuperAdmin) {
      return empresaIdQuery ?? null;
    }
    return user.empresaId ?? null;
  }

  private resolverEmpresaRequerida(
    user: AuthenticatedUser,
    empresaIdQuery?: string,
  ): string {
    if (user.esSuperAdmin) {
      if (!empresaIdQuery) {
        throw new BadRequestException(
          'Debe indicar la empresa (empresaId) como propietario de plataforma',
        );
      }
      return empresaIdQuery;
    }
    if (!user.empresaId) {
      throw new ForbiddenException('El usuario no tiene una empresa asignada');
    }
    return user.empresaId;
  }
}
