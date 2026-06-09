import {
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Nombre del rol', example: 'admin' })
  @IsOptional()
  @IsString({ message: 'El nombre del rol debe ser texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({ description: 'Descripción del rol', example: 'Rol con todos los permisos' })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Estado del rol', example: true })
  @IsOptional()
  @IsBoolean({ message: 'el estado del rol debe ser true o false' })
  activo?: boolean;
}