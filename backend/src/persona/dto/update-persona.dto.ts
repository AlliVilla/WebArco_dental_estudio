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
import { CreatePersonaDto } from './create-persona.dto';

enum Sexo {
  M = 'M',
  F = 'F',
}

export class UpdatePersonaDto extends PartialType(CreatePersonaDto) {
  @IsOptional()
  @IsString({ message: 'número de identidad debe ser texto' })
  @Length(13, 13, {
    message: 'número de identidad debe tener exactamente 13 caracteres',
  })
  @Matches(/^\d+$/, {
    message: 'número de identidad debe contener solo números',
  })
  numero_identidad?: string;

  @IsOptional()
  @IsString({ message: 'primer nombre debe ser texto' })
  primer_nombre?: string;

  @IsOptional()
  @IsString({ message: 'segundo nombre debe ser texto' })
  segundo_nombre?: string;

  @IsOptional()
  @IsString({ message: 'primer apellido debe ser texto' })
  primer_apellido?: string;

  @IsOptional()
  @IsString({ message: 'segundo apellido debe ser texto' })
  segundo_apellido?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' },
  )
  fecha_nacimiento?: string;

  @IsOptional()
  @IsString({ message: 'teléfono debe ser texto' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'correo electrónico debe ser válido' })
  correo_electronico?: string;

  @IsOptional()
  @IsInt({ message: 'id_ciudad debe ser un número entero' })
  id_ciudad?: number;

  @IsOptional()
  @IsString({ message: 'dirección debe ser texto' })
  direccion_linea?: string;

  @IsOptional()
  @IsEnum(Sexo, { message: 'sexo debe ser M (Masculino) o F (Femenino)' })
  sexo?: Sexo;
}
