import { Module } from '@nestjs/common';
import { PagoPacienteController } from './pago-paciente.controller';
import { PagoPacienteService } from './pago-paciente.service';

@Module({
  controllers: [PagoPacienteController],
  providers: [PagoPacienteService],
})
export class PagoPacienteModule {}
