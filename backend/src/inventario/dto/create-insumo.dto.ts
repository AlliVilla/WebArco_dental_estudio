import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';
import { CategoriaInsumo, UnidadMedidaInsumo } from '@prisma/client';

export class CreateInsumoDto {
  @ApiProperty({ example: 'Anestesia Lidocaína 2%' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del insumo es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede exceder 150 caracteres' })
  nombre: string;

  @ApiProperty({ enum: CategoriaInsumo, example: 'Anestesia' })
  @IsEnum(CategoriaInsumo, { message: 'Categoría inválida' })
  categoria: CategoriaInsumo;

  @ApiProperty({ enum: UnidadMedidaInsumo, example: 'Frasco' })
  @IsEnum(UnidadMedidaInsumo, { message: 'Unidad de medida inválida' })
  unidad_medida: UnidadMedidaInsumo;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt({ message: 'El stock actual debe ser un número entero' })
  @Min(0, { message: 'El stock actual no puede ser negativo' })
  stock_actual: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt({ message: 'El stock mínimo debe ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  stock_minimo: number;

  @ApiProperty({ example: 120.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El precio debe ser numérico con máximo dos decimales' })
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  precio_costo: number;
}
