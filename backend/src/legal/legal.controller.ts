import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { LegalService } from './legal.service';
import { AceptarDocumentosDto } from './dto/aceptacion-legal.dto';

@Controller('legal/aceptaciones')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('pendientes')
  pendientes(@CurrentUser() usuario: AuthenticatedUser) {
    return this.legalService.pendientes(usuario);
  }

  @Post()
  aceptar(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: AceptarDocumentosDto,
    @Req() req: Request,
  ) {
    return this.legalService.aceptar(
      usuario,
      dto,
      req.ip,
      req.get('user-agent') ?? null,
    );
  }

  @Get('mias')
  historial(@CurrentUser() usuario: AuthenticatedUser) {
    return this.legalService.historial(usuario);
  }
}
