import { Module } from '@nestjs/common';
import { InsumoController } from './insumo.controller';
import { InsumoService } from './insumo.service';

@Module({
  controllers: [InsumoController],
  providers: [InsumoService]
})
export class InsumoModule {}
