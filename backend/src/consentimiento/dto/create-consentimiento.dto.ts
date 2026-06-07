import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateConsentimientoDto {
  @IsNotEmpty()
  @IsString()
  firma_paciente: string;

  @IsNotEmpty()
  @IsBoolean()
  consentimiento: boolean;
}
