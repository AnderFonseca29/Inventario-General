import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { EmpresasService } from './empresas.service';
import {
  CreateEmpresaDto,
  UpdateEmpresaDto,
  UpdateEstadoEmpresaDto,
} from './dto/empresa.dto';
import { SoloSuperAdmin } from '../common/decorators/superadmin.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('empresas')
@SoloSuperAdmin()
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Post()
  crear(
    @Body() dto: CreateEmpresaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.empresasService.crear(dto, user.id, req.ip);
  }

  @Get()
  listar() {
    return this.empresasService.listar();
  }

  @Get(':id')
  obtener(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.empresasService.obtener(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEmpresaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.empresasService.actualizar(id, dto, user.id, req.ip);
  }

  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEstadoEmpresaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.empresasService.cambiarEstado(id, dto.estado, user.id, req.ip);
  }
}
