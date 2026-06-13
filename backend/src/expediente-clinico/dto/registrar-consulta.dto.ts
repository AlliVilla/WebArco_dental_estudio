import {
  IsInt,
  IsDateString,
  IsString,
  IsOptional,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrarConsultaDto {
  @ApiProperty({
    description: 'ID del usuario/doctor que atiende la consulta',
    example: 1,
  })
  @IsNotEmpty({ message: 'id_usuario es obligatorio' })
  @IsInt({ message: 'id_usuario debe ser un número entero' })
  @Min(1, { message: 'id_usuario debe ser mayor a 0' })
  id_usuario: number;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la consulta (ISO 8601)',
    example: '2026-06-07T10:00:00Z',
  })
  @IsNotEmpty({ message: 'fecha_inicio es obligatoria' })
  @IsDateString({}, { message: 'fecha_inicio debe ser una fecha válida (ISO 8601)' })
  fecha_inicio: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora de fin de la consulta (ISO 8601)',
    example: '2026-06-07T10:45:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'fecha_fin debe ser una fecha válida (ISO 8601)' })
  fecha_fin?: string;

  @ApiPropertyOptional({
    description: 'Diagnóstico emitido durante la consulta',
    example: 'Caries interproximal en molar inferior derecho',
  })
  @IsOptional()
  @IsString({ message: 'diagnostico debe ser texto' })
  diagnostico?: string;

  @ApiPropertyOptional({
    description: 'Tratamiento realizado durante la consulta',
    example: 'Empaste de resina compuesta en pieza 46',
  })
  @IsOptional()
  @IsString({ message: 'tratamiento debe ser texto' })
  tratamiento?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales del doctor sobre la consulta',
    example: 'Paciente con sensibilidad en sector posterior. Control en 2 semanas.',
  })
  @IsOptional()
  @IsString({ message: 'notas_adicionales debe ser texto' })
  notas_adicionales?: string;

  @ApiPropertyOptional({
    description: 'Firma digital del paciente (base64)',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  @IsOptional()
  @IsString({ message: 'firma_paciente debe ser texto en formato base64' })
  firma_paciente?: string;

  @ApiPropertyOptional({
    description: 'Firma digital del doctor (base64), se almacena en el perfil del usuario',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  @IsOptional()
  @IsString({ message: 'firma_doctor debe ser texto en formato base64' })
  firma_doctor?: string;
}
