import { PartialType } from '@nestjs/mapped-types';
import { CreateCitaDto, EstadoCita } from './create-cita.dto';
import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCitaDto extends PartialType(CreateCitaDto) {
  @ApiPropertyOptional({ description: 'ID del paciente', example: 1 })
  @IsOptional()
  @IsInt({ message: 'id_persona debe ser un número entero' })
  @Min(1, { message: 'id_persona debe ser mayor a 0' })
  id_persona?: number;

  @ApiPropertyOptional({ description: 'ID del doctor', example: 1 })
  @IsOptional()
  @IsInt({ message: 'id_usuario debe ser un número entero' })
  @Min(1, { message: 'id_usuario debe ser mayor a 0' })
  id_usuario?: number;

  @ApiPropertyOptional({
    description: 'Fecha y hora de la cita (ISO 8601)',
    example: '2025-06-03T10:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'fecha_inicio debe ser una fecha válida (ISO 8601)' })
  fecha_inicio?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora de fin (ISO 8601)',
    example: '2025-06-03T10:30:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'fecha_fin debe ser una fecha válida (ISO 8601)' })
  fecha_fin?: string;

  @ApiPropertyOptional({
    description: 'Tipo de cita',
    maxLength: 100,
    example: 'Consulta general',
  })
  @IsOptional()
  @IsString({ message: 'tipo_cita debe ser texto' })
  @MaxLength(100, { message: 'tipo_cita no debe exceder 100 caracteres' })
  tipo_cita?: string;

  @ApiPropertyOptional({
    description: 'Motivo de la cita',
    example: 'Dolor en muela del juicio',
  })
  @IsOptional()
  @IsString({ message: 'motivo debe ser texto' })
  motivo?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales',
    example: 'Paciente requiere traducción',
  })
  @IsOptional()
  @IsString({ message: 'notas debe ser texto' })
  notas?: string;

  @ApiPropertyOptional({
    description: 'Estado de la cita',
    enum: EstadoCita,
    example: 'Confirmada',
  })
  @IsOptional()
  @IsEnum(EstadoCita, {
    message:
      'estado debe ser: Programada, Confirmada, Atendida, Cancelada, Ausente, No_asistio o reprogramada',
  })
  estado?: EstadoCita;
}
