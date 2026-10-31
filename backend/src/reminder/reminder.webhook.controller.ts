import {
  Controller,
  Post,
  Body,
  HttpCode,
  Headers,
  Res,
  Get,
  Param,
  Query,
  ForbiddenException,
  ParseIntPipe,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { validateRequest } from 'twilio';
import { ReminderService } from './reminder.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('webhooks')
export class ReminderWebhookController {
  constructor(private readonly reminderService: ReminderService) {}

  @Public()
  @Post('twilio')
  @HttpCode(200)
  async twilioWebhook(
    @Body() body: Record<string, string>,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const secret = process.env.TWILIO_AUTH_TOKEN;
    const url = process.env.TWILIO_WEBHOOK_URL;
    if (
      process.env.ENABLE_TWILIO_WEBHOOK !== 'true' ||
      !secret ||
      !url ||
      !signature ||
      !req.is('application/x-www-form-urlencoded') ||
      req.originalUrl.includes('?') ||
      !validateRequest(secret, signature, url, body)
    )
      throw new ForbiddenException('Webhook no autorizado');
    if (
      typeof body.From !== 'string' ||
      typeof body.Body !== 'string' ||
      body.Body.length > 1000
    )
      throw new BadRequestException('Mensaje inválido');
    await this.reminderService.handleTwilioWebhook(body.From, body.Body);
    res.type('text/xml').send('<Response></Response>');
  }

  @Public()
  @Get('email-response/:citaId')
  async emailResponse(
    @Param('citaId', ParseIntPipe) citaId: number,
    @Query('token') token: string,
    @Query('action') action: string,
    @Res() res: Response,
  ) {
    await this.reminderService.validateEmailToken(citaId, action, token);
    res.set({
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy':
        "default-src 'none'; form-action 'self'; frame-ancestors 'none'",
    });
    // token and action were strictly validated. GET only displays a confirmation.
    res
      .type('html')
      .send(
        `<!doctype html><html lang="es"><meta charset="utf-8"><title>Responder cita</title><h1>Confirmar respuesta</h1><p>Respuesta seleccionada: ${action}</p><form method="post"><input type="hidden" name="token" value="${token}"><input type="hidden" name="action" value="${action}"><button type="submit">Registrar mi respuesta</button></form></html>`,
      );
  }

  @Public()
  @Post('email-response/:citaId')
  @HttpCode(200)
  async submitEmailResponse(
    @Param('citaId', ParseIntPipe) citaId: number,
    @Body('token') token: string,
    @Body('action') action: string,
    @Res() res: Response,
  ) {
    await this.reminderService.handleEmailResponse(citaId, action, token);
    res.set({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
    res
      .type('html')
      .send(
        '<!doctype html><html lang="es"><meta charset="utf-8"><title>Respuesta registrada</title><p>Gracias. Tu respuesta ha sido registrada.</p></html>',
      );
  }
}
