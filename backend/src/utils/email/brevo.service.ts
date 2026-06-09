import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface SendMailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class BrevoService {
  private readonly logger = new Logger(BrevoService.name);

  constructor(private configService: ConfigService) {}

  async sendMail({ to, subject, html, text }: SendMailOptions): Promise<any> {
    const senderEmail = 
      this.configService.get<string>('BREVO_SENDER_EMAIL') || 
      this.configService.get<string>('EMAIL_USER') || 
      'haroldhdiaz@gmail.com';

    const senderName = this.configService.get<string>('BREVO_SENDER_NAME') || 'DENTAL CENTER';
    const apiKey = this.configService.get<string>('BREVO_API_KEY');

    // Aseguramos formato de destinatarios para Brevo
    const toRecipients = Array.isArray(to) 
      ? to.map((email) => ({ email })) 
      : [{ email: to }];

    const data = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: toRecipients,
      subject: subject,
      htmlContent: html,
      textContent: text || html.replace(/<[^>]+>/g, ''),
    };

    if (!apiKey) {
      this.logger.error('BREVO_API_KEY no está configurada en las variables de entorno.');
      return;
    }

    try {
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Error de Brevo API: ${JSON.stringify(error.response?.data || error.message)}`,
      );
    }
  }
}