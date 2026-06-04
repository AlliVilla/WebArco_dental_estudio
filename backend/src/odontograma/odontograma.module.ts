import { Module } from '@nestjs/common';
import { OdontogramaController } from './odontograma.controller';
import { OdontogramaService } from './odontograma.service';

@Module({
  controllers: [OdontogramaController],
  providers: [OdontogramaService],
})
export class OdontogramaModule {}
