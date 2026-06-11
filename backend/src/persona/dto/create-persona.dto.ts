import {
  IsString,
  IsEmail,
  IsInt,
  IsEnum,
  IsOptional,
  IsDateString,
  Length,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Sexo {
  M = 'M',
  F = 'F',
}

export class CreatePersonaDto {
  @ApiProperty({ description: 'Número de identidad (13 dígitos)', example: '0501200000001' })
  @IsNotEmpty({ message: 'número de identidad es obligatorio' })
  @IsString({ message: 'número de identidad debe ser texto' })
  @Length(13, 13, {
    message: 'número de identidad debe tener exactamente 13 caracteres',
  })
  @Matches(/^\d+$/, {
    message: 'número de identidad debe contener solo números',
  })
  numero_identidad: string;

  @ApiProperty({ description: 'Primer nombre del paciente', example: 'Juan' })
  @IsNotEmpty({ message: 'primer nombre es obligatorio' })
  @IsString({ message: 'primer nombre debe ser texto' })
  primer_nombre: string;

  @ApiPropertyOptional({ description: 'Segundo nombre del paciente', example: 'Carlos' })
  @IsOptional()
  @IsString({ message: 'segundo nombre debe ser texto' })
  segundo_nombre?: string;

  @ApiProperty({ description: 'Primer apellido del paciente', example: 'López' })
  @IsNotEmpty({ message: 'primer apellido es obligatorio' })
  @IsString({ message: 'primer apellido debe ser texto' })
  primer_apellido: string;

  @ApiPropertyOptional({ description: 'Segundo apellido del paciente', example: 'Martínez' })
  @IsOptional()
  @IsString({ message: 'segundo apellido debe ser texto' })
  segundo_apellido?: string;

  @ApiProperty({ description: 'Fecha de nacimiento (YYYY-MM-DD)', example: '1995-04-12' })
  @IsNotEmpty({ message: 'fecha de nacimiento es obligatoria' })
  @IsDateString(
    {},
    { message: 'fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' },
  )
  fecha_nacimiento: string;

  @ApiProperty({ description: 'Número de teléfono', example: '88889991' })
  @IsNotEmpty({ message: 'teléfono es obligatorio' })
  @IsString({ message: 'teléfono debe ser texto' })
  telefono: string;

  @ApiPropertyOptional({ description: 'Correo electrónico', example: 'juan.lopez@gmail.com' })
  @IsOptional()
  @IsEmail({}, { message: 'correo electrónico debe ser válido' })
  correo_electronico?: string;

  @ApiProperty({ description: 'ID del municipio de residencia', example: 1 })
  @IsNotEmpty({ message: 'id_municipio es obligatorio' })
  @IsInt({ message: 'id_municipio debe ser un número entero' })
  id_municipio: number;

  @ApiPropertyOptional({ description: 'Dirección detallada', example: 'Barrio El Centro, frente al parque principal' })
  @IsOptional()
  @IsString({ message: 'dirección debe ser texto' })
  direccion_linea?: string;

  @ApiPropertyOptional({
    description: 'Listado serializado de enfermedades sistémicas seleccionadas',
    example: '["diabetes","hipertension"]',
  })
  @IsOptional()
  @IsString({ message: 'enfermedades debe ser texto' })
  enfermedades?: string;

  @ApiPropertyOptional({
    description: 'Descripción libre de otras enfermedades',
    example: 'Hipotiroidismo controlado',
  })
  @IsOptional()
  @IsString({ message: 'otras enfermedades debe ser texto' })
  otras_enfermedades?: string;

  @ApiPropertyOptional({
    description: 'Medicamentos actuales del paciente',
    example: 'Losartán 50mg cada mañana',
  })
  @IsOptional()
  @IsString({ message: 'medicamentos debe ser texto' })
  medicamentos?: string;

  @ApiPropertyOptional({
    description: 'Alergias registradas del paciente',
    example: 'Penicilina',
  })
  @IsOptional()
  @IsString({ message: 'alergias debe ser texto' })
  alergias?: string;

  @ApiPropertyOptional({
    description: 'Indica si ha tenido reacciones a la anestesia',
    example: 'no',
  })
  @IsOptional()
  @IsString({ message: 'reacción a anestesia debe ser texto' })
  reaccion_anestesia?: string;

  @ApiProperty({ description: 'Sexo', enum: Sexo, example: 'M' })
  @IsNotEmpty({ message: 'sexo es obligatorio' })
  @IsEnum(Sexo, { message: 'sexo debe ser M (Masculino) o F (Femenino)' })
  sexo: Sexo;
}
