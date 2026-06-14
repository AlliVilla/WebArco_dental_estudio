import { IsInt, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePagoPacienteDto {
  @ApiProperty({ description: 'ID de la consulta', example: 1 })
  @IsInt()
  id_consulta: number;

  @ApiProperty({ description: 'Fecha del pago', example: '2026-06-13' })
  @IsString()
  fecha: string;

  @ApiProperty({ description: 'Monto del abono', example: 500 })
  @IsNumber()
  @Min(1)
  abono: number;

  @ApiPropertyOptional({ description: 'Observación del pago', example: 'Segundo abono' })
  @IsOptional()
  @IsString()
  observacion?: string;
}
