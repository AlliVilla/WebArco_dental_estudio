import { IsInt, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CanalRecordatorio } from '@prisma/client';

export class SendReminderDto {
  @ApiProperty({ description: 'ID de la cita', example: 1 })
  @IsInt()
  id_cita: number;

  @ApiProperty({
    description: 'Canal de envío',
    enum: CanalRecordatorio,
    example: 'WhatsApp',
  })
  @IsEnum(CanalRecordatorio)
  @IsNotEmpty()
  canal: CanalRecordatorio;
}
