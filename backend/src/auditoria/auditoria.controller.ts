import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuditoriaService } from './auditoria.service';
import { ListarAuditoriaDto } from './dto/auditoria.dto';
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
@Controller('auditorias')
export class AuditoriaController {
  constructor(private readonly auditoria: AuditoriaService) {}

  @Get()
  @Permisos(PERMISOS.AUDITORIA_VER)
  async listar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarAuditoriaDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.auditoria.listarConFiltros(
      exigirEmpresa(user),
      filtros,
    );
    return responderPaginado(res, resultado);
  }

  @Get(':id')
  @Permisos(PERMISOS.AUDITORIA_VER)
  obtener(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.auditoria.obtener(exigirEmpresa(user), id);
  }
}
