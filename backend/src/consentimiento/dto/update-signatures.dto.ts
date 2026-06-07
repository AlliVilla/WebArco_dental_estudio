import { IsString, IsOptional } from 'class-validator';

export class UpdateSignaturesDto {
  @IsOptional()
  @IsString()
  firma_paciente?: string;

  @IsOptional()
  @IsString()
  firma_doctor?: string;
}
