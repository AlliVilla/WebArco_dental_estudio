import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CanalRecordatorio, EstadoRespuesta } from '@prisma/client';

export class QueryReminderHistoryDto {
  @ApiPropertyOptional({ description: 'ID del paciente', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_persona?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de respuesta',
    enum: EstadoRespuesta,
  })
  @IsOptional()
  @IsEnum(EstadoRespuesta)
  estado?: EstadoRespuesta;

  @ApiPropertyOptional({
    description: 'Filtrar por canal',
    enum: CanalRecordatorio,
  })
  @IsOptional()
  @IsEnum(CanalRecordatorio)
  canal?: CanalRecordatorio;

  @ApiPropertyOptional({ description: 'Inicio del rango de fechas', example: '2026-06-01' })
  @IsOptional()
  @IsString()
  start?: string;

  @ApiPropertyOptional({ description: 'Fin del rango de fechas', example: '2026-06-30' })
  @IsOptional()
  @IsString()
  end?: string;

  @ApiPropertyOptional({ description: 'Número de página', minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Resultados por página', minimum: 1, default: 10, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
