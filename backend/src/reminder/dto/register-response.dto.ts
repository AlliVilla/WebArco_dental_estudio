import { IsEnum, IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RespuestaPaciente {
  Confirmo = 'Confirmo',
  Cancelo = 'Cancelo',
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Respuesta del paciente',
    enum: RespuestaPaciente,
    example: 'Confirmo',
  })
  @IsEnum(RespuestaPaciente)
  @IsNotEmpty()
  respuesta: RespuestaPaciente;

  @ApiProperty({
    description: 'ID del usuario que registra la respuesta',
    example: 1,
  })
  @IsInt()
  cambiado_por: number;
}
