import { Module } from '@nestjs/common';
import { DepartamentoController } from './departamento.controller';
import { DepartamentoService } from './departamento.service';

@Module({
  controllers: [DepartamentoController],
  providers: [DepartamentoService],
})
export class DepartamentoModule {}
