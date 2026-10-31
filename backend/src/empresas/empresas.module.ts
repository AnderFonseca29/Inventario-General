import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { AprovisionamientoService } from './aprovisionamiento.service';
import { EmpresasController } from './empresas.controller';
import { MiEmpresaController } from './mi-empresa.controller';

@Module({
  controllers: [EmpresasController, MiEmpresaController],
  providers: [EmpresasService, AprovisionamientoService],
  exports: [EmpresasService, AprovisionamientoService],
})
export class EmpresasModule {}
