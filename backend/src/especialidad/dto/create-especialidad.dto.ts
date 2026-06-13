import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEspecialidadDto {
  @ApiProperty({ description: 'Nombre de la especialidad', example: 'Odontopediatría' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la especialidad es obligatorio' })
  @MaxLength(120)
  nombre: string;
}
