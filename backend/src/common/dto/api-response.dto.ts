import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: null, nullable: true })
  data: T | null;

  @ApiProperty({ example: 'Operación exitosa' })
  message: string;
}
