import { Global, Module } from '@nestjs/common';
import { PermisosCacheService } from './permisos-cache.service';

@Global()
@Module({
  providers: [PermisosCacheService],
  exports: [PermisosCacheService],
})
export class CacheModule {}
