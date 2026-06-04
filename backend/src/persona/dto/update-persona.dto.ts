import {
  IsString,
  IsEmail,
  IsInt,
  IsEnum,
  IsOptional,
  IsDateString,
  Length,
  Matches,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonaDto, Sexo } from './create-persona.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePersonaDto extends PartialType(CreatePersonaDto) {
  @ApiPropertyOptional({ description: 'Número de identidad (13 dígitos)', example: '0501200000001' })
  @IsOptional()
  @IsString({ message: 'número de identidad debe ser texto' })
  @Length(13, 13, {
    message: 'número de identidad debe tener exactamente 13 caracteres',
  })
  @Matches(/^\d+$/, {
    message: 'número de identidad debe contener solo números',
  })
  numero_identidad?: string;

  @ApiPropertyOptional({ description: 'Primer nombre del paciente', example: 'Juan' })
  @IsOptional()
  @IsString({ message: 'primer nombre debe ser texto' })
  primer_nombre?: string;

  @ApiPropertyOptional({ description: 'Segundo nombre del paciente', example: 'Carlos' })
  @IsOptional()
  @IsString({ message: 'segundo nombre debe ser texto' })
  segundo_nombre?: string;

  @ApiPropertyOptional({ description: 'Primer apellido del paciente', example: 'López' })
  @IsOptional()
  @IsString({ message: 'primer apellido debe ser texto' })
  primer_apellido?: string;

  @ApiPropertyOptional({ description: 'Segundo apellido del paciente', example: 'Martínez' })
  @IsOptional()
  @IsString({ message: 'segundo apellido debe ser texto' })
  segundo_apellido?: string;

  @ApiPropertyOptional({ description: 'Fecha de nacimiento (YYYY-MM-DD)', example: '1995-04-12' })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' },
  )
  fecha_nacimiento?: string;

  @ApiPropertyOptional({ description: 'Número de teléfono', example: '88889991' })
  @IsOptional()
  @IsString({ message: 'teléfono debe ser texto' })
  telefono?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico', example: 'juan.lopez@gmail.com' })
  @IsOptional()
  @IsEmail({}, { message: 'correo electrónico debe ser válido' })
  correo_electronico?: string;

  @ApiPropertyOptional({ description: 'ID del municipio/ciudad de residencia', example: 1 })
  @IsOptional()
  @IsInt({ message: 'id_ciudad debe ser un número entero' })
  id_ciudad?: number;

  @ApiPropertyOptional({ description: 'Dirección detallada', example: 'Barrio El Centro, frente al parque principal' })
  @IsOptional()
  @IsString({ message: 'dirección debe ser texto' })
  direccion_linea?: string;

  @ApiPropertyOptional({ description: 'Sexo', enum: Sexo, example: 'M' })
  @IsOptional()
  @IsEnum(Sexo, { message: 'sexo debe ser M (Masculino) o F (Femenino)' })
  sexo?: Sexo;
}
