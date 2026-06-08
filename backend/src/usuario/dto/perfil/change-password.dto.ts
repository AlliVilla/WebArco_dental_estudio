import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Actual123!' })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'Nueva123!' })
  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @ApiProperty({ example: 'Nueva123!' })
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}