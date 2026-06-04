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

enum Sexo {
  M = 'M',
  F = 'F',
}

export class CreatePersonaDto {
  @IsNotEmpty({ message: 'número de identidad es obligatorio' })
  @IsString({ message: 'número de identidad debe ser texto' })
  @Length(13, 13, {
    message: 'número de identidad debe tener exactamente 13 caracteres',
  })
  @Matches(/^\d+$/, {
    message: 'número de identidad debe contener solo números',
  })
  numero_identidad: string;

  @IsNotEmpty({ message: 'primer nombre es obligatorio' })
  @IsString({ message: 'primer nombre debe ser texto' })
  primer_nombre: string;

  @IsOptional()
  @IsString({ message: 'segundo nombre debe ser texto' })
  segundo_nombre?: string;

  @IsNotEmpty({ message: 'primer apellido es obligatorio' })
  @IsString({ message: 'primer apellido debe ser texto' })
  primer_apellido: string;

  @IsOptional()
  @IsString({ message: 'segundo apellido debe ser texto' })
  segundo_apellido?: string;

  @IsNotEmpty({ message: 'fecha de nacimiento es obligatoria' })
  @IsDateString(
    {},
    { message: 'fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)' },
  )
  fecha_nacimiento: string;

  @IsNotEmpty({ message: 'teléfono es obligatorio' })
  @IsString({ message: 'teléfono debe ser texto' })
  telefono: string;

  @IsOptional()
  @IsEmail({}, { message: 'correo electrónico debe ser válido' })
  correo_electronico?: string;

  @IsNotEmpty({ message: 'id_ciudad es obligatorio' })
  @IsInt({ message: 'id_ciudad debe ser un número entero' })
  id_ciudad: number;

  @IsOptional()
  @IsString({ message: 'dirección debe ser texto' })
  direccion_linea?: string;

  @IsNotEmpty({ message: 'sexo es obligatorio' })
  @IsEnum(Sexo, { message: 'sexo debe ser M (Masculino) o F (Femenino)' })
  sexo: Sexo;
}
