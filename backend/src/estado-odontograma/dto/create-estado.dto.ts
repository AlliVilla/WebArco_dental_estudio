import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEstadoDto {
  @ApiProperty({ description: 'Nombre del estado', example: 'Fractura' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ description: 'Color hexadecimal de la etiqueta', example: '#FF6B6B' })
  @IsString()
  @IsNotEmpty({ message: 'El color es obligatorio' })
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'El color debe ser un hexadecimal válido (#RRGGBB)' })
  @MaxLength(20)
  color: string;
}
