import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, MaxLength, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTratamientoDto {
  @ApiProperty({ description: 'ID de la especialidad', example: 1 })
  @IsInt({ message: 'La especialidad debe ser un número válido' })
  @IsNotEmpty({ message: 'La especialidad es obligatoria' })
  idEspecialidad: number;

  @ApiProperty({ description: 'Nombre del tratamiento', example: 'Blanqueamiento dental' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(150)
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción o notas técnicas' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'Estado a asignar en odontograma', example: 'Corona' })
  @IsString()
  @IsNotEmpty({ message: 'El impacto en odontograma es obligatorio' })
  @MaxLength(60)
  impactoOdontograma: string;

  @ApiProperty({ description: 'Precio base en Lempiras', example: 1200 })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio no puede ser negativo' })
  precio: number;
}
