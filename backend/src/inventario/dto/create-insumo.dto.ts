import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInsumoDto {
  @ApiProperty({ example: 'Anestesia lidocaína' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  nombre: string;

  @ApiProperty({ example: 'Anestesia' })
  @IsString({ message: 'La categoría debe ser texto' })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @MaxLength(100, { message: 'La categoría no puede exceder 100 caracteres' })
  categoria: string;

  @ApiProperty({ example: 'Caja' })
  @IsString({ message: 'La unidad de medida debe ser texto' })
  @IsNotEmpty({ message: 'La unidad de medida es obligatoria' })
  @MaxLength(100, {
    message: 'La unidad de medida no puede exceder 100 caracteres',
  })
  unidad_medida: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsInt({ message: 'El stock actual debe ser un número entero' })
  @Min(0, { message: 'El stock actual no puede ser negativo' })
  stock_actual: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt({ message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  stock_minimo: number;

  @ApiProperty({ example: 150.5 })
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio de costo debe ser numérico' })
  @Min(0, { message: 'El precio de costo no puede ser negativo' })
  precio_costo: number;
}