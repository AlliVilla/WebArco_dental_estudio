import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ESTADOS_VALIDOS = [
  'Sano',
  'Caries',
  'Obturación',
  'Extracción',
  'Ausente',
  'Endodoncia',
  'Corona',
  'Prótesis',
  'Implante',
  'Puente',
] as const;

export class UpdateToothStateDto {
  @ApiProperty({
    description: 'Estado clínico del diente',
    example: 'Caries',
    enum: ESTADOS_VALIDOS,
  })
  @IsIn(ESTADOS_VALIDOS, {
    message: `Estado inválido. Debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}`,
  })
  estado: string;

  @ApiPropertyOptional({
    description: 'Observación sobre el estado del diente',
    example: 'Caries proximal en esmalte',
  })
  @IsOptional()
  @IsString({ message: 'observacion debe ser texto' })
  observacion?: string;
}
