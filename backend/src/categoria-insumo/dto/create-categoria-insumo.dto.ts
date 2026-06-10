import { IsString, IsDefined, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoriaInsumoDto {
  @ApiProperty({ description: 'Nombre de la categoría' })
  @IsDefined({ message: 'El nombre es requerido' })
  @IsString()
  @MaxLength(100)
  nombre: string;
}
