import { Module } from '@nestjs/common';
import { PagoPacienteController } from './pago-paciente.controller';
import { PagoPacienteService } from './pago-paciente.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PagoPacienteController],
  providers: [PagoPacienteService],
})
export class PagoPacienteModule {}
