import { Module } from '@nestjs/common';
import { CategoriaInsumoController } from './categoria-insumo.controller';
import { CategoriaInsumoService } from './categoria-insumo.service';

@Module({
  controllers: [CategoriaInsumoController],
  providers: [CategoriaInsumoService],
})
export class CategoriaInsumoModule {}
