import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { DerechosService } from './derechos.service';
import {
  ConsultarDerechosDto,
  CrearSolicitudDerechosDto,
  ListarDerechosDto,
  ResponderDerechosDto,
} from './dto/derecho.dto';
import { Public } from '../common/decorators/public.decorator';
import { SoloSuperAdmin } from '../common/decorators/superadmin.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

@Controller('derechos')
export class DerechosController {
  constructor(private readonly derechosService: DerechosService) {}

  @Public()
  @Post()
  crear(@Body() dto: CrearSolicitudDerechosDto, @Req() req: Request) {
    return this.derechosService.crear(
      dto,
      req.ip,
      req.get('user-agent') ?? null,
    );
  }

  @Public()
  @Get('consulta/:radicado')
  consultar(
    @Param('radicado') radicado: string,
    @Query() query: ConsultarDerechosDto,
  ) {
    return this.derechosService.consultar(radicado, query.correo);
  }

  @SoloSuperAdmin()
  @Get()
  listar(@Query() dto: ListarDerechosDto) {
    return this.derechosService.listar(dto);
  }

  @SoloSuperAdmin()
  @Get(':id')
  obtener(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.derechosService.obtener(id);
  }

  @SoloSuperAdmin()
  @Patch(':id/responder')
  responder(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResponderDerechosDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    return this.derechosService.responder(id, dto, user.id, req.ip);
  }
}
