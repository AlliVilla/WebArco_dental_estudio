import { Module } from '@nestjs/common';
import { AntecedentePreguntaController } from './antecedente-pregunta.controller';
import { AntecedentePreguntaService } from './antecedente-pregunta.service';

@Module({
  controllers: [AntecedentePreguntaController],
  providers: [AntecedentePreguntaService],
})
export class AntecedentePreguntaModule {}
