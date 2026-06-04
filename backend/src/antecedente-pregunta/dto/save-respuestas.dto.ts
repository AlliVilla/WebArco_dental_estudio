import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RespuestaItemDto {
  @IsInt()
  @Min(1)
  id_pregunta: number;

  @IsBoolean()
  respuestaBoolean: boolean;

  @IsOptional()
  @IsString()
  explanation?: string;
}
