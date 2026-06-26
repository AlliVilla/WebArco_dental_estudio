import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ReminderService } from './reminder.service';
import { SendReminderDto } from './dto/send-reminder.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { QueryReminderHistoryDto } from './dto/query-reminder.dto';
import { CanalRecordatorio, EstadoRespuesta } from '@prisma/client';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Recordatorios (Reminders)')
@Controller('reminders')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Privileges(30)
  @Get('queue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cola de recordatorios pendientes de envío',
    description:
      'Devuelve las citas programadas que aún no tienen recordatorio enviado y los recordatorios enviados que esperan respuesta.',
  })
  @ApiOkResponse({ description: 'Cola de recordatorios pendientes' })
  async getQueue() {
    return this.reminderService.getQueue();
  }

  @Privileges(31)
  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Historial de confirmaciones (últimos 30 días)',
    description:
      'Obtiene el historial de recordatorios enviados con filtros combinados por paciente, estado, canal y rango de fechas.',
  })
  @ApiQuery({
    name: 'id_persona',
    required: false,
    description: 'Filtrar por ID del paciente',
    example: 1,
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado de respuesta',
    enum: EstadoRespuesta,
  })
  @ApiQuery({
    name: 'canal',
    required: false,
    description: 'Filtrar por canal de envío',
    enum: CanalRecordatorio,
  })
  @ApiQuery({
    name: 'start',
    required: false,
    description: 'Inicio del rango de fechas (YYYY-MM-DD)',
    example: '2026-06-01',
  })
  @ApiQuery({
    name: 'end',
    required: false,
    description: 'Fin del rango de fechas (YYYY-MM-DD)',
    example: '2026-06-30',
  })
  @ApiOkResponse({ description: 'Historial de recordatorios' })
  async getHistory(@Query() query: QueryReminderHistoryDto) {
    return this.reminderService.getHistory(query);
  }

  @Privileges(30)
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Estadísticas de recordatorios',
    description:
      'Totales: confirmadas, canceladas, sin respuesta, pendientes y tasa de respuesta de los últimos 30 días.',
  })
  @ApiOkResponse({ description: 'Estadísticas de recordatorios' })
  async getStats() {
    return this.reminderService.getStats();
  }

  @Privileges(30)
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enviar recordatorio manual a un paciente',
    description:
      'Envía un recordatorio a un paciente por el canal especificado (WhatsApp, SMS o Correo) y marca la cita como notificada.',
  })
  @ApiCreatedResponse({ description: 'Recordatorio enviado exitosamente' })
  @ApiBadRequestResponse({ description: 'Cita no apta para recordatorio' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada' })
  async send(@Body() dto: SendReminderDto) {
    return this.reminderService.send(dto);
  }

  @Privileges(32)
  @Patch(':id/response')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar respuesta del paciente',
    description:
      'Registra la respuesta del paciente (Confirmó/Canceló). Si confirma, la cita pasa a "confirmada". Si cancela, la cita se marca como "reprogramada".',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del recordatorio',
    example: 1,
  })
  @ApiOkResponse({ description: 'Respuesta registrada exitosamente' })
  @ApiNotFoundResponse({ description: 'Recordatorio no encontrado' })
  @ApiBadRequestResponse({ description: 'El recordatorio ya tiene respuesta' })
  async registerResponse(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterResponseDto,
  ) {
    return this.reminderService.registerResponse(id, dto.respuesta, dto.cambiado_por);
  }

  @Privileges(30)
  @Post('cola-envio/reintentar/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reintentar envío de recordatorio fallido',
    description:
      'Fuerza el reintento de un recordatorio en estado pendiente, actualizando su fecha de envío.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del recordatorio a reintentar',
    example: 1,
  })
  @ApiOkResponse({ description: 'Reintento registrado exitosamente' })
  @ApiNotFoundResponse({ description: 'Recordatorio no encontrado' })
  @ApiBadRequestResponse({ description: 'El recordatorio no está en estado pendiente' })
  async retryReminder(@Param('id', ParseIntPipe) id: number) {
    return this.reminderService.retry(id);
  }

  @Privileges(30)
  @Patch(':id/discard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Descartar recordatorio de la cola',
    description:
      'Marca un recordatorio pendiente como sin_respuesta para sacarlo de la cola de envíos, o marca una cita como notificada.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del recordatorio o cita a descartar (ej. rec-12 o cita-45)',
    example: 'rec-12',
  })
  @ApiOkResponse({ description: 'Descartado exitosamente' })
  @ApiNotFoundResponse({ description: 'No encontrado' })
  async discardReminder(@Param('id') id: string) {
    if (id.startsWith('cita-')) {
      const realId = parseInt(id.replace('cita-', ''), 10);
      return this.reminderService.discardCita(realId);
    }
    const realId = id.startsWith('rec-') ? parseInt(id.replace('rec-', ''), 10) : parseInt(id, 10);
    return this.reminderService.discardReminder(realId);
  }

}
