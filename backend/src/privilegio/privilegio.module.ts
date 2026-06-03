import { Module } from '@nestjs/common';
import { PrivilegioController } from './privilegio.controller';
import { PrivilegioService } from './privilegio.service';

@Module({
  controllers: [PrivilegioController],
  providers: [PrivilegioService],
})
export class PrivilegioModule {}
