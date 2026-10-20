import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ProduccionService } from './produccion.service';
import {
  CompletarOrdenDto,
  CreateFormulaDto,
  CreateMateriaPrimaDto,
  CreateMermaDto,
  CreateOrdenDto,
  CreateRecepcionDto,
  ListarMateriasPrimasDto,
  ListarMermasDto,
  ListarOrdenesDto,
  ListarRecepcionesDto,
  UpdateFormulaDto,
  UpdateMateriaPrimaDto,
} from './dto/produccion.dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('produccion')
export class ProduccionController {
  constructor(private readonly produccion: ProduccionService) {}

  // ----------------------------- Materias primas ---------------------------

  @Get('materias-primas')
  @Permisos(PERMISOS.PRODUCCION_VER)
  listarMateriasPrimas(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarMateriasPrimasDto,
  ) {
    return this.produccion.listarMateriasPrimas(user.empresaId!, filtros);
  }

  @Post('materias-primas')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  crearMateriaPrima(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMateriaPrimaDto,
    @Req() req: Request,
  ) {
    return this.produccion.crearMateriaPrima(
      user.empresaId!,
      dto,
      user.id,
      req.ip,
    );
  }

  @Patch('materias-primas/:id')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  actualizarMateriaPrima(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMateriaPrimaDto,
    @Req() req: Request,
  ) {
    return this.produccion.actualizarMateriaPrima(
      user.empresaId!,
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete('materias-primas/:id')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  eliminarMateriaPrima(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.eliminarMateriaPrima(user.empresaId!, id);
  }

  // ------------------------------- Recepciones -----------------------------

  @Get('recepciones')
  @Permisos(PERMISOS.PRODUCCION_VER)
  listarRecepciones(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarRecepcionesDto,
  ) {
    return this.produccion.listarRecepciones(user.empresaId!, filtros);
  }

  @Post('recepciones')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  crearRecepcion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRecepcionDto,
    @Req() req: Request,
  ) {
    return this.produccion.crearRecepcion(
      user.empresaId!,
      dto,
      user.id,
      req.ip,
    );
  }

  // -------------------------------- Formulas -------------------------------

  @Get('formulas')
  @Permisos(PERMISOS.PRODUCCION_VER)
  listarFormulas(@CurrentUser() user: AuthenticatedUser) {
    return this.produccion.listarFormulas(user.empresaId!);
  }

  @Get('formulas/:id')
  @Permisos(PERMISOS.PRODUCCION_VER)
  obtenerFormula(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.obtenerFormula(user.empresaId!, id);
  }

  @Post('formulas')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  crearFormula(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFormulaDto,
    @Req() req: Request,
  ) {
    return this.produccion.crearFormula(user.empresaId!, dto, user.id, req.ip);
  }

  @Patch('formulas/:id')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  actualizarFormula(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateFormulaDto,
    @Req() req: Request,
  ) {
    return this.produccion.actualizarFormula(
      user.empresaId!,
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete('formulas/:id')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  eliminarFormula(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.eliminarFormula(user.empresaId!, id);
  }

  // --------------------------- Ordenes de produccion -----------------------

  @Get('ordenes')
  @Permisos(PERMISOS.PRODUCCION_VER)
  listarOrdenes(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarOrdenesDto,
  ) {
    return this.produccion.listarOrdenes(user.empresaId!, filtros);
  }

  @Get('ordenes/:id')
  @Permisos(PERMISOS.PRODUCCION_VER)
  obtenerOrden(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.obtenerOrden(user.empresaId!, id);
  }

  @Post('ordenes')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  crearOrden(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrdenDto,
    @Req() req: Request,
  ) {
    return this.produccion.crearOrden(user.empresaId!, dto, user.id, req.ip);
  }

  @Post('ordenes/:id/iniciar')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  iniciarOrden(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.iniciarOrden(user.empresaId!, id, user.id);
  }

  @Post('ordenes/:id/completar')
  @Permisos(PERMISOS.PRODUCCION_CONFIRMAR)
  completarOrden(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CompletarOrdenDto,
  ) {
    return this.produccion.completarOrden(user.empresaId!, id, dto, user.id);
  }

  @Post('ordenes/:id/cancelar')
  @Permisos(PERMISOS.PRODUCCION_CONFIRMAR)
  cancelarOrden(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.cancelarOrden(user.empresaId!, id, user.id);
  }

  // --------------------------------- Mermas --------------------------------

  @Get('mermas')
  @Permisos(PERMISOS.PRODUCCION_VER)
  listarMermas(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarMermasDto,
  ) {
    return this.produccion.listarMermas(user.empresaId!, filtros);
  }

  @Post('mermas')
  @Permisos(PERMISOS.MERMAS_REGISTRAR)
  crearMerma(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMermaDto,
    @Req() req: Request,
  ) {
    return this.produccion.crearMerma(user.empresaId!, dto, user.id, req.ip);
  }

  @Post('mermas/:id/aprobar')
  @Permisos(PERMISOS.MERMAS_APROBAR)
  aprobarMerma(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.aprobarMerma(user.empresaId!, id, user.id);
  }

  @Post('mermas/:id/rechazar')
  @Permisos(PERMISOS.MERMAS_APROBAR)
  rechazarMerma(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.rechazarMerma(user.empresaId!, id, user.id);
  }
}
