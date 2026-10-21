import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CarguesService } from './cargues.service';
import { CrearCargueDto, ListarCarguesDto } from './dto/cargues.dto';
import {
  Permisos,
  PermisosAlguno,
} from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('cargues')
export class CarguesController {
  constructor(private readonly cargues: CarguesService) {}

  @Get()
  @PermisosAlguno(PERMISOS.CARGUES_VER_PROPIOS, PERMISOS.CARGUES_VER_TODOS)
  listar(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarCarguesDto,
  ) {
    return this.cargues.listar(user.empresaId!, user, filtros);
  }

  @Get('vendedores')
  @Permisos(PERMISOS.CARGUES_CREAR)
  vendedores(@CurrentUser() user: AuthenticatedUser) {
    return this.cargues.vendedores(user.empresaId!);
  }

  @Get(':id')
  @PermisosAlguno(PERMISOS.CARGUES_VER_PROPIOS, PERMISOS.CARGUES_VER_TODOS)
  obtener(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.cargues.obtener(user.empresaId!, id, user);
  }

  @Post()
  @Permisos(PERMISOS.CARGUES_CREAR)
  crear(@CurrentUser() user: AuthenticatedUser, @Body() dto: CrearCargueDto) {
    return this.cargues.crear(user.empresaId!, dto, user.id);
  }

  @Post(':id/confirmar')
  @Permisos(PERMISOS.CARGUES_CONFIRMAR)
  confirmar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.cargues.confirmar(user.empresaId!, id, user.id);
  }

  @Post(':id/anular')
  @Permisos(PERMISOS.CARGUES_ANULAR)
  anular(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.cargues.anular(user.empresaId!, id, user.id);
  }
}
