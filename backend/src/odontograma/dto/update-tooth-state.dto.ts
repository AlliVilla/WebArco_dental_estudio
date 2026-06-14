import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateToothStateDto {
  @ApiProperty({
    description: 'Estado clínico del diente',
    example: 'Caries',
  })
  @IsString()
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  estado: string;

  @ApiPropertyOptional({
    description: 'Observación sobre el estado del diente',
    example: 'Caries proximal en esmalte',
  })
  @IsOptional()
  @IsString({ message: 'observacion debe ser texto' })
  observacion?: string;
}
