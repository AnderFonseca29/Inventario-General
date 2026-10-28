import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequiereEmpresa } from '../common/decorators/permisos.decorator';
import { SinSuscripcion } from '../common/decorators/sin-suscripcion.decorator';
import { exigirEmpresa } from '../common/guards/tenant.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { SuscripcionesService } from './suscripciones.service';

@Controller('suscripciones')
export class SuscripcionesController {
  constructor(private readonly suscripciones: SuscripcionesService) {}

  /**
   * Estado de la suscripcion de la empresa del usuario. Lo consume el aviso del
   * shell y la pantalla de bloqueo, por eso cualquier usuario de la empresa
   * puede leerlo (sin permiso adicional) y no se le aplica el propio bloqueo.
   */
  @Get('mi-plan')
  @RequiereEmpresa()
  @SinSuscripcion()
  miPlan(@CurrentUser() user: AuthenticatedUser) {
    return this.suscripciones.estadoEmpresa(exigirEmpresa(user));
  }
}
