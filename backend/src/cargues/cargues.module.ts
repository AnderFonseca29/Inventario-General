import { Module } from '@nestjs/common';
import { CarguesController } from './cargues.controller';
import { CarguesService } from './cargues.service';

@Module({
  controllers: [CarguesController],
  providers: [CarguesService],
  exports: [CarguesService],
})
export class CarguesModule {}
