import { IsString, IsNotEmpty, IsInt, IsDateString, IsOptional } from 'class-validator';

export class CreateConsentimientoDto {
  @IsNotEmpty()
  @IsInt()
  id_paciente: number;

  @IsNotEmpty()
  @IsDateString()
  fecha: string;

  @IsNotEmpty()
  @IsString()
  tipo_tratamiento: string;

  @IsNotEmpty()
  @IsInt()
  id_doctor: number;

  @IsOptional()
  @IsString()
  firma_paciente?: string;

  @IsOptional()
  @IsString()
  firma_doctor?: string;
}
