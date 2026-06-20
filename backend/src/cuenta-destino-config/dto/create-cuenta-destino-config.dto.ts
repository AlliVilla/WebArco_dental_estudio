import { IsString, IsDefined, IsIn, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCuentaDestinoConfigDto {
  @ApiProperty({ description: 'Tipo de cuenta destino', example: 'TARJETA', enum: ['TARJETA', 'TRANSFERENCIA'] })
  @IsDefined({ message: 'El tipo es requerido' })
  @IsString()
  @IsIn(['TARJETA', 'TRANSFERENCIA'], { message: 'El tipo debe ser TARJETA o TRANSFERENCIA' })
  tipo: string;

  @ApiProperty({ description: 'Nombre de la cuenta destino', example: 'BAC' })
  @IsDefined({ message: 'El nombre es requerido' })
  @IsString()
  @MaxLength(100)
  nombre: string;
}
