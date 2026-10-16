import { Module } from '@nestjs/common';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { SuscripcionesModule } from '../suscripciones/suscripciones.module';

@Module({
  imports: [SuscripcionesModule],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
