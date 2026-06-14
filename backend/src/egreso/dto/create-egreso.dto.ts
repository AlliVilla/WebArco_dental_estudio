import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum CategoriaEgreso {
  Insumos = 'Insumos',
  Equipos = 'Equipos',
  Nomina = 'Nómina',
  Servicios = 'Servicios',
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
}