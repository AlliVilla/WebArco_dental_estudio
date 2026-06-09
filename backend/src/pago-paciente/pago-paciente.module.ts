import { Module } from '@nestjs/common';
import { PagoPacienteController } from './pago-paciente.controller';
import { PagoPacienteService } from './pago-paciente.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PagoPacienteController],
  providers: [PagoPacienteService],
})
export class PagoPacienteModule {}
