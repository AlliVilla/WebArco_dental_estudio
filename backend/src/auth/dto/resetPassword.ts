import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ 
    description: 'Token JWT de recuperación recibido por correo',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
  })
  @IsNotEmpty({ message: 'El token es obligatorio' })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  token: string;

  @ApiProperty({ 
    description: 'La nueva contraseña que el usuario desea registrar', 
    example: 'NuevaContrasena123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  newPassword: string;
}