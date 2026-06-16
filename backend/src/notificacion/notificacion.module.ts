import { Module } from '@nestjs/common';
import { NotificacionController } from './notificacion.controller';
import { NotificacionService } from './notificacion.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BrevoService } from '../utils/email/brevo.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [NotificacionController],
  providers: [NotificacionService, BrevoService],
  exports: [NotificacionService],
})
export class NotificacionModule {}
