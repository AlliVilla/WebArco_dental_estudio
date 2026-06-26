import 'reflect-metadata';
import { IsOptional, IsString, validate } from 'class-validator';

class TestDto {
  @IsOptional()
  @IsString()
  field?: string | null;
}

async function test() {
  const dto = new TestDto();
  dto.field = null as any;
  const errors = await validate(dto);
  console.log('Errors:', errors.length);
}
test();
