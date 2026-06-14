import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoCita } from './create-cita.dto';

export class ChangeStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la cita',
    enum: EstadoCita,
    example: 'Confirmada',
  })
  @IsNotEmpty({ message: 'estado es obligatorio' })
  @IsEnum(EstadoCita, {
    message:
      'estado debe ser: Programada, Confirmada, Atendida, Cancelada, Ausente, No_asistio o reprogramada',
  })
  estado: EstadoCita;

  @ApiProperty({
    description: 'ID del usuario que realiza el cambio',
    example: 1,
  })
  @IsNotEmpty({ message: 'cambiado_por es obligatorio' })
  @IsInt({ message: 'cambiado_por debe ser un número entero' })
  @Min(1, { message: 'cambiado_por debe ser mayor a 0' })
  cambiado_por: number;
}
