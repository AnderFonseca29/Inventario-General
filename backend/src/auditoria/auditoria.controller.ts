import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';
import { ListarAuditoriaDto } from './dto/auditoria.dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('auditorias')
export class AuditoriaController {
  constructor(private readonly auditoria: AuditoriaService) {}

  @Get()
  @Permisos(PERMISOS.AUDITORIA_VER)
  listar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarAuditoriaDto,
  ) {
    return this.auditoria.listarConFiltros(user.empresaId!, filtros);
  }

  @Get(':id')
  @Permisos(PERMISOS.AUDITORIA_VER)
  obtener(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.auditoria.obtener(user.empresaId!, id);
  }
}
