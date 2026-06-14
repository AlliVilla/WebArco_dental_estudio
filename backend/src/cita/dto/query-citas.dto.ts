import { IsOptional, IsInt, IsDateString, Min, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoCita } from './create-cita.dto';
import { Type } from 'class-transformer';

export class QueryCalendarDto {
  @ApiPropertyOptional({
    description: 'Inicio del rango de fechas (YYYY-MM-DD o ISO 8601)',
    example: '2025-06-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'start debe ser una fecha válida' })
  start?: string;

  @ApiPropertyOptional({
    description: 'Fin del rango de fechas (YYYY-MM-DD o ISO 8601)',
    example: '2025-06-07',
  })
  @IsOptional()
  @IsDateString({}, { message: 'end debe ser una fecha válida' })
  end?: string;

  @ApiPropertyOptional({
    description: 'ID del doctor para filtrar',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'id_usuario debe ser un número entero' })
  @Min(1, { message: 'id_usuario debe ser mayor a 0' })
  id_usuario?: number;
}

export class QueryPatientHistoryDto {
  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor a 0' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Resultados por página',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor a 0' })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: EstadoCita,
    example: 'Programada',
  })
  @IsOptional()
  @IsEnum(EstadoCita, {
    message:
      'estado debe ser: Programada, Confirmada, Atendida, Cancelada, Ausente, No_asistio o reprogramada',
  })
  estado?: EstadoCita;

  @ApiPropertyOptional({
    description: 'Inicio del rango (YYYY-MM-DD o ISO 8601)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'start debe ser una fecha válida' })
  start?: string;

  @ApiPropertyOptional({
    description: 'Fin del rango (YYYY-MM-DD o ISO 8601)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'end debe ser una fecha válida' })
  end?: string;
}
