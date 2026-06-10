import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TipoMovimiento } from '@prisma/client';

export class GetMovementHistoryDto {
  @ApiPropertyOptional({ description: 'Texto para buscar por producto, código o responsable', example: 'INS-001' })
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  search?: string;

  @ApiPropertyOptional({ description: 'ID del insumo', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID del insumo debe ser un número entero' })
  id_insumo?: number;

  @ApiPropertyOptional({ description: 'Tipo de movimiento', enum: TipoMovimiento, example: TipoMovimiento.Entrada })
  @IsOptional()
  @IsEnum(TipoMovimiento, { message: 'Tipo de movimiento inválido' })
  tipo?: TipoMovimiento;

  @ApiPropertyOptional({ description: 'Fecha inicial', example: '2026-06-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha inicial debe tener formato válido' })
  fechaInicio?: string;

  @ApiPropertyOptional({ description: 'Fecha final', example: '2026-06-10' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha final debe tener formato válido' })
  fechaFin?: string;

  @ApiPropertyOptional({ description: 'Página de resultados', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number;

  @ApiPropertyOptional({ description: 'Cantidad de registros por página', example: 25, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(100, { message: 'El límite máximo permitido es 100' })
  limit?: number;
}
