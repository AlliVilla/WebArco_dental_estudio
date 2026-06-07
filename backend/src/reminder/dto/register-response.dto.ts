import { IsEnum, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RespuestaPaciente {
  Confirmo = 'Confirmó',
  Cancelo = 'Canceló',
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Respuesta del paciente',
    enum: RespuestaPaciente,
    example: 'Confirmó',
  })
  @IsEnum(RespuestaPaciente)
  @IsNotEmpty()
  respuesta: RespuestaPaciente;

  @ApiProperty({
    description: 'ID del usuario que registra la respuesta',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  cambiado_por: number;
}
