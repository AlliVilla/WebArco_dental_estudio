import { Module } from '@nestjs/common';
import { ExpedienteClinicoController } from './expediente-clinico.controller';
import { ExpedienteClinicoService } from './expediente-clinico.service';

@Module({
  controllers: [ExpedienteClinicoController],
  providers: [ExpedienteClinicoService],
  exports: [ExpedienteClinicoService],
})
export class ExpedienteClinicoModule {}
