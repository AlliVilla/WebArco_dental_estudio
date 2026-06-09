import {
  IsString,
  IsEmail,
  IsInt,
  IsEnum,
  IsOptional,
  IsDateString,
  Length,
  Matches,
  IsNotEmpty,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto{
    @ApiProperty({ description: 'Número de identidad (13 dígitos)', example: '0501200000001' })
  @IsNotEmpty({ message: 'número de identidad es obligatorio' })
  @IsString({ message: 'número de identidad debe ser texto' })
  @Max(100)
  @Matches(/^\d+$/, {
    message: 'número de identidad debe contener solo números',
  })
}