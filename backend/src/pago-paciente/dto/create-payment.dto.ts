import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID de la consulta asociada al pago', example: 1 })
  @IsNotEmpty({ message: 'id_consulta es obligatorio' })
  @IsInt({ message: 'id_consulta debe ser un número entero' })
  @Min(1, { message: 'id_consulta debe ser mayor a 0' })
  id_consulta: number;

  @ApiProperty({ description: 'Fecha del pago en formato ISO 8601', example: '2026-06-12' })
  @IsNotEmpty({ message: 'fecha es obligatoria' })
  @IsDateString({}, { message: 'fecha debe ser una fecha válida' })
  fecha: string;

  @ApiProperty({ description: 'Monto abonado por el paciente', example: 1500.5 })
  @IsNotEmpty({ message: 'abono es obligatorio' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'abono debe ser un número válido' })
  @Min(0.01, { message: 'abono debe ser mayor a 0' })
  abono: number;

  @ApiPropertyOptional({ description: 'Método de pago', example: 'Efectivo', enum: ['Efectivo', 'Tarjeta', 'Transferencia'] })
  @IsOptional()
  @IsIn(['Efectivo', 'Tarjeta', 'Transferencia'], { message: 'metodoPago debe ser Efectivo, Tarjeta o Transferencia' })
  metodoPago?: string;

  @ApiPropertyOptional({ description: 'Observación o nota del pago', example: 'Pago en efectivo' })
  @IsOptional()
  @IsString({ message: 'observacion debe ser texto' })
  observacion?: string;

  @ApiPropertyOptional({ description: 'Firma digital del paciente', example: 'data:image/png;base64,...' })
  @IsOptional()
  @IsString({ message: 'firma_paciente debe ser texto' })
  firma_paciente?: string;
}
