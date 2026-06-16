import { Module } from '@nestjs/common';
import { CitaController } from './cita.controller';
import { CitaService } from './cita.service';
import { NotificacionModule } from '../notificacion/notificacion.module';

@Module({
  imports: [NotificacionModule],
  controllers: [CitaController],
  providers: [CitaService],
})
export class CitaModule {}

