import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum CategoriaEgreso {
  Insumos = 'Insumos',
  Equipos = 'Equipos',
  Nomina = 'Nómina',
  Servicios = 'Servicios',
}

export class EgresoInsumoDto {
  @ApiProperty({ description: 'ID del Insumo', example: 1 })
  @IsInt()
  id_insumo: number;

  @ApiProperty({ description: 'Cantidad a restar de inventario', example: 5 })
  @IsInt()
  @Min(1)
  cantidad: number;
}

export class CreateEgresoDto {
  @ApiProperty({
    description: 'Concepto o descripción del gasto',
    example: 'Compra de guantes látex x500',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  concepto: string;

  @ApiProperty({
    description: 'Monto del egreso',
    example: 450,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;

  @ApiProperty({
    description: 'Categoría válida del gasto',
    enum: CategoriaEgreso,
    example: CategoriaEgreso.Insumos,
  })
  @IsEnum(CategoriaEgreso, {
    message: 'La categoría debe ser una de: Insumos, Equipos, Nómina, Servicios',
  })
  categoria: CategoriaEgreso;

  @ApiProperty({
    description: 'Fecha del egreso en formato ISO',
    example: '2026-06-12',
  })
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales del egreso',
    example: 'Compra realizada para abastecimiento semanal',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;

  @ApiPropertyOptional({
    description: 'Lista de insumos a restar de inventario',
    type: [EgresoInsumoDto],
    example: [{ id_insumo: 1, cantidad: 5 }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EgresoInsumoDto)
  insumos?: EgresoInsumoDto[];
}