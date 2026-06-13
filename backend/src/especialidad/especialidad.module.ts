import { Module } from '@nestjs/common';
import { EspecialidadController } from './especialidad.controller';
import { EspecialidadService } from './especialidad.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EspecialidadController],
  providers: [EspecialidadService],
})
export class EspecialidadModule {}
