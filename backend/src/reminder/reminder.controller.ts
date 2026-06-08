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
  Res,
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
import type { Response } from 'express';
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

  @Privileges(30)
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

  @Privileges(45)
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
  @Get('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exportar historial filtrado (CSV)',
    description:
      'Exporta el historial de recordatorios en formato CSV con los filtros aplicados.',
  })
  @ApiQuery({
    name: 'id_persona',
    required: false,
    description: 'Filtrar por ID del paciente',
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
  })
  @ApiQuery({
    name: 'end',
    required: false,
    description: 'Fin del rango de fechas (YYYY-MM-DD)',
  })
  async exportCsv(
    @Query() query: QueryReminderHistoryDto,
    @Res() res: Response,
  ) {
    const csv = await this.reminderService.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=recordatorios_${new Date().toISOString().split('T')[0]}.csv`,
    );
    res.send(csv);
  }
}
