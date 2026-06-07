import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryConsentimientoDto {
  @IsOptional()
  @IsString()
  paciente?: string; // ID o nombre

  @IsOptional()
  @IsString()
  tratamiento?: string;

  @IsOptional()
  @IsIn(['completos', 'pendientes', 'incompletos', 'todos'])
  estado?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  doctor?: number; // ID del doctor

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  mes?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  anio?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
