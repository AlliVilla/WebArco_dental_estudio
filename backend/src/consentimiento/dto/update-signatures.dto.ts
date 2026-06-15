// update-signatures.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateSignaturesDto {
  @IsOptional()
  @IsString()
  firma_paciente?: string;   // ahora será la URL guardada

  @IsOptional()
  @IsString()
  firma_doctor?: string;     // ahora será la URL guardada
}