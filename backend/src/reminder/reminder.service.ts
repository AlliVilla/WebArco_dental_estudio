import { createHash, randomBytes } from 'crypto';
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
  persona: {
    select: {
      primer_nombre: true,
      segundo_nombre: true,
      primer_apellido: true,
      segundo_apellido: true,
    },
  },
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
  ) {}

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
        include: {
          ...citaInclude,
          recordatorios: {
            select: {
              canal: true,
            },
          },
        },
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

  async send(sendReminderDto: SendReminderDto, dynamicBaseUrl?: string) {
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

    const pacienteNombre =
      [cita.persona?.primer_nombre, cita.persona?.primer_apellido]
        .filter(Boolean)
        .join(' ') || 'Paciente';
    const contacto =
      sendReminderDto.canal === 'Correo'
        ? cita.persona?.correo_electronico
        : cita.persona?.telefono;

    // Enviar el mensaje real antes de guardar en BD (retorna texto del mensaje)
    const mensajeText = await this.enviarPorCanal(
      contacto ?? null,
      sendReminderDto.canal as CanalRecordatorio,
      pacienteNombre,
      cita.fecha_inicio,
      cita.id_cita,
      cita.motivo,
      cita.tipo_cita,
      dynamicBaseUrl,
    );

    const recordatorio = await this.prisma.recordatorio.create({
      data: {
        id_cita: cita.id_cita,
        canal: sendReminderDto.canal,
      },
      include: recordatorioInclude,
    });

    return {
      ...recordatorio,
      whatsappMessage:
        sendReminderDto.canal === 'WhatsApp' ? mensajeText : undefined,
      message: `Recordatorio registrado exitosamente para ${sendReminderDto.canal}`,
    };
  }

  async registerResponse(
    id: number,
    respuesta: RespuestaPaciente,
    cambiado_por: number,
  ) {
    const usuarioExiste = await this.prisma.usuario.findUnique({
      where: { id_usuario: cambiado_por },
      select: { id_usuario: true },
    });
    if (!usuarioExiste) {
      throw new NotFoundException(
        `Usuario con ID ${cambiado_por} no encontrado`,
      );
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
        'Esta cita ya fue procesada (confirmada o cancelada previamente).',
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
      message =
        'Respuesta registrada: el paciente canceló la cita. Se marca para reagendamiento';
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
      throw new NotFoundException(
        `No se encontró el recordatorio con id ${id}`,
      );
    }

    if (recordatorio.estado_respuesta !== 'pendiente') {
      throw new BadRequestException(
        'Solo se pueden descartar recordatorios en estado pendiente',
      );
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
        (where.fecha_envio as Prisma.DateTimeFilter).gte = new Date(
          query.start,
        );
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

    return {
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

  async retry(id: number, dynamicBaseUrl?: string) {
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

    const pacienteNombre =
      [
        recordatorio.cita?.persona?.primer_nombre,
        recordatorio.cita?.persona?.primer_apellido,
      ]
        .filter(Boolean)
        .join(' ') || 'Paciente';
    const contacto =
      recordatorio.canal === 'Correo'
        ? recordatorio.cita?.persona?.correo_electronico
        : recordatorio.cita?.persona?.telefono;

    // Reenviar el mensaje real (retorna texto del mensaje)
    const mensajeText = await this.enviarPorCanal(
      contacto ?? null,
      recordatorio.canal as CanalRecordatorio,
      pacienteNombre,
      recordatorio.cita?.fecha_inicio ?? new Date(),
      recordatorio.cita?.id_cita ?? 0,
      recordatorio.cita?.motivo,
      recordatorio.cita?.tipo_cita,
      dynamicBaseUrl,
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
      whatsappMessage:
        recordatorio.canal === 'WhatsApp' ? mensajeText : undefined,
      message: `Reintento de recordatorio #${id} registrado exitosamente`,
    };
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
    tipoCita: string | null = null,
    dynamicBaseUrl?: string,
  ): Promise<string> {
    if (!contacto)
      throw new BadRequestException(
        `El paciente no tiene un contacto válido para el canal ${canal}`,
      );

    const fCita = new Date(fechaCita);
    const fechaStr = fCita.toLocaleDateString('es-HN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const horaStr = fCita.toLocaleTimeString('es-HN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    let detalles = '';
    if (tipoCita || motivo) {
      detalles = `\n\n🩺 *Detalles de la cita:* ${tipoCita || 'Consulta'}${motivo ? ` - ${motivo}` : ''}`;
    }

    const mensaje = `Hola ${pacienteNombre}, somos *WebArco Dental Studio* 🦷.\n\nTe escribimos para recordarte tu cita programada para el *${fechaStr}* a las *${horaStr}*.${detalles}`;

    if (canal === 'WhatsApp') {
      const mensajeFinal = `${mensaje}\n\nPor favor, responde *SI* para confirmar tu asistencia o *NO* para cancelar.`;
      // Omitir llamada a Twilio para redirección directa en frontend
      return mensajeFinal;
    } else if (canal === 'Correo') {
      const tokens = {
        Confirmo: randomBytes(32).toString('hex'),
        Cancelo: randomBytes(32).toString('hex'),
      };
      await this.prisma.emailResponseToken.createMany({
        data: Object.entries(tokens).map(([action, token]) => ({
          hash: createHash('sha256').update(token).digest('hex'),
          citaId,
          action,
          expiresAt: new Date(Date.now() + 48 * 3600000),
        })),
      });
      const htmlBody = buildReminderEmail(
        pacienteNombre,
        fechaCita,
        citaId,
        undefined,
        tokens,
      );
      await this.brevoService.sendMail({
        to: contacto,
        subject: 'Recordatorio de Cita - WebArco Dental Studio',
        html: htmlBody,
        text: mensaje,
      });
      return mensaje;
    }
    return '';
  }

  async validateEmailToken(citaId: number, action: string, token: string) {
    if (
      !Number.isSafeInteger(citaId) ||
      citaId <= 0 ||
      !['Confirmo', 'Cancelo'].includes(action) ||
      typeof token !== 'string' ||
      !/^[a-f0-9]{64}$/.test(token)
    )
      throw new BadRequestException('Enlace inválido o expirado');
    const hash = createHash('sha256').update(token).digest('hex');
    const row = await this.prisma.emailResponseToken.findUnique({
      where: { hash },
    });
    if (
      !row ||
      row.citaId !== citaId ||
      row.action !== action ||
      row.usedAt ||
      row.expiresAt <= new Date()
    )
      throw new BadRequestException('Enlace inválido o expirado');
    return hash;
  }

  async handleEmailResponse(citaId: number, action: string, token: string) {
    const hash = await this.validateEmailToken(citaId, action, token);
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.emailResponseToken.updateMany({
        where: { hash, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1)
        throw new BadRequestException('El enlace ya fue utilizado');
      await this.applyPatientResponse(
        tx,
        citaId,
        action,
        'correo_paciente',
        'Correo',
      );
      await tx.emailResponseToken.updateMany({
        where: { citaId, usedAt: null },
        data: { usedAt: new Date() },
      });
    });
  }

  async handleTwilioWebhook(from: string, messageBody: string) {
    if (!/^whatsapp:\+[1-9][0-9]{7,14}$/.test(from))
      throw new BadRequestException('Remitente inválido');
    const text = messageBody.trim().toLowerCase();
    const action = ['si', 'sí', 'confirmo', 'yes'].includes(text)
      ? 'Confirmo'
      : ['no', 'cancelar', 'cancelo'].includes(text)
        ? 'Cancelo'
        : null;
    if (!action) return;
    const phone = from.slice('whatsapp:'.length);
    const recordatorio = await this.prisma.recordatorio.findFirst({
      where: {
        canal: 'WhatsApp',
        estado_respuesta: 'pendiente',
        cita: {
          estado: 'programada',
          persona: {
            OR: [
              { telefono: phone },
              { telefono: phone.replace(/^\+504/, '') },
            ],
          },
        },
      },
      orderBy: { fecha_envio: 'desc' },
    });
    if (!recordatorio) return;
    await this.prisma.$transaction((tx) =>
      this.applyPatientResponse(
        tx,
        recordatorio.id_cita,
        action,
        'twilio_paciente',
        'WhatsApp',
      ),
    );
  }

  private async applyPatientResponse(
    tx: Prisma.TransactionClient,
    citaId: number,
    action: string,
    origin: string,
    channel: CanalRecordatorio,
  ) {
    const reminder = await tx.recordatorio.findFirst({
      where: { id_cita: citaId, canal: channel, estado_respuesta: 'pendiente' },
    });
    if (!reminder)
      throw new BadRequestException('No existe un recordatorio pendiente');
    const estado =
      action === 'Confirmo' ? EstadoCita.confirmada : EstadoCita.reprogramada;
    const claimed = await tx.cita.updateMany({
      where: { id_cita: citaId, estado: 'programada' },
      data: { estado },
    });
    if (claimed.count !== 1)
      throw new BadRequestException('Esta cita ya fue procesada');
    await tx.recordatorio.updateMany({
      where: { id_cita: citaId, estado_respuesta: 'pendiente' },
      data: {
        estado_respuesta: action === 'Confirmo' ? 'confirmado' : 'cancelado',
        fecha_respuesta: new Date(),
      },
    });
    await tx.estadoHistorial.create({
      data: {
        id_cita: citaId,
        estado_anterior: 'programada',
        estado_nuevo: estado,
        cambiado_por: null,
        origen: origin,
      },
    });
  }
}
