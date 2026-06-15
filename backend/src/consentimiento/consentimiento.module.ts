import { Module } from '@nestjs/common';
import { ConsentimientoController } from './consentimiento.controller';
import { ConsentimientoService } from './consentimiento.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [ConsentimientoController],
  providers: [ConsentimientoService],
})
export class ConsentimientoModule {}
