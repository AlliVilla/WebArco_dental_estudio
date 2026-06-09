import { IsInt, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPrivilegesRolDto {
  @ApiProperty({
    description: 'Lista de IDs de privilegios a asignar al rol',
    example: [1, 2, 3],
  })
  @IsArray({ message: 'id_privilegios debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'Debe enviar al menos un privilegio' })
  @IsInt({ each: true, message: 'Cada privilegio debe ser un número entero' })
  id_privilegios: number[];
}
