import { IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateConfigDto {
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(480)
  minutos_anticipacion: number;

  @IsBoolean()
  email_notificaciones: boolean;
}
