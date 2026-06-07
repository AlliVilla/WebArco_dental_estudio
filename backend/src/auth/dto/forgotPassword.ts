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

export class ForgotPasswordDto{
    @ApiProperty({description: 'correo del usuario', example: 'johndoe@gmail.com'})
    @IsNotEmpty({ message: 'correo eléctronico obligatorio' })
    @IsString({ message: 'correo eléctronico debe ser texto' })
    @IsEmail({},{message: 'Texto debe tener formato de correo eléctronico'})
    email: string;
}