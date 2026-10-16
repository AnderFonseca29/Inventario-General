import { Controller, Get } from '@nestjs/common';
import { PermisosService } from './permisos.service';
import { Permisos } from '../common/decorators/permisos.decorator';
import { PERMISOS } from '../common/constants/permisos';

@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Get()
  @Permisos(PERMISOS.ROLES_VER)
  listar() {
    return this.permisosService.listar();
  }
}
