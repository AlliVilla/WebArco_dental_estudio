import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  CanalRecordatorio,
  EstadoCita,
  EstadoRespuesta,
} from '@prisma/client';
import { SendReminderDto } from './dto/send-reminder.dto';
import { RespuestaPaciente } from './dto/register-response.dto';
import { QueryReminderHistoryDto } from './dto/query-reminder.dto';

const personaSelect = {
  id_persona: true,
  primer_nombre: true,
  segundo_nombre: true,
  primer_apellido: true,
  segundo_apellido: true,
  telefono: true,
  correo_electronico: true,
} satisfies Prisma.PersonaSelect;

const doctorSelect = {
  id_usuario: true,
  persona: { select: { primer_nombre: true, segundo_nombre: true, primer_apellido: true, segundo_apellido: true } },
} satisfies Prisma.UsuarioSelect;

const citaInclude = {
  persona: { select: personaSelect },
  doctor: { select: doctorSelect },
} satisfies Prisma.CitaInclude;

const recordatorioInclude = {
  cita: {
    include: {
      persona: { select: personaSelect },
      doctor: { select: doctorSelect },
    },
  },
} satisfies Prisma.RecordatorioInclude;

import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { BrevoService } from '../utils/email/brevo.service';
import { buildReminderEmail } from '../utils/email/html/reminder';

