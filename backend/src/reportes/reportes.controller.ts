import { Controller, Get, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { RangoFechasDto } from './dto/reportes.dto';
import {
  Permisos,
  RequiereEmpresa,
} from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SoloPropietario } from '../common/decorators/propietario.decorator';
import { exigirEmpresa } from '../common/guards/tenant.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@RequiereEmpresa()
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get('resumen')
  @Permisos(PERMISOS.REPORTES_VER)
  resumen(@CurrentUser() user: AuthenticatedUser) {
    return this.reportes.resumen(exigirEmpresa(user), user.esPropietario);
  }

  @Get('inventario')
  @Permisos(PERMISOS.REPORTES_VER)
  inventario(@CurrentUser() user: AuthenticatedUser) {
    return this.reportes.inventario(exigirEmpresa(user));
  }

  @Get('movimientos')
  @Permisos(PERMISOS.REPORTES_VER)
  movimientos(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: RangoFechasDto,
  ) {
    return this.reportes.movimientos(exigirEmpresa(user), filtros);
  }

  @Get('produccion')
  @Permisos(PERMISOS.REPORTES_VER)
  produccion(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: RangoFechasDto,
  ) {
    return this.reportes.produccion(exigirEmpresa(user), filtros);
  }

  @Get('membresias')
  @Permisos(PERMISOS.REPORTES_VER)
  @SoloPropietario()
  membresias(@CurrentUser() user: AuthenticatedUser) {
    return this.reportes.membresias(exigirEmpresa(user));
  }
}
