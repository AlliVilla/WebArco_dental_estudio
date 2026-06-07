import {
  IsString,
  IsInt,
  IsOptional,
  IsDateString,
  IsBoolean,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsultaDto {
  @ApiProperty({ description: 'ID de la persona/paciente', example: 1 })
  @IsNotEmpty({ message: 'id_persona es obligatorio' })
  @IsInt({ message: 'id_persona debe ser un número entero' })
  @Min(1, { message: 'id_persona debe ser mayor a 0' })
  id_persona: number;

  @ApiProperty({ description: 'ID del usuario/doctor que atiende', example: 1 })
  @IsNotEmpty({ message: 'id_usuario es obligatorio' })
  @IsInt({ message: 'id_usuario debe ser un número entero' })
  @Min(1, { message: 'id_usuario debe ser mayor a 0' })
  id_usuario: number;

  @ApiPropertyOptional({ description: 'ID de la cita asociada (opcional)', example: 1 })
  @IsOptional()
  @IsInt({ message: 'id_cita debe ser un número entero' })
  @Min(1, { message: 'id_cita debe ser mayor a 0' })
  id_cita?: number;

  @ApiProperty({ description: 'Fecha y hora de inicio de la consulta (ISO 8601)', example: '2025-06-03T10:00:00Z' })
  @IsNotEmpty({ message: 'fecha_inicio es obligatoria' })
  @IsDateString({}, { message: 'fecha_inicio debe ser una fecha válida (ISO 8601)' })
  fecha_inicio: string;

  @ApiPropertyOptional({ description: 'Fecha y hora de fin de la consulta (ISO 8601)', example: '2025-06-03T10:30:00Z' })
  @IsOptional()
  @IsDateString({}, { message: 'fecha_fin debe ser una fecha válida (ISO 8601)' })
  fecha_fin?: string;

  @ApiPropertyOptional({ description: 'Motivo de la consulta', example: 'Dolor en muela del juicio' })
  @IsOptional()
  @IsString({ message: 'motivo debe ser texto' })
  motivo?: string;

  @ApiPropertyOptional({ description: 'Notas adicionales', example: 'Paciente requiere traducción' })
  @IsOptional()
  @IsString({ message: 'notas debe ser texto' })
  notas?: string;

  @ApiPropertyOptional({ description: 'Diagnóstico de la consulta', example: 'Caries dental en molar inferior' })
  @IsOptional()
  @IsString({ message: 'diagnóstico debe ser texto' })
  diagnostico?: string;

  @ApiPropertyOptional({ description: 'Tratamiento realizado o recomendado', example: 'Limpieza y empaste de resina compuesta' })
  @IsOptional()
  @IsString({ message: 'tratamiento debe ser texto' })
  tratamiento?: string;

  @ApiPropertyOptional({ description: 'Firma digital del paciente (base64 o texto)', example: 'data:image/png;base64,...' })
  @IsOptional()
  @IsString({ message: 'firma del paciente debe ser texto' })
  firma_paciente?: string;

  @ApiPropertyOptional({ description: 'Consentimiento informado del paciente', example: true })
  @IsOptional()
  @IsBoolean({ message: 'consentimiento debe ser un booleano' })
  consentimiento?: boolean;
}
