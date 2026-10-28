import { Controller, Get } from '@nestjs/common';
import { ResumenService } from './resumen.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user';

// Endpoint personal: cualquier usuario autenticado obtiene Únicamente su
// propio resumen. No requiere permisos de modulo.
@Controller('resumen')
export class ResumenController {
  constructor(private readonly resumen: ResumenService) {}

  @Get('mi-resumen')
  miResumen(@CurrentUser() user: AuthenticatedUser) {
    return this.resumen.miResumen(user);
  }
}