@Injectable()
export class ReminderService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private brevoService: BrevoService,
  ) { }

  async getQueue() {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const [citasPendientes, recordatoriosPendientes] = await Promise.all([
      this.prisma.cita.findMany({
        where: {
          estado: 'programada',
          recordatorio_enviado: false,
          fecha_inicio: { gte: startOfToday, lte: tomorrow },
        },
        include: citaInclude,
        orderBy: { fecha_inicio: 'asc' },
      }),
      this.prisma.recordatorio.findMany({
        where: { estado_respuesta: 'pendiente' },
        include: {
          cita: {
            include: { persona: { select: personaSelect } },
          },
        },
        orderBy: { fecha_envio: 'desc' },
      }),
    ]);

    return {
      pendientes_envio: citasPendientes,
      esperando_respuesta: recordatoriosPendientes,
    };
  }

  async send(sendReminderDto: SendReminderDto) {
    const cita = await this.prisma.cita.findUnique({
      where: { id_cita: sendReminderDto.id_cita },
      include: { persona: { select: personaSelect } },
    });

    if (!cita) {
      throw new NotFoundException(
        `No se encontró la cita con id ${sendReminderDto.id_cita}`,
      );
    }

    if (cita.estado !== 'programada') {
      throw new BadRequestException(
        'Solo se pueden enviar recordatorios para citas en estado "programada"',
      );
    }

    const pacienteNombre = [cita.persona?.primer_nombre, cita.persona?.primer_apellido].filter(Boolean).join(' ') || 'Paciente';
    const contacto = sendReminderDto.canal === 'Correo'
      ? cita.persona?.correo_electronico
      : cita.persona?.telefono;

    // Enviar el mensaje real antes de guardar en BD
    await this.enviarPorCanal(
      contacto ?? null, 
      sendReminderDto.canal as CanalRecordatorio, 
      pacienteNombre, 
      cita.fecha_inicio,
      cita.id_cita,
      cita.motivo,
      cita.tipo_cita
    );

    const [recordatorio] = await this.prisma.$transaction([
      this.prisma.recordatorio.create({
        data: {
          id_cita: cita.id_cita,
          canal: sendReminderDto.canal,
        },
        include: recordatorioInclude,
      }),
      this.prisma.cita.update({
        where: { id_cita: cita.id_cita },
        data: { recordatorio_enviado: true },
      }),
    ]);

    return {
      ...recordatorio,
      message: `Recordatorio enviado exitosamente por ${sendReminderDto.canal}`,
    };
  }

  async registerResponse(
    id: number,
    respuesta: RespuestaPaciente,
    cambiado_por: number,
  ) {
    const usuarioExiste = await this.prisma.usuario.findUnique({ where: { id_usuario: cambiado_por }, select: { id_usuario: true } });
    if (!usuarioExiste) {
      throw new NotFoundException(`Usuario con ID ${cambiado_por} no encontrado`);
    }

    const recordatorio = await this.prisma.recordatorio.findUnique({
      where: { id },
      select: { id: true, fecha_respuesta: true, id_cita: true },
    });

    if (!recordatorio) {
      throw new NotFoundException(
        `No se encontró el recordatorio con id ${id}`,
      );
    }

    if (recordatorio.fecha_respuesta) {
      throw new BadRequestException(
        'Este recordatorio ya tiene una respuesta registrada',
      );
    }

    const cita = await this.prisma.cita.findUnique({
      where: { id_cita: recordatorio.id_cita },
      select: { estado: true },
    });

    if (!cita) {
      throw new NotFoundException(
        `No se encontró la cita asociada al recordatorio`,
      );
    }

    if (cita.estado !== 'programada') {
      throw new BadRequestException(
        'Esta cita ya fue procesada (confirmada o cancelada previamente).'
      );
    }

    let nuevoEstadoRespuesta: EstadoRespuesta;
    let nuevoEstadoCita: EstadoCita;
    let message: string;

    if (respuesta === RespuestaPaciente.Confirmo) {
      nuevoEstadoRespuesta = 'confirmado';
      nuevoEstadoCita = EstadoCita.confirmada;
      message = 'Respuesta registrada: el paciente confirmó la cita';
    } else {
      nuevoEstadoRespuesta = 'cancelado';
      nuevoEstadoCita = EstadoCita.reprogramada;
      message = 'Respuesta registrada: el paciente canceló la cita. Se marca para reagendamiento';
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.recordatorio.update({
        where: { id },
        data: {
          estado_respuesta: nuevoEstadoRespuesta,
          fecha_respuesta: new Date(),
        },
      }),
      // Auto-update any other pending reminders for this same appointment to reflect the same response
      this.prisma.recordatorio.updateMany({
        where: {
          id_cita: recordatorio.id_cita,
          id: { not: recordatorio.id },
          estado_respuesta: 'pendiente',
        },
        data: {
          estado_respuesta: nuevoEstadoRespuesta,
          fecha_respuesta: new Date(),
        },
      }),
      this.prisma.cita.update({
        where: { id_cita: recordatorio.id_cita },
        data: { estado: nuevoEstadoCita },
      }),
      this.prisma.estadoHistorial.create({
        data: {
          id_cita: recordatorio.id_cita,
          estado_anterior: cita.estado,
          estado_nuevo: nuevoEstadoCita,
          cambiado_por,
        },
      }),
    ]);

    return { ...updated, message };
  }

  async discardReminder(id: number) {
    const recordatorio = await this.prisma.recordatorio.findUnique({
      where: { id },
    });

    if (!recordatorio) {
      throw new NotFoundException(`No se encontró el recordatorio con id ${id}`);
    }

    if (recordatorio.estado_respuesta !== 'pendiente') {
      throw new BadRequestException('Solo se pueden descartar recordatorios en estado pendiente');
    }

    const updated = await this.prisma.recordatorio.update({
      where: { id },
      data: { estado_respuesta: 'descartado' },
    });

    return { ...updated, message: 'Recordatorio descartado exitosamente' };
  }

  async discardCita(id_cita: number) {
    const cita = await this.prisma.cita.findUnique({
      where: { id_cita },
    });

    if (!cita) {
      throw new NotFoundException(`No se encontró la cita con id ${id_cita}`);
    }

    await this.prisma.cita.update({
      where: { id_cita },
      data: { recordatorio_enviado: true },
    });

    return { message: 'Cita descartada de la cola de envíos exitosamente' };
  }

  async getHistory(query: QueryReminderHistoryDto) {
    const where: Prisma.RecordatorioWhereInput = {};

    if (query.id_persona) {
      where.cita = { id_persona: query.id_persona };
    }

    if (query.estado) {
      where.estado_respuesta = query.estado;
    }

    if (query.canal) {
      where.canal = query.canal;
    }

    if (query.start || query.end) {
      where.fecha_envio = {};

      const now = new Date();

      if (query.start) {
        (where.fecha_envio as Prisma.DateTimeFilter).gte = new Date(query.start);
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        (where.fecha_envio as Prisma.DateTimeFilter).gte = thirtyDaysAgo;
      }

      if (query.end) {
        const endDate = new Date(query.end);
        endDate.setHours(23, 59, 59, 999);
        (where.fecha_envio as Prisma.DateTimeFilter).lte = endDate;
      } else {
        const endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        (where.fecha_envio as Prisma.DateTimeFilter).lte = endDate;
      }
    }

    if (!where.fecha_envio) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.fecha_envio = { gte: thirtyDaysAgo };
    }

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.recordatorio.findMany({
        where,
        skip,
        take: limit,
        include: recordatorioInclude,
        orderBy: { fecha_envio: 'desc' },
      }),
      this.prisma.recordatorio.count({ where }),
    ]);

    return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [confirmadas, canceladas, sinRespuesta, total] = await Promise.all([
      this.prisma.recordatorio.count({
        where: {
          fecha_envio: { gte: thirtyDaysAgo },
          estado_respuesta: 'confirmado',
        },
      }),
      this.prisma.recordatorio.count({
        where: {
          fecha_envio: { gte: thirtyDaysAgo },
          estado_respuesta: 'cancelado',
        },
      }),
      this.prisma.recordatorio.count({
        where: {
          fecha_envio: { gte: thirtyDaysAgo },
          estado_respuesta: 'sin_respuesta',
        },
      }),
      this.prisma.recordatorio.count({
        where: { fecha_envio: { gte: thirtyDaysAgo } },
      }),
    ]);

    const responded = confirmadas + canceladas;
    const tasaRespuesta =
      total > 0 ? Number(((responded / total) * 100).toFixed(2)) : 0;

    return {
      total_enviados: total,
      confirmadas,
      canceladas,
      sin_respuesta: sinRespuesta,
      pendientes: total - responded - sinRespuesta,
      respondidos: responded,
      tasa_respuesta: `${tasaRespuesta}%`,
    };
  }

  async exportCsv(query: QueryReminderHistoryDto) {
    const { records } = await this.getHistory(query);

    const headers = [
      'ID Recordatorio',
      'ID Cita',
      'Paciente',
      'Teléfono',
      'Correo',
      'Canal',
      'Estado Respuesta',
      'Fecha Envío',
      'Fecha Respuesta',
    ];

    const csvLines = [headers.join(',')];

    for (const r of records) {
      const fechaEnvio = r.fecha_envio
        ? new Date(r.fecha_envio).toISOString()
        : '-';
      const fechaRespuesta = r.fecha_respuesta
        ? new Date(r.fecha_respuesta).toISOString()
        : '-';
      const persona = r.cita?.persona;
      const nombrePaciente = persona
        ? [persona.primer_nombre, persona.segundo_nombre, persona.primer_apellido, persona.segundo_apellido].filter(Boolean).join(' ')
        : '-';

      const line = [
        r.id,
        r.id_cita,
        this.escapeCsv(nombrePaciente),
        persona?.telefono ?? '-',
        persona?.correo_electronico ?? '-',
        r.canal,
        r.estado_respuesta,
        fechaEnvio,
        fechaRespuesta,
      ].join(',');

      csvLines.push(line);
    }

    return csvLines.join('\n');
  }

  async retry(id: number) {
    const recordatorio = await this.prisma.recordatorio.findUnique({
      where: { id },
      include: {
        cita: {
          include: { persona: { select: personaSelect } },
        },
      },
    });

    if (!recordatorio) {
      throw new NotFoundException(
        `No se encontró el recordatorio con id ${id}`,
      );
    }

    if (recordatorio.estado_respuesta !== 'pendiente') {
      throw new BadRequestException(
        'Solo se pueden reintentar recordatorios en estado pendiente',
      );
    }

    const pacienteNombre = [recordatorio.cita?.persona?.primer_nombre, recordatorio.cita?.persona?.primer_apellido].filter(Boolean).join(' ') || 'Paciente';
    const contacto = recordatorio.canal === 'Correo'
      ? recordatorio.cita?.persona?.correo_electronico
      : recordatorio.cita?.persona?.telefono;

    // Reenviar el mensaje real
    await this.enviarPorCanal(
      contacto ?? null,
      recordatorio.canal as CanalRecordatorio,
      pacienteNombre,
      recordatorio.cita?.fecha_inicio ?? new Date(),
      recordatorio.cita?.id_cita ?? 0,
      recordatorio.cita?.motivo,
      recordatorio.cita?.tipo_cita
    );

    const updated = await this.prisma.recordatorio.update({
      where: { id },
      data: {
        fecha_envio: new Date(),
      },
      include: {
        cita: {
          include: { persona: { select: personaSelect } },
        },
      },
    });

    return {
      ...updated,
      message: `Reintento de recordatorio #${id} registrado exitosamente`,
    };
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Envia el mensaje por el canal especificado.
   * NOTA PARA TWILIO WHATSAPP SANDBOX:
   * El número destino debe haber hecho opt-in enviando un mensaje con un código
   * al número de Twilio (ej. "join <palabra>") antes de poder recibir mensajes.
   *
   * // TODO: Reemplazar Twilio Sandbox por Meta Cloud API directa
   * // cuando la clínica tenga número de WhatsApp Business verificado
   * // Referencia: https://developers.facebook.com/docs/whatsapp/cloud-api
   */
  private async enviarPorCanal(
    contacto: string | null,
    canal: CanalRecordatorio,
    pacienteNombre: string,
    fechaCita: Date,
    citaId: number,
    motivo: string | null = null,
    tipoCita: string | null = null
  ) {
    if (!contacto) throw new BadRequestException(`El paciente no tiene un contacto válido para el canal ${canal}`);

    let detalles = '';
    if (tipoCita || motivo) {
      detalles = `\n🩺 *Detalles de la cita:* ${tipoCita || 'Consulta'}${motivo ? ` - ${motivo}` : ''}`;
    }

    const mensaje = `Hola ${pacienteNombre}, somos *WebArco Dental Studio* 🦷.\n\nTe escribimos para recordarte tu cita programada para el *${fechaCita.toLocaleString('es-HN')}*.${detalles}`;

    if (canal === 'WhatsApp') {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      const from = this.configService.get<string>('TWILIO_WHATSAPP_FROM');
      if (!accountSid || !authToken || !from) throw new BadRequestException('Credenciales de Twilio no configuradas en el entorno');

      const client = new Twilio(accountSid, authToken);
      const destino = contacto.startsWith('+') ? contacto : `+504${contacto}`;
      const numeroRemitente = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

      const mensajeFinal = `${mensaje}\n\nPor favor, responde *SI* para confirmar tu asistencia o *NO* para cancelar.`;

      await client.messages.create({
        body: mensajeFinal,
        from: numeroRemitente,
        to: `whatsapp:${destino}`
      });
    } else if (canal === 'Correo') {
      const htmlBody = buildReminderEmail(pacienteNombre, fechaCita, citaId);
      await this.brevoService.sendMail({
        to: contacto,
        subject: 'Recordatorio de Cita - WebArco Dental Studio',
        html: htmlBody,
        text: mensaje,
      });
    }
  }

  async handleTwilioWebhook(from: string, messageBody: string) {
    const fromNumber = from.replace('whatsapp:', '');
    const localNumber = fromNumber.replace('+504', '');

    const recordatorio = await this.prisma.recordatorio.findFirst({
      where: {
        canal: 'WhatsApp',
        cita: {
          persona: {
            OR: [
              { telefono: localNumber },
              { telefono: fromNumber }
            ]
          }
        }
      },
      orderBy: {
        fecha_envio: 'desc'
      },
      include: {
        cita: true
      }
    });

    if (!recordatorio) {
      console.log(`Webhook Twilio: No se encontró recordatorio para el número ${fromNumber}`);
      return;
    }

    if (recordatorio.fecha_respuesta) {
      console.log(`Webhook Twilio: El recordatorio ${recordatorio.id} ya fue respondido antes.`);
      return;
    }

    const texto = messageBody.trim().toLowerCase();
    let estado: 'Confirmo' | 'Cancelo' | null = null;

    if (texto === 'si' || texto === 'sí' || texto === 'confirmo' || texto === 'yes') {
      estado = 'Confirmo';
    } else if (texto === 'no' || texto === 'cancelar' || texto === 'cancelo') {
      estado = 'Cancelo';
    }

    if (estado) {
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      const twilioFrom = this.configService.get<string>('TWILIO_WHATSAPP_FROM');
      
      let confirmMsg = '';
      
      try {
        await this.registerResponse(recordatorio.id, estado as any, recordatorio.cita.id_usuario);
        console.log(`Webhook Twilio: Recordatorio ${recordatorio.id} marcado como ${estado}`);

        if (estado === 'Confirmo') {
          confirmMsg = `✅ ¡Gracias! Tu cita ha sido *confirmada* exitosamente. ¡Te esperamos en WebArco Dental Studio!`;
        } else {
          confirmMsg = `❌ Hemos *cancelado* tu cita. Si deseas reprogramarla, no dudes en escribirnos de vuelta. ¡Gracias!`;
        }
      } catch (error: any) {
        if (error instanceof BadRequestException && error.message.includes('previamente')) {
          confirmMsg = `⚠️ Esta cita ya ha sido procesada previamente. No se han realizado cambios.`;
        } else {
          console.error("Error registrando respuesta de Twilio:", error);
          return;
        }
      }

      if (accountSid && authToken && twilioFrom && confirmMsg) {
        const client = new Twilio(accountSid, authToken);
        const numeroRemitente = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;
        const destino = `whatsapp:+504${localNumber}`; 

        try {
          await client.messages.create({
            body: confirmMsg,
            from: numeroRemitente,
            to: destino
          });
        } catch (error) {
          console.error("Error enviando mensaje de confirmación Twilio:", error);
        }
      }
    } else {
      console.log(`Webhook Twilio: Respuesta no reconocida ("${messageBody}") del número ${fromNumber}`);

      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      const twilioFrom = this.configService.get<string>('TWILIO_WHATSAPP_FROM');

      if (accountSid && authToken && twilioFrom) {
        const client = new Twilio(accountSid, authToken);
        const numeroRemitente = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;
        const destino = `whatsapp:+504${localNumber}`;

        const fechaObj = new Date(recordatorio.cita.fecha_inicio);
        const fechaStr = fechaObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const horaStr = fechaObj.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });

        const fallbackMsg = `🤖 *No hemos podido procesar tu respuesta.*\n\n📅 Cita programada para el *${fechaStr}*\n⏰ Hora: *${horaStr}*\n\nPor favor, responde *ÚNICAMENTE* con un *SI* para confirmar o un *NO* para cancelar tu asistencia.`;

        try {
          await client.messages.create({
            body: fallbackMsg,
            from: numeroRemitente,
            to: destino
          });
        } catch (error) {
          console.error("Error enviando mensaje de fallback Twilio:", error);
        }
      }
    }
  }

  async handleEmailResponse(citaId: number, action: string) {
    const recordatorio = await this.prisma.recordatorio.findFirst({
      where: {
        id_cita: citaId,
        canal: 'Correo',
        estado_respuesta: 'pendiente'
      },
      orderBy: { fecha_envio: 'desc' },
      include: { cita: true }
    });

    if (!recordatorio) {
      console.log(`Email Response: No se encontró recordatorio pendiente para cita ${citaId}`);
      return;
    }

    let estado: 'Confirmo' | 'Cancelo' | null = null;
    if (action === 'Confirmo') estado = 'Confirmo';
    if (action === 'Cancelo') estado = 'Cancelo';

    if (estado) {
      try {
        // Usamos el id_usuario del doctor de la cita para registrar el cambio en el historial
        await this.registerResponse(recordatorio.id, estado as any, recordatorio.cita.id_usuario);
        console.log(`Email Response: Recordatorio ${recordatorio.id} marcado como ${estado}`);
      } catch (error: any) {
        if (error instanceof BadRequestException && error.message.includes('previamente')) {
          throw new BadRequestException('Esta cita ya ha sido procesada previamente. No se han realizado cambios.');
        }
        throw error;
      }
    }
  }
}
