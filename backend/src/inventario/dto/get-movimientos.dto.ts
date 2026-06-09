import { IsOptional, IsInt, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMovimiento } from './create-movimiento.dto';

export class GetMovimientosDto {
  @ApiPropertyOptional({ description: 'ID del insumo' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id_insumo?: number;

  @ApiPropertyOptional({ description: 'Tipo de movimiento', enum: TipoMovimiento })
  @IsOptional()
  @IsEnum(TipoMovimiento)
  tipo?: TipoMovimiento;

  @ApiPropertyOptional({ description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fecha_inicio?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fecha_fin?: string;

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
