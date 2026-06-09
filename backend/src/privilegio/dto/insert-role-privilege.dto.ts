import { IsInt, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InsertRolePrivilegeDto {
  @ApiProperty({
    description: 'ID del rol',
    example: 1,
  })
  @IsInt({ message: 'id_rol debe ser un número entero' })
  id_rol: number;

  @ApiProperty({
    description: 'Lista de IDs de privilegios',
    example: [1, 2, 3],
  })
  @IsArray({ message: 'privilegios debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'Debe enviar al menos un privilegio' })
  id_privilegios: number[];
}