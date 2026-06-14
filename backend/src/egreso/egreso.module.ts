import { Module } from '@nestjs/common';
import { EgresoController } from './egreso.controller';
import { EgresoService } from './egreso.service';

@Module({
  controllers: [EgresoController],
  providers: [EgresoService],
})
export class EgresoModule {}