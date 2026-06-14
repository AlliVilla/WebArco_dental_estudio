import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTratamientoPacienteDto {
  @ApiProperty({ description: 'ID del paciente', example: 1 })
  @IsNotEmpty()
  pacienteId: number;

  @ApiProperty({ description: 'Nombre del tratamiento', example: 'Brackets superiores e inferiores' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Costo total del tratamiento en Lempiras', example: 15000 })
  @IsNumber()
  @Min(0)
  costoTotal: number;

  @ApiProperty({ description: 'Fecha de inicio', example: '2026-06-01' })
  @IsDateString()
  fechaInicio: string;

  @ApiPropertyOptional({ description: 'Fecha de finalización', example: '2026-12-01' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
