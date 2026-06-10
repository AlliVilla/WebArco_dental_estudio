import { IsString, IsInt, IsNumber, Min, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInsumoDto {
  @ApiProperty({ description: 'Nombre del insumo' })
  @IsString()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({ description: 'ID de la categoría' })
  @IsInt()
  id_categoria: number;

  @ApiProperty({ description: 'ID de la unidad de medida' })
  @IsInt()
  id_unidad: number;

  @ApiPropertyOptional({ description: 'Stock inicial', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock_actual?: number;

  @ApiPropertyOptional({ description: 'Stock mínimo de alerta', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock_minimo?: number;

  @ApiProperty({ description: 'Precio costo unitario' })
  @IsNumber()
  @Min(0)
  precio_costo: number;
}
