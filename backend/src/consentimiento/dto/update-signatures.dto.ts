import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSignaturesDto {
  @ApiPropertyOptional({ description: 'Firma digital del paciente en Base64', example: 'data:image/png;base64,iVBORw0KGgo...' })
  @IsOptional()
  @IsString()
  firma_paciente?: string;

  @ApiPropertyOptional({ description: 'Firma digital del doctor en Base64', example: 'data:image/png;base64,iVBORw0KGgo...' })
  @IsOptional()
  @IsString()
  firma_doctor?: string;
}
