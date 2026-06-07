import { IsString, IsNotEmpty, IsInt, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsentimientoDto {
  @ApiProperty({ description: 'ID del paciente asociado al consentimiento', example: 1 })
  @IsNotEmpty()
  @IsInt()
  id_paciente: number;

  @ApiProperty({ description: 'Fecha del consentimiento (ISO 8601)', example: '2026-06-07T10:30:00Z' })
  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @ApiProperty({ description: 'Tipo de tratamiento para el consentimiento', example: 'Ortodoncia general' })
  @IsNotEmpty()
  @IsString()
  tipo_tratamiento: string;

  @ApiProperty({ description: 'ID del doctor responsable', example: 2 })
  @IsNotEmpty()
  @IsInt()
  id_doctor: number;

  @ApiPropertyOptional({ description: 'Firma digital del paciente en Base64', example: 'data:image/png;base64,iVBORw0KGgo...' })
  @IsOptional()
  @IsString()
  firma_paciente?: string;

  @ApiPropertyOptional({ description: 'Firma digital del doctor en Base64', example: 'data:image/png;base64,iVBORw0KGgo...' })
  @IsOptional()
  @IsString()
  firma_doctor?: string;
}
