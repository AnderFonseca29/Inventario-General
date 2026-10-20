import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { EstadoDocumento } from '@prisma/client';
import { InventarioService } from './inventario.service';
import {
  CreateDocumentoDto,
  ListarExistenciasDto,
  ListarMovimientosDto,
} from './dto/inventario.dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventario: InventarioService) {}

  @Get('existencias')
  @Permisos(PERMISOS.INVENTARIO_VER)
  listarExistencias(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarExistenciasDto,
  ) {
    return this.inventario.listarExistencias(user.empresaId!, filtros);
  }

  @Get('movimientos')
  @Permisos(PERMISOS.INVENTARIO_VER)
  listarMovimientos(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarMovimientosDto,
  ) {
    return this.inventario.listarMovimientos(user.empresaId!, filtros);
  }

  @Get('documentos')
  @Permisos(PERMISOS.INVENTARIO_VER)
  listarDocumentos(
    @CurrentUser() user: AuthenticatedUser,
    @Query('estado') estado?: EstadoDocumento,
  ) {
    return this.inventario.listarDocumentos(user.empresaId!, estado);
  }

  @Get('documentos/:id')
  @Permisos(PERMISOS.INVENTARIO_VER)
  obtenerDocumento(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.inventario.obtenerDocumento(user.empresaId!, id);
  }

  @Post('documentos')
  @Permisos(PERMISOS.INVENTARIO_OPERAR)
  crearDocumento(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDocumentoDto,
  ) {
    return this.inventario.crearDocumento(user.empresaId!, dto, user.id);
  }

  @Post('documentos/:id/confirmar')
  @Permisos(PERMISOS.INVENTARIO_CONFIRMAR)
  confirmarDocumento(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.inventario.confirmarDocumento(user.empresaId!, id, user.id);
  }

  @Post('documentos/:id/anular')
  @Permisos(PERMISOS.INVENTARIO_ANULAR)
  anularDocumento(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.inventario.anularDocumento(user.empresaId!, id, user.id);
  }
}
