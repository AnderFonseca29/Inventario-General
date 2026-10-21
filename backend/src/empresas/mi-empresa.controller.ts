import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import type { Request } from 'express';
import { EmpresasService } from './empresas.service';
import { UpdateEmpresaDto } from './dto/empresa.dto';
import {
  Permisos,
  RequiereEmpresa,
} from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { exigirEmpresa } from '../common/guards/tenant.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@RequiereEmpresa()
@Controller('mi-empresa')
export class MiEmpresaController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Get()
  @Permisos(PERMISOS.EMPRESA_CONFIGURAR)
  obtener(@CurrentUser() user: AuthenticatedUser) {
    return this.empresasService.obtener(exigirEmpresa(user));
  }

  @Patch()
  @Permisos(PERMISOS.EMPRESA_CONFIGURAR)
  actualizar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateEmpresaDto,
    @Req() req: Request,
  ) {
    return this.empresasService.actualizar(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
  }
}
