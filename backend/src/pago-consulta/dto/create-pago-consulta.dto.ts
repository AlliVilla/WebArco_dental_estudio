import { IsInt, IsNumber, IsString, IsOptional, IsArray, ArrayNotEmpty, ValidateNested, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MetodoPago } from '@prisma/client';

export class AbonoDistribucionDto {
  @ApiProperty({ description: 'ID del TratamientoPaciente', example: 1 })
  @IsInt()
  tratamientoPacienteId: number;

  @ApiProperty({ description: 'Monto a abonar a este tratamiento', example: 500 })
  @IsNumber()
  @Min(1)
  montoAbonado: number;
}

export class CreatePagoConsultaDto {
  @ApiProperty({ description: 'ID de la consulta', example: 1 })
  @IsInt()
  consultaId: number;

  @ApiProperty({ description: 'Monto total del pago', example: 1000 })
  @IsNumber()
  @Min(1)
  monto: number;

  @ApiProperty({ description: 'Método de pago', enum: MetodoPago, example: 'EFECTIVO' })
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  @ApiPropertyOptional({ description: 'Cuenta destino (BAC, Ficohsa, etc.)', example: 'BAC' })
  @IsOptional()
  @IsString()
  cuentaDestino?: string;

  @ApiPropertyOptional({ description: 'Observación', example: 'Abono a brackets' })
  @IsOptional()
  @IsString()
  observacion?: string;

  @ApiProperty({
    description: 'Distribución del pago entre tratamientos activos',
    type: [AbonoDistribucionDto],
    example: [{ tratamientoPacienteId: 1, montoAbonado: 500 }],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AbonoDistribucionDto)
  abonos: AbonoDistribucionDto[];
}
