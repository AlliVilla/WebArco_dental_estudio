<<<<<<< HEAD
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
=======
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
>>>>>>> main
  observaciones?: string;
}
