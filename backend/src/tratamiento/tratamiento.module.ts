import { Module } from '@nestjs/common';
import { TratamientoController } from './tratamiento.controller';
import { TratamientoService } from './tratamiento.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TratamientoController],
  providers: [TratamientoService],
})
export class TratamientoModule {}
