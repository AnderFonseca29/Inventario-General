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
import { MembresiaService } from './membresia.service';
import {
  CreateClienteDto,
  CreateMembresiaDto,
  CreatePlanMembresiaDto,
  ListarClientesDto,
  ListarMembresiasDto,
  ListarPlanesMembresiaDto,
  RenovarMembresiaDto,
  UpdateClienteDto,
  UpdatePlanMembresiaDto,
} from './dto/membresia.dto';
import {
  Permisos,
  RequiereEmpresa,
} from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { exigirEmpresa } from '../common/guards/tenant.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@RequiereEmpresa()
@Controller('membresia')
export class MembresiaController {
  constructor(private readonly membresia: MembresiaService) {}

  // -------------------------------- Clientes -------------------------------

  @Get('clientes')
  @Permisos(PERMISOS.MEMBRESIA_VER)
  listarClientes(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarClientesDto,
  ) {
    return this.membresia.listarClientes(exigirEmpresa(user), filtros);
  }

  @Post('clientes')
  @Permisos(PERMISOS.MEMBRESIA_ADMINISTRAR)
  crearCliente(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateClienteDto,
    @Req() req: Request,
  ) {
    return this.membresia.crearCliente(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
  }

  @Patch('clientes/:id')
  @Permisos(PERMISOS.MEMBRESIA_ADMINISTRAR)
  actualizarCliente(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateClienteDto,
    @Req() req: Request,
  ) {
    return this.membresia.actualizarCliente(
      exigirEmpresa(user),
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete('clientes/:id')
  @Permisos(PERMISOS.MEMBRESIA_ADMINISTRAR)
  eliminarCliente(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.membresia.eliminarCliente(exigirEmpresa(user), id);
  }

  // ----------------------------- Planes de membresia -----------------------

  @Get('planes')
  @Permisos(PERMISOS.MEMBRESIA_VER)
  listarPlanes(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarPlanesMembresiaDto,
  ) {
    return this.membresia.listarPlanesMembresia(exigirEmpresa(user), filtros);
  }

  @Post('planes')
  @Permisos(PERMISOS.MEMBRESIA_ADMINISTRAR)
  crearPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePlanMembresiaDto,
    @Req() req: Request,
  ) {
    return this.membresia.crearPlanMembresia(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
  }

  @Patch('planes/:id')
  @Permisos(PERMISOS.MEMBRESIA_ADMINISTRAR)
  actualizarPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePlanMembresiaDto,
    @Req() req: Request,
  ) {
    return this.membresia.actualizarPlanMembresia(
      exigirEmpresa(user),
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Delete('planes/:id')
  @Permisos(PERMISOS.MEMBRESIA_ADMINISTRAR)
  eliminarPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.membresia.eliminarPlanMembresia(exigirEmpresa(user), id);
  }

  // ------------------------------ Afiliaciones -----------------------------

  @Get('membresias')
  @Permisos(PERMISOS.MEMBRESIA_VER)
  listarMembresias(
    @CurrentUser() user: AuthenticatedUser,
    @Query() filtros: ListarMembresiasDto,
  ) {
    return this.membresia.listarMembresias(exigirEmpresa(user), filtros);
  }

  @Post('membresias')
  @Permisos(PERMISOS.MEMBRESIA_AFILIAR)
  crearMembresia(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMembresiaDto,
    @Req() req: Request,
  ) {
    return this.membresia.crearMembresia(
      exigirEmpresa(user),
      dto,
      user.id,
      req.ip,
    );
  }

  @Post('membresias/:id/renovar')
  @Permisos(PERMISOS.MEMBRESIA_AFILIAR)
  renovarMembresia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RenovarMembresiaDto,
    @Req() req: Request,
  ) {
    return this.membresia.renovarMembresia(
      exigirEmpresa(user),
      id,
      dto,
      user.id,
      req.ip,
    );
  }

  @Post('membresias/:id/cancelar')
  @Permisos(PERMISOS.MEMBRESIA_AFILIAR)
  cancelarMembresia(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request,
  ) {
    return this.membresia.cancelarMembresia(
      exigirEmpresa(user),
      id,
      user.id,
      req.ip,
    );
  }
}
