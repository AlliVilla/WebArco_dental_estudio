import { IsString, IsOptional, ValidateIf, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSignaturesDto {
  @ApiPropertyOptional({
    description: 'Firma digital del paciente en Base64. Requerida si no se envía firma_doctor.',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  @ValidateIf((o: UpdateSignaturesDto) => !o.firma_doctor)
  @IsNotEmpty({ message: 'Debe proporcionar al menos una firma (firma_paciente o firma_doctor)' })
  @IsOptional()
  @IsString()
  firma_paciente?: string;

  @ApiPropertyOptional({
    description: 'Firma digital del doctor en Base64 (se guarda como snapshot histórico de esta consulta). Requerida si no se envía firma_paciente.',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  @ValidateIf((o: UpdateSignaturesDto) => !o.firma_paciente)
  @IsNotEmpty({ message: 'Debe proporcionar al menos una firma (firma_paciente o firma_doctor)' })
  @IsOptional()
  @IsString()
  firma_doctor?: string;
}
