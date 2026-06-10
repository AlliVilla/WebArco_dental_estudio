import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetInsumosDto {
  @ApiPropertyOptional({ description: 'Buscar por nombre o código' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por categoría' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_categoria?: number;

  @ApiPropertyOptional({ description: 'Filtrar por estado: bajo, agotado, normal' })
  @IsOptional()
  @IsString()
  stock_status?: 'bajo' | 'agotado' | 'normal';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}