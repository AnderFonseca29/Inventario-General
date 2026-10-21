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
import {
  Permisos,
  RequiereEmpresa,
} from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { exigirEmpresa } from '../common/guards/tenant.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@RequiereEmpresa()
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
    return this.produccion.listarMateriasPrimas(exigirEmpresa(user), filtros);
  }

  @Post('materias-primas')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  crearMateriaPrima(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMateriaPrimaDto,
    @Req() req: Request,
  ) {
    return this.produccion.crearMateriaPrima(
      exigirEmpresa(user),
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
      exigirEmpresa(user),
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
    return this.produccion.eliminarMateriaPrima(exigirEmpresa(user), id);
  }

  // ------------------------------- Recepciones -----------------------------

  @Get('recepciones')
  @Permisos(PERMISOS.PRODUCCION_VER)
  listarRecepciones(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarRecepcionesDto,
  ) {
    return this.produccion.listarRecepciones(exigirEmpresa(user), filtros);
  }

  @Post('recepciones')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  crearRecepcion(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRecepcionDto,
    @Req() req: Request,
  ) {
    return this.produccion.crearRecepcion(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
  }

  // -------------------------------- Formulas -------------------------------

  @Get('formulas')
  @Permisos(PERMISOS.PRODUCCION_VER)
  listarFormulas(@CurrentUser() user: AuthenticatedUser) {
    return this.produccion.listarFormulas(exigirEmpresa(user));
  }

  @Get('formulas/:id')
  @Permisos(PERMISOS.PRODUCCION_VER)
  obtenerFormula(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.obtenerFormula(exigirEmpresa(user), id);
  }

  @Post('formulas')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  crearFormula(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFormulaDto,
    @Req() req: Request,
  ) {
    return this.produccion.crearFormula(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
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
      exigirEmpresa(user),
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
    return this.produccion.eliminarFormula(exigirEmpresa(user), id);
  }

  // --------------------------- Ordenes de produccion -----------------------

  @Get('ordenes')
  @Permisos(PERMISOS.PRODUCCION_VER)
  listarOrdenes(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarOrdenesDto,
  ) {
    return this.produccion.listarOrdenes(exigirEmpresa(user), filtros);
  }

  @Get('ordenes/:id')
  @Permisos(PERMISOS.PRODUCCION_VER)
  obtenerOrden(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.obtenerOrden(exigirEmpresa(user), id);
  }

  @Post('ordenes')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  crearOrden(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrdenDto,
    @Req() req: Request,
  ) {
    return this.produccion.crearOrden(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
  }

  @Post('ordenes/:id/iniciar')
  @Permisos(PERMISOS.PRODUCCION_OPERAR)
  iniciarOrden(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.iniciarOrden(exigirEmpresa(user), id, user.id);
  }

  @Post('ordenes/:id/completar')
  @Permisos(PERMISOS.PRODUCCION_CONFIRMAR)
  completarOrden(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CompletarOrdenDto,
  ) {
    return this.produccion.completarOrden(
      exigirEmpresa(user),
      id,
      dto,
      user.id,
    );
  }

  @Post('ordenes/:id/cancelar')
  @Permisos(PERMISOS.PRODUCCION_CONFIRMAR)
  cancelarOrden(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.cancelarOrden(exigirEmpresa(user), id, user.id);
  }

  // --------------------------------- Mermas --------------------------------

  @Get('mermas')
  @Permisos(PERMISOS.PRODUCCION_VER)
  listarMermas(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarMermasDto,
  ) {
    return this.produccion.listarMermas(exigirEmpresa(user), filtros);
  }

  @Post('mermas')
  @Permisos(PERMISOS.MERMAS_REGISTRAR)
  crearMerma(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMermaDto,
    @Req() req: Request,
  ) {
    return this.produccion.crearMerma(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
  }

  @Post('mermas/:id/aprobar')
  @Permisos(PERMISOS.MERMAS_APROBAR)
  aprobarMerma(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.aprobarMerma(exigirEmpresa(user), id, user.id);
  }

  @Post('mermas/:id/rechazar')
  @Permisos(PERMISOS.MERMAS_APROBAR)
  rechazarMerma(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.produccion.rechazarMerma(exigirEmpresa(user), id, user.id);
  }
}
