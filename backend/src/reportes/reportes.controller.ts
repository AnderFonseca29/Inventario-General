import { Controller, Get, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { RangoFechasDto } from './dto/reportes.dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get('resumen')
  @Permisos(PERMISOS.REPORTES_VER)
  resumen(@CurrentUser() user: AuthenticatedUser) {
    return this.reportes.resumen(user.empresaId!);
  }

  @Get('inventario')
  @Permisos(PERMISOS.REPORTES_VER)
  inventario(@CurrentUser() user: AuthenticatedUser) {
    return this.reportes.inventario(user.empresaId!);
  }

  @Get('movimientos')
  @Permisos(PERMISOS.REPORTES_VER)
  movimientos(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: RangoFechasDto,
  ) {
    return this.reportes.movimientos(user.empresaId!, filtros);
  }

  @Get('produccion')
  @Permisos(PERMISOS.REPORTES_VER)
  produccion(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: RangoFechasDto,
  ) {
    return this.reportes.produccion(user.empresaId!, filtros);
  }

  @Get('membresias')
  @Permisos(PERMISOS.REPORTES_VER)
  membresias(@CurrentUser() user: AuthenticatedUser) {
    return this.reportes.membresias(user.empresaId!);
  }
}
