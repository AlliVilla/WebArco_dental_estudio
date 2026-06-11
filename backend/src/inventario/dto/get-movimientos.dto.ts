import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { TipoMovimiento } from '@prisma/client';

export class GetMovimientosDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El ID del insumo debe ser un número entero' })
  id_insumo?: number;

  @ApiPropertyOptional({ enum: TipoMovimiento, example: TipoMovimiento.Entrada })
  @IsOptional()
  @IsEnum(TipoMovimiento, { message: 'Tipo de movimiento inválido' })
  tipo?: TipoMovimiento;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha inicial debe tener formato válido' })
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2026-06-10' })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha final debe tener formato válido' })
  fechaFin?: string;
}