import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { EstadoDocumento } from '@prisma/client';
import { InventarioService } from './inventario.service';
import {
  CreateDocumentoDto,
  ListarExistenciasDto,
  ListarMovimientosDto,
} from './dto/inventario.dto';
import { responderPaginado } from '../common/utils/responder-paginado';
import {
  Permisos,
  RequiereEmpresa,
} from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { exigirEmpresa } from '../common/guards/tenant.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@RequiereEmpresa()
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventario: InventarioService) {}

  @Get('existencias')
  @Permisos(PERMISOS.INVENTARIO_VER)
  async listarExistencias(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarExistenciasDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.inventario.listarExistencias(
      exigirEmpresa(user),
      filtros,
    );
    return responderPaginado(res, resultado);
  }

  @Get('movimientos')
  @Permisos(PERMISOS.INVENTARIO_VER)
  async listarMovimientos(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarMovimientosDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.inventario.listarMovimientos(
      exigirEmpresa(user),
      filtros,
    );
    return responderPaginado(res, resultado);
  }

  @Get('documentos')
  @Permisos(PERMISOS.INVENTARIO_VER)
  listarDocumentos(
    @CurrentUser() user: AuthenticatedUser,
    @Query('estado') estado?: EstadoDocumento,
  ) {
    return this.inventario.listarDocumentos(exigirEmpresa(user), estado);
  }

  @Get('documentos/:id')
  @Permisos(PERMISOS.INVENTARIO_VER)
  obtenerDocumento(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.inventario.obtenerDocumento(exigirEmpresa(user), id);
  }

  @Post('documentos')
  @Permisos(PERMISOS.INVENTARIO_OPERAR)
  crearDocumento(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDocumentoDto,
  ) {
    return this.inventario.crearDocumento(exigirEmpresa(user), dto, user.id);
  }

  @Post('documentos/:id/confirmar')
  @Permisos(PERMISOS.INVENTARIO_CONFIRMAR)
  confirmarDocumento(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.inventario.confirmarDocumento(exigirEmpresa(user), id, user.id);
  }

  @Post('documentos/:id/anular')
  @Permisos(PERMISOS.INVENTARIO_ANULAR)
  anularDocumento(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.inventario.anularDocumento(exigirEmpresa(user), id, user.id);
  }
}
