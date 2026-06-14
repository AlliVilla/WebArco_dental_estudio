import { Module } from '@nestjs/common';
import { EstadoOdontogramaController } from './estado-odontograma.controller';
import { EstadoOdontogramaService } from './estado-odontograma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EstadoOdontogramaController],
  providers: [EstadoOdontogramaService],
})
export class EstadoOdontogramaModule {}
