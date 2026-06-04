import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespuestaItemDto {
  @ApiProperty({ description: 'ID de la pregunta de antecedente', example: 1 })
  @IsInt()
  @Min(1)
  id_pregunta: number;

  @ApiProperty({ description: 'Respuesta del paciente (verdadero/falso)', example: true })
  @IsBoolean()
  respuestaBoolean: boolean;

  @ApiPropertyOptional({ description: 'Explicación adicional (requerida si la pregunta tiene requiere_explicacion=true y la respuesta es afirmativa)', example: 'Diabetes tipo 2' })
  @IsOptional()
  @IsString()
  explanation?: string;
}
