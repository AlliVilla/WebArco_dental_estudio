import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReminderController } from './reminder.controller';
import { ReminderService } from './reminder.service';
import { BrevoService } from '../utils/email/brevo.service';
import { ReminderWebhookController } from './reminder.webhook.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ReminderController, ReminderWebhookController],
  providers: [ReminderService, BrevoService],
})
export class ReminderModule {}
