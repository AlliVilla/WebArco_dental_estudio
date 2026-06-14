import { Controller, Post, Body, HttpCode, HttpStatus, Headers, Req, Res, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReminderService } from './reminder.service';
import type { Request } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks')
export class ReminderWebhookController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post('twilio')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook para respuestas de Twilio (WhatsApp)',
    description: 'Recibe la respuesta del paciente ("SI" o "NO") y actualiza el estado del recordatorio.',
  })
  async twilioWebhook(@Body() body: any, @Res() res: any) {
    console.log('====== WEBHOOK TWILIO RECIBIDO ======');
    console.log(body);
    
    if (body && body.From && body.Body) {
      await this.reminderService.handleTwilioWebhook(body.From, body.Body);
    } else {
      console.log('El webhook no contiene From o Body. Headers u otro formato?');
    }
    
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  }

  @Get('email-response/:citaId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook para respuestas desde botones de correo electrónico',
  })
  async emailResponse(
    @Param('citaId') citaId: string, 
    @Query('action') action: string, 
    @Res() res: any
  ) {
    const parsedCitaId = parseInt(citaId, 10);
    res.set('Content-Type', 'text/html');
    try {
      await this.reminderService.handleEmailResponse(parsedCitaId, action);
      res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
          <h2>¡Gracias! Hemos registrado tu respuesta: ${action === 'Confirmo' ? 'Confirmado ✅' : 'Cancelado ❌'}</h2>
          <p>Puedes cerrar esta ventana.</p>
        </div>
      `);
    } catch (error: any) {
      res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #E24B4A;">
          <h2>No pudimos procesar tu respuesta</h2>
          <p>${error.message || 'Ha ocurrido un error inesperado.'}</p>
          <p>Puedes cerrar esta ventana.</p>
        </div>
      `);
    }
  }
}
