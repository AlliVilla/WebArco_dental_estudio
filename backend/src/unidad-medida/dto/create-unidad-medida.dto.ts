import { IsString, IsDefined, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUnidadMedidaDto {
  @ApiProperty({ description: 'Nombre de la unidad de medida' })
  @IsDefined({ message: 'El nombre es requerido' })
  @IsString()
  @MaxLength(100)
  nombre: string;
}
