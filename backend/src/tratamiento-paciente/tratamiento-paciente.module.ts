import { Module } from '@nestjs/common';
import { TratamientoPacienteController } from './tratamiento-paciente.controller';
import { TratamientoPacienteService } from './tratamiento-paciente.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TratamientoPacienteController],
  providers: [TratamientoPacienteService],
})
export class TratamientoPacienteModule {}
