import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoMovimiento } from '@prisma/client';

export class CreateMovimientoDto {
  @ApiProperty({ description: 'ID del insumo', example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El producto es obligatorio' })
  id_insumo: number;

  @ApiProperty({
    description: 'Tipo de movimiento',
    enum: TipoMovimiento,
    example: TipoMovimiento.Entrada,
  })
  @IsEnum(TipoMovimiento, { message: 'Tipo de movimiento inválido' })
  tipo: TipoMovimiento;

  @ApiProperty({ description: 'Cantidad a mover', example: 5 })
  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @ApiPropertyOptional({
    description: 'Fecha del movimiento',
    example: '2026-06-09',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener un formato válido' })
  fecha?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario responsable',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El usuario responsable debe ser un número entero' })
  id_usuario?: number;

  @ApiPropertyOptional({
    description: 'Observaciones sobre el movimiento',
    example: 'Motivo, proveedor, procedimiento...',
  })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  @MaxLength(1000, {
    message: 'Las observaciones no pueden exceder 1000 caracteres',
  })
  observaciones?: string;
}