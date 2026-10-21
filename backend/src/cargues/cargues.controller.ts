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
import { CarguesService } from './cargues.service';
import { CrearCargueDto, ListarCarguesDto } from './dto/cargues.dto';
import { responderPaginado } from '../common/utils/responder-paginado';
import {
  Permisos,
  PermisosAlguno,
  RequiereEmpresa,
} from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { exigirEmpresa } from '../common/guards/tenant.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@RequiereEmpresa()
@Controller('cargues')
export class CarguesController {
  constructor(private readonly cargues: CarguesService) {}

  @Get()
  @PermisosAlguno(PERMISOS.CARGUES_VER_PROPIOS, PERMISOS.CARGUES_VER_TODOS)
  async listar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarCarguesDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.cargues.listar(
      exigirEmpresa(user),
      user,
      filtros,
    );
    return responderPaginado(res, resultado);
  }

  @Get('vendedores')
  @Permisos(PERMISOS.CARGUES_CREAR)
  vendedores(@CurrentUser() user: AuthenticatedUser) {
    return this.cargues.vendedores(exigirEmpresa(user));
  }

  @Get(':id')
  @PermisosAlguno(PERMISOS.CARGUES_VER_PROPIOS, PERMISOS.CARGUES_VER_TODOS)
  obtener(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.cargues.obtener(exigirEmpresa(user), id, user);
  }

  @Post()
  @Permisos(PERMISOS.CARGUES_CREAR)
  crear(@CurrentUser() user: AuthenticatedUser, @Body() dto: CrearCargueDto) {
    return this.cargues.crear(exigirEmpresa(user), dto, user.id);
  }

  @Post(':id/confirmar')
  @Permisos(PERMISOS.CARGUES_CONFIRMAR)
  confirmar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.cargues.confirmar(exigirEmpresa(user), id, user.id);
  }

  @Post(':id/anular')
  @Permisos(PERMISOS.CARGUES_ANULAR)
  anular(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.cargues.anular(exigirEmpresa(user), id, user.id);
  }
}
