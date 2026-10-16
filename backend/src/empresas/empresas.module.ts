import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';
import { MiEmpresaController } from './mi-empresa.controller';

@Module({
  controllers: [EmpresasController, MiEmpresaController],
  providers: [EmpresasService],
  exports: [EmpresasService],
})
export class EmpresasModule {}
