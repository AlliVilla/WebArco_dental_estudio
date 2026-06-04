import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RespuestaItemDto {
  @IsInt()
  @Min(1)
  id_pregunta: number;

  @IsOptional()
  @IsBoolean()
  respuestaBoolean?: boolean;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class SaveRespuestasDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespuestaItemDto)
  respuestas: RespuestaItemDto[];
}
