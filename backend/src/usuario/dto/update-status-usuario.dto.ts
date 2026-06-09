import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateStatusUsuarioDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  activo: boolean;
}