import { PartialType } from '@nestjs/mapped-types';
import { CreateCuentaDestinoConfigDto } from './create-cuenta-destino-config.dto';

export class UpdateCuentaDestinoConfigDto extends PartialType(CreateCuentaDestinoConfigDto) {}
