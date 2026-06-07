import { Module } from '@nestjs/common';
import { OdontogramaController } from './odontograma.controller';
import { OdontogramaService } from './odontograma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OdontogramaController],
  providers: [OdontogramaService],
})
export class OdontogramaModule {}
