import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sexo } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: '0801199900001' })
  @IsNotEmpty()
  @IsString()
  @Length(13, 13)
  @Matches(/^\d+$/)
  numero_identidad: string;

  @ApiProperty({ example: 'Juan' })
  @IsNotEmpty()
  @IsString()
  primer_nombre: string;

  @ApiPropertyOptional({ example: 'Carlos' })
  @IsOptional()
  @IsString()
  segundo_nombre?: string;

  @ApiProperty({ example: 'Pérez' })
  @IsNotEmpty()
  @IsString()
  primer_apellido: string;

  @ApiPropertyOptional({ example: 'López' })
  @IsOptional()
  @IsString()
  segundo_apellido?: string;

  @ApiProperty({ example: '1999-05-20' })
  @IsNotEmpty()
  @IsDateString()
  fecha_nacimiento: string;

  @ApiProperty({ example: '99999999' })
  @IsNotEmpty()
  @IsString()
  telefono: string;

  @ApiPropertyOptional({ example: 'juan.perez@gmail.com' })
  @IsOptional()
  @IsEmail()
  correo_electronico?: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_departamento: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_municipio: number;

  @ApiPropertyOptional({ example: 'Barrio El Centro, casa 12' })
  @IsOptional()
  @IsString()
  direccion_linea?: string;

  @ApiProperty({ example: 'M', enum: Sexo })
  @IsEnum(Sexo)
  sexo: Sexo;

  @ApiProperty({ example: 'jperez' })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_rol: number;

  @ApiProperty({ example: 'Temporal123' })
  @IsString()
  @MinLength(8)
  password_temporal: string;

  @ApiPropertyOptional({ example: 'firma-base64-o-url' })
  @IsOptional()
  @IsString()
  firma?: string;
}