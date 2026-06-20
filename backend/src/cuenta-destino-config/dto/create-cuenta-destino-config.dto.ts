import { IsString, IsDefined, IsIn, IsOptional, IsNumber, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCuentaDestinoConfigDto {
  @ApiProperty({ description: 'Tipo de cuenta destino', example: 'TARJETA', enum: ['TARJETA', 'TRANSFERENCIA'] })
  @IsDefined({ message: 'El tipo es requerido' })
  @IsString()
  @IsIn(['TARJETA', 'TRANSFERENCIA'], { message: 'El tipo debe ser TARJETA o TRANSFERENCIA' })
  tipo: string;

  @ApiProperty({ description: 'Nombre de la cuenta destino', example: 'BAC' })
  @IsDefined({ message: 'El nombre es requerido' })
  @IsString()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ description: 'Comisión en porcentaje', example: 2.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La comisión debe ser un número válido' })
  @Min(0, { message: 'La comisión no puede ser negativa' })
  @Max(100, { message: 'La comisión no puede superar 100%' })
  comision?: number;
}
