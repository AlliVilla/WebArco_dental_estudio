import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { TipoMovimientoInventario } from '@prisma/client';

export class CreateMovimientoDto {
  @ApiProperty({ enum: TipoMovimientoInventario, example: 'Entrada' })
  @IsEnum(TipoMovimientoInventario, { message: 'Tipo de movimiento inválido' })
  tipo: TipoMovimientoInventario;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'El producto es obligatorio' })
  id_insumo: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @ApiProperty({ example: '2026-06-09' })
  @IsDateString({}, { message: 'La fecha debe tener un formato válido' })
  fecha: string;

  @ApiProperty({ example: 'Dr. Karla Arita' })
  @IsString({ message: 'El responsable debe ser texto' })
  @IsNotEmpty({ message: 'El responsable es obligatorio' })
  @MaxLength(120, { message: 'El responsable no puede exceder 120 caracteres' })
  responsable: string;

  @ApiPropertyOptional({ example: 'Motivo, proveedor, procedimiento...' })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}
