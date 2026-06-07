import {
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EstadoCita {
  programada = 'programada',
  confirmada = 'confirmada',
  atendida = 'atendida',
  cancelada = 'cancelada',
  ausente = 'ausente',
  reprogramada = 'reprogramada',
}

export class CreateCitaDto {
  @ApiProperty({ description: 'ID del paciente', example: 1 })
  @IsNotEmpty({ message: 'id_persona es obligatorio' })
  @IsInt({ message: 'id_persona debe ser un número entero' })
  @Min(1, { message: 'id_persona debe ser mayor a 0' })
  id_persona: number;

  @ApiProperty({ description: 'ID del doctor', example: 1 })
  @IsNotEmpty({ message: 'id_usuario es obligatorio' })
  @IsInt({ message: 'id_usuario debe ser un número entero' })
  @Min(1, { message: 'id_usuario debe ser mayor a 0' })
  id_usuario: number;

  @ApiProperty({
    description: 'Fecha y hora de la cita (ISO 8601)',
    example: '2025-06-03T10:00:00Z',
  })
  @IsNotEmpty({ message: 'fecha_inicio es obligatoria' })
  @IsDateString({}, { message: 'fecha_inicio debe ser una fecha válida (ISO 8601)' })
  fecha_inicio: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora de fin (ISO 8601)',
    example: '2025-06-03T10:30:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'fecha_fin debe ser una fecha válida (ISO 8601)' })
  fecha_fin?: string;

  @ApiPropertyOptional({
    description: 'Tipo de cita',
    example: 'Consulta general',
    maxLength: 100,
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
    description: 'Estado inicial de la cita',
    enum: EstadoCita,
    example: 'programada',
  })
  @IsOptional()
  @IsEnum(EstadoCita, {
    message:
      'estado debe ser: programada, confirmada, atendida, cancelada, ausente o reprogramada',
  })
  estado?: EstadoCita;
}
