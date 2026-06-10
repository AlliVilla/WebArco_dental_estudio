import { IsInt, IsEnum, IsString, IsOptional, IsDefined, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TipoMovimiento {
  Entrada = 'Entrada',
  Salida = 'Salida'
}

export class CreateMovimientoDto {
  @ApiProperty({ description: 'ID del insumo' })
  @IsDefined({ message: 'El ID del insumo es requerido' })
  @IsInt()
  id_insumo: number;

  @ApiProperty({ description: 'Tipo de movimiento', enum: TipoMovimiento })
  @IsDefined({ message: 'El tipo de movimiento es requerido' })
  @IsEnum(TipoMovimiento)
  tipo: TipoMovimiento;

  @ApiProperty({ description: 'Cantidad a mover' })
  @IsInt()
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @ApiPropertyOptional({ description: 'Observaciones sobre el movimiento' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
