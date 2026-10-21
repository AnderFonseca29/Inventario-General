import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { AuthModule } from './auth/auth.module';
import { EmpresasModule } from './empresas/empresas.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';
import { ModulosModule } from './modulos/modulos.module';
import { CatalogosModule } from './catalogos/catalogos.module';
import { InventarioModule } from './inventario/inventario.module';
import { CarguesModule } from './cargues/cargues.module';
import { ProduccionModule } from './produccion/produccion.module';
import { MembresiaModule } from './membresia/membresia.module';
import { ReportesModule } from './reportes/reportes.module';
import { ResumenModule } from './resumen/resumen.module';
import { PermisosModule } from './permisos/permisos.module';
import { SuscripcionesModule } from './suscripciones/suscripciones.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermisosGuard } from './common/guards/permisos.guard';
import { SuperAdminGuard } from './common/guards/superadmin.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuditoriaModule,
    AuthModule,
    EmpresasModule,
    UsuariosModule,
    RolesModule,
    ModulosModule,
    CatalogosModule,
    InventarioModule,
    CarguesModule,
    ProduccionModule,
    MembresiaModule,
    ReportesModule,
    ResumenModule,
    PermisosModule,
    SuscripcionesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermisosGuard },
    { provide: APP_GUARD, useClass: SuperAdminGuard },
  ],
})
export class AppModule {}
