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

export class LoginDto{
    @ApiProperty({ description: 'Nombre de usuario', example: 'johndoe@gmail.com' })
    @IsNotEmpty({ message: 'nombre de usuario obligatorio' })
    @IsString({ message: 'nombre de usuario debe ser texto' })
    user: string;

    @ApiProperty({description: 'Contraseña', example: 'Password123'})
    @IsNotEmpty({message: 'contraseña obligatoria'})
    @IsString({message: 'contraseña debe ser texto'})
    password: string;

};