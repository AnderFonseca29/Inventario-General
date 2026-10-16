import { Module } from '@nestjs/common';
import { SuscripcionesService } from './suscripciones.service';

@Module({
  providers: [SuscripcionesService],
  exports: [SuscripcionesService],
})
export class SuscripcionesModule {}
