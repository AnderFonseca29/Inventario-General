import { Module } from '@nestjs/common';
import { DerechosController } from './derechos.controller';
import { DerechosService } from './derechos.service';

@Module({
  controllers: [DerechosController],
  providers: [DerechosService],
})
export class DerechosModule {}
