import { ApiPropertyOptional } from '@nestjs/swagger';
import { Sexo } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ example: '0801199900001' })
  @IsOptional()
  @IsString()
  @Length(13, 13)
  @Matches(/^\d+$/)
  numero_identidad?: string;

  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  primer_nombre?: string;

  @ApiPropertyOptional({ example: 'Carlos' })
  @IsOptional()
  @IsString()
  segundo_nombre?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  primer_apellido?: string;

  @ApiPropertyOptional({ example: 'López' })
  @IsOptional()
  @IsString()
  segundo_apellido?: string;

  @ApiPropertyOptional({ example: '1999-05-20' })
  @IsOptional()
  @IsDateString()
  fecha_nacimiento?: string;

  @ApiPropertyOptional({ example: '99999999' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'juan.perez@gmail.com' })
  @IsOptional()
  @IsEmail()
  correo_electronico?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_departamento?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_municipio?: number;

  @ApiPropertyOptional({ example: 'Barrio El Centro, casa 12' })
  @IsOptional()
  @IsString()
  direccion_linea?: string;

  @ApiPropertyOptional({ example: 'M', enum: Sexo })
  @IsOptional()
  @IsEnum(Sexo)
  sexo?: Sexo;

  @ApiPropertyOptional({ example: 'jperez' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_rol?: number;

  @ApiPropertyOptional({ example: 'firma-base64-o-url' })
  @IsOptional()
  @IsString()
  firma?: string;
}