import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';
import { MiEmpresaController } from './mi-empresa.controller';
import { SuscripcionesModule } from '../suscripciones/suscripciones.module';

@Module({
  imports: [SuscripcionesModule],
  controllers: [EmpresasController, MiEmpresaController],
  providers: [EmpresasService],
  exports: [EmpresasService],
})
export class EmpresasModule {}
