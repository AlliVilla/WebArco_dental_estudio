import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCierreDto {
  @IsOptional()
  @IsEnum(['Diario', 'Semanal', 'Quincenal', 'Mensual'], {
    message: 'Tipo de cierre no válido. Valores permitidos: Diario, Semanal, Quincenal, Mensual',
  })
  @ApiPropertyOptional({
    enum: ['Diario', 'Semanal', 'Quincenal', 'Mensual'],
    default: 'Diario',
    description: 'Período del cierre de caja',
  })
  tipo?: string;
}
