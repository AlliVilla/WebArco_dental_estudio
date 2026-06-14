import { Module } from '@nestjs/common';
import { PagoConsultaController } from './pago-consulta.controller';
import { PagoConsultaService } from './pago-consulta.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PagoConsultaController],
  providers: [PagoConsultaService],
})
export class PagoConsultaModule {}
