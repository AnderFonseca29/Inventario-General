import { Body, Controller, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CookiesService } from './cookies.service';
import { RegistrarConsentimientoCookiesDto } from './dto/consentimiento-cookies.dto';

@Controller('cookies/consentimientos')
export class CookiesController {
  constructor(private readonly cookiesService: CookiesService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  registrar(@Body() dto: RegistrarConsentimientoCookiesDto, @Req() req: Request) {
    return this.cookiesService.registrar(dto, req.ip, req.get('user-agent') ?? null);
  }
}
