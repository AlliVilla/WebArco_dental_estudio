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

@Injectable()
export class ReminderService {
  constructor(private prisma: PrismaService) {}

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
          estado: 'Programada',
          recordatorio_enviado: false,
          fecha_inicio: { gte: startOfToday, lte: tomorrow },
        },
        include: citaInclude,
        orderBy: { fecha_inicio: 'asc' },
      }),
      this.prisma.recordatorio.findMany({
        where: { estado_respuesta: 'Pendiente' },
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
      select: { id_cita: true, estado: true },
    });

    if (!cita) {
      throw new NotFoundException(
        `No se encontró la cita con id ${sendReminderDto.id_cita}`,
      );
    }

    if (cita.estado !== 'Programada') {
      throw new BadRequestException(
        'Solo se pueden enviar recordatorios para citas en estado "Programada"',
      );
    }

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

    let nuevoEstadoRespuesta: EstadoRespuesta;
    let nuevoEstadoCita: EstadoCita;
    let message: string;

    if (respuesta === RespuestaPaciente.Confirmo) {
      nuevoEstadoRespuesta = 'Confirmado';
      nuevoEstadoCita = EstadoCita.Confirmada;
      message = 'Respuesta registrada: el paciente confirmó la cita';
    } else {
      nuevoEstadoRespuesta = 'Cancelado';
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
          estado_respuesta: 'Confirmado',
        },
      }),
      this.prisma.recordatorio.count({
        where: {
          fecha_envio: { gte: thirtyDaysAgo },
          estado_respuesta: 'Cancelado',
        },
      }),
      this.prisma.recordatorio.count({
        where: {
          fecha_envio: { gte: thirtyDaysAgo },
          estado_respuesta: 'Sin_respuesta',
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

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
