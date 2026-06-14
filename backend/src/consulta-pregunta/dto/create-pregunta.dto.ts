import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePreguntaDto {
  @ApiProperty({ description: 'Texto de la pregunta', example: '¿Tiene alguna alergia?' })
  @IsNotEmpty({ message: 'pregunta es obligatorio' })
  @IsString({ message: 'pregunta debe ser texto' })
  pregunta: string;

  @ApiProperty({ description: 'Número de orden en el formulario', example: 7 })
  @IsNotEmpty({ message: 'orden_num es obligatorio' })
  @IsInt({ message: 'orden_num debe ser un número entero' })
  @Min(1, { message: 'orden_num debe ser mayor a 0' })
  orden_num: number;

  @ApiPropertyOptional({ description: 'Indica si requiere explicación cuando la respuesta es afirmativa', example: false })
  @IsOptional()
  @IsBoolean({ message: 'requiere_explicacion debe ser un booleano' })
  requiere_explicacion?: boolean;

  @ApiPropertyOptional({ description: 'Indica si la pregunta es obligatoria', example: true })
  @IsOptional()
  @IsBoolean({ message: 'obligatorio debe ser un booleano' })
  obligatorio?: boolean;

  @ApiPropertyOptional({ description: 'Categoría de la pregunta', example: 'Antecedentes Médicos' })
  @IsOptional()
  @IsString({ message: 'categoria debe ser texto' })
  categoria?: string;
}
