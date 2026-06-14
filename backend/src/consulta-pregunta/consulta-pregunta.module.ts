import { Module } from '@nestjs/common';
import { ConsultaPreguntaController } from './consulta-pregunta.controller';
import { ConsultaPreguntaService } from './consulta-pregunta.service';

@Module({
  controllers: [ConsultaPreguntaController],
  providers: [ConsultaPreguntaService],
})
export class ConsultaPreguntaModule {}
