import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { EmpresasService } from './empresas.service';
import { UpdateEmpresaDto } from './dto/empresa.dto';
import { Permisos } from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('mi-empresa')
export class MiEmpresaController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Get()
  @Permisos(PERMISOS.EMPRESA_CONFIGURAR)
  obtener(@CurrentUser() user: AuthenticatedUser) {
    return this.empresasService.obtener(user.empresaId!);
  }

  @Patch()
  @Permisos(PERMISOS.EMPRESA_CONFIGURAR)
  actualizar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEmpresaDto,
    @Req() req: Request,
  ) {
    return this.empresasService.actualizar(
      user.empresaId!,
      dto,
      user.id,
      req.ip,
    );
  }
}
