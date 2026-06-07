import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryConsentimientoDto {
  @ApiPropertyOptional({ description: 'ID o nombre del paciente para filtrar', example: 'Juan' })
  @IsOptional()
  @IsString()
  paciente?: string;

  @ApiPropertyOptional({ description: 'Tipo de tratamiento para filtrar', example: 'Ortodoncia' })
  @IsOptional()
  @IsString()
  tratamiento?: string;

  @ApiPropertyOptional({
    description: 'Estado de las firmas del consentimiento. Los valores retornados por la API son en singular (completo/pendiente/incompleto); este filtro los acepta en plural.',
    enum: ['completos', 'pendientes', 'incompletos', 'todos'],
    example: 'pendientes',
  })
  @IsOptional()
  @IsIn(['completos', 'pendientes', 'incompletos', 'todos'])
  estado?: string;

  @ApiPropertyOptional({ description: 'ID del doctor para filtrar', example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  doctor?: number;

  @ApiPropertyOptional({ description: 'Mes del consentimiento (1-12)', minimum: 1, maximum: 12, example: 6 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  mes?: number;

  @ApiPropertyOptional({ description: 'Año del consentimiento', example: 2026 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  anio?: number;

  @ApiPropertyOptional({
    description: 'Número de página para paginación',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Límite de resultados por página',
    minimum: 1,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
