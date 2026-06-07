import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarFirmasDto {
  @ApiPropertyOptional({
    description: 'Firma digital del paciente en formato base64',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  @IsOptional()
  @IsString({ message: 'firma_paciente debe ser texto en formato base64' })
  @IsNotEmpty({ message: 'firma_paciente no puede ser una cadena vacía' })
  firma_paciente?: string;

  @ApiPropertyOptional({
    description:
      'Firma digital del doctor en formato base64. Se almacena en el perfil del usuario doctor.',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  @IsOptional()
  @IsString({ message: 'firma_doctor debe ser texto en formato base64' })
  @IsNotEmpty({ message: 'firma_doctor no puede ser una cadena vacía' })
  firma_doctor?: string;
}
