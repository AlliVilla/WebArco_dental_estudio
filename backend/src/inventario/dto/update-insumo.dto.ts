import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateInsumoDto } from './create-insumo.dto';

class UpdateInsumoBaseDto extends OmitType(CreateInsumoDto, [
  'stock_actual',
] as const) {}

export class UpdateInsumoDto extends PartialType(UpdateInsumoBaseDto) {}
