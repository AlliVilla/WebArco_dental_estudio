import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BrevoService } from '../utils/email/brevo.service';
import { Prisma, TipoNotificacion } from '@prisma/client';
import { QueryNotificacionesDto } from './dto/query-notificaciones.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { buildNotificacionCitaProximaEmail } from '../utils/email/html/notificacionCitaProxima';
import { buildNotificacionCitaConfirmadaEmail } from '../utils/email/html/notificacionCitaConfirmada';
import { buildNotificacionCitaCanceladaEmail } from '../utils/email/html/notificacionCitaCancelada';

@Injectable()
export class NotificacionService {
  private readonly logger = new Logger(NotificacionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brevoService: BrevoService,
  ) {}

  private getTratamientoDoctor(sexo?: 'M' | 'F' | null): 'Doctor' | 'Doctora' {
    return sexo === 'F' ? 'Doctora' : 'Doctor';
  }

  // ─────────────────────────────────────────────────────────────────
  // CRUD de notificaciones
  // ─────────────────────────────────────────────────────────────────

  async getNotificaciones(id_usuario: number, query: QueryNotificacionesDto) {
    const { order = 'desc', page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [notificaciones, total] = await Promise.all([
      this.prisma.notificacion.findMany({
        where: { id_usuario },
        orderBy: { created_at: order },
        skip,
        take: limit,
        include: {
          cita: {
            select: {
              id_cita: true,
              fecha_inicio: true,
              tipo_cita: true,
              motivo: true,
              estado: true,
              persona: {
                select: {
                  primer_nombre: true,
                  segundo_nombre: true,
                  primer_apellido: true,
                  segundo_apellido: true,
                  telefono: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.notificacion.count({ where: { id_usuario } }),
    ]);

    const unreadCount = await this.prisma.notificacion.count({
      where: { id_usuario, leida: false },
    });

    return {
      notificaciones,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  async markAsRead(id: number, id_usuario: number) {
    const notif = await this.prisma.notificacion.findUnique({ where: { id } });
    if (!notif || notif.id_usuario !== id_usuario) {
      throw new NotFoundException(`Notificación con id ${id} no encontrada`);
    }
    const updated = await this.prisma.notificacion.update({
      where: { id },
      data: { leida: true },
    });
    return { ...updated, message: 'Notificación marcada como leída' };
  }

  async markAllAsRead(id_usuario: number) {
    const { count } = await this.prisma.notificacion.updateMany({
      where: { id_usuario, leida: false },
      data: { leida: true },
    });
    return { message: `${count} notificaciones marcadas como leídas` };
  }

  // ─────────────────────────────────────────────────────────────────
  // Configuración de notificaciones
  // ─────────────────────────────────────────────────────────────────

  async getConfig(id_usuario: number) {
    const config = await this.prisma.configuracionNotificaciones.findUnique({
      where: { id_usuario },
    });

    // Si no existe, devolver defaults sin crear
    return config ?? {
      id_usuario,
      minutos_anticipacion: 60,
      email_notificaciones: true,
    };
  }

  async upsertConfig(id_usuario: number, dto: UpdateConfigDto) {
    const config = await this.prisma.configuracionNotificaciones.upsert({
      where: { id_usuario },
      update: {
        minutos_anticipacion: dto.minutos_anticipacion,
        email_notificaciones: dto.email_notificaciones,
      },
      create: {
        id_usuario,
        minutos_anticipacion: dto.minutos_anticipacion,
        email_notificaciones: dto.email_notificaciones,
      },
    });
    return { ...config, message: 'Configuración actualizada exitosamente' };
  }

  // ─────────────────────────────────────────────────────────────────
  // Crear notificación + enviar email al doctor
  // ─────────────────────────────────────────────────────────────────

  async crearNotificacion(
    id_usuario: number,
    tipo: TipoNotificacion,
    titulo: string,
    mensaje: string,
    id_cita?: number,
  ) {
    const notif = await this.prisma.notificacion.create({
      data: { id_usuario, tipo, titulo, mensaje, id_cita },
    });

    // Enviar email al doctor si tiene el email activado
    this.enviarEmailDoctor(id_usuario, tipo, titulo, mensaje, id_cita).catch(
      (err) => this.logger.error(`Error enviando email de notificación: ${err?.message}`),
    );

    return notif;
  }

  private async enviarEmailDoctor(
    id_usuario: number,
    tipo: TipoNotificacion,
    titulo: string,
    _mensaje: string,
    id_cita?: number,
  ) {
    // Verificar configuración del doctor
    const config = await this.getConfig(id_usuario);
    if (!config.email_notificaciones) return;

    // Obtener datos del doctor
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario },
      select: {
        persona: {
          select: {
            primer_nombre: true,
            primer_apellido: true,
            correo_electronico: true,
            sexo: true,
          },
        },
      },
    });

    const correo = usuario?.persona?.correo_electronico;
    if (!correo) {
      this.logger.warn(`Doctor ${id_usuario} no tiene correo electrónico registrado`);
      return;
    }

    const doctorNombre = [
      usuario?.persona?.primer_nombre,
      usuario?.persona?.primer_apellido,
    ]
      .filter(Boolean)
      .join(' ');
    const tratamientoDoctor = this.getTratamientoDoctor(usuario?.persona?.sexo);

    let htmlBody = '';
    let subject = titulo;

    if (id_cita && (tipo === 'cita_proxima' || tipo === 'cita_confirmada' || tipo === 'cita_cancelada')) {
      const cita = await this.prisma.cita.findUnique({
        where: { id_cita },
        select: {
          id_usuario: true,
          fecha_inicio: true,
          persona: {
            select: { primer_nombre: true, primer_apellido: true },
          },
        },
      });

      if (!cita) return;
      if (cita.id_usuario !== id_usuario) return;

      const pacienteNombre = [
        cita.persona?.primer_nombre,
        cita.persona?.primer_apellido,
      ]
        .filter(Boolean)
        .join(' ');

      if (tipo === 'cita_proxima') {
        const diffMs = cita.fecha_inicio.getTime() - new Date().getTime();
        const minutosFaltantes = Math.max(0, Math.round(diffMs / 60000));
        htmlBody = buildNotificacionCitaProximaEmail(
          tratamientoDoctor,
          doctorNombre,
          pacienteNombre,
          minutosFaltantes,
          cita.fecha_inicio,
          id_cita,
        );
        subject = `⏰ Cita próxima con ${pacienteNombre} — WebArco Dental Studio`;
      } else if (tipo === 'cita_confirmada') {
        htmlBody = buildNotificacionCitaConfirmadaEmail(
          tratamientoDoctor,
          doctorNombre,
          pacienteNombre,
          cita.fecha_inicio,
          id_cita,
        );
        subject = `✅ ${pacienteNombre} confirmó su cita — WebArco Dental Studio`;
      } else if (tipo === 'cita_cancelada') {
        htmlBody = buildNotificacionCitaCanceladaEmail(
          tratamientoDoctor,
          doctorNombre,
          pacienteNombre,
          cita.fecha_inicio,
          id_cita,
        );
        subject = `❌ ${pacienteNombre} canceló su cita — WebArco Dental Studio`;
      }
    }

    if (htmlBody) {
      await this.brevoService.sendMail({
        to: correo,
        subject,
        html: htmlBody,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // CRON: Verificar citas próximas cada 5 minutos
  // ─────────────────────────────────────────────────────────────────

  @Cron('*/5 * * * *')
  async checkCitasProximas() {
    this.logger.debug('Verificando citas próximas...');

    try {
      const doctores = await this.prisma.usuario.findMany({
        where: { activo: true },
        select: {
          id_usuario: true,
          configuracion_notificaciones: {
            select: { minutos_anticipacion: true },
          },
          rol: {
            select: {
              privilegios: {
                select: { id_privilegio: true }
              }
            }
          }
        },
      });

      const now = new Date();

      for (const user of doctores) {
        const privs = user.rol?.privilegios.map(rp => rp.id_privilegio) || [];
        const isGlobal = privs.includes(69);

        const minutos = user.configuracion_notificaciones?.minutos_anticipacion ?? 60;
        const ventanaInicio = new Date(now.getTime() - 30 * 60 * 1000); // Desde hace 30 minutos (por si se retrasó el cron o se agendó muy sobre la hora)
        const ventanaFin = new Date(now.getTime() + (minutos + 3) * 60 * 1000); // Hasta los X minutos + tolerancia

        const whereCitas: Prisma.CitaWhereInput = {
          fecha_inicio: { gte: ventanaInicio, lte: ventanaFin },
          estado: { in: ['programada', 'confirmada'] },
        };

        if (!isGlobal) {
          whereCitas.id_usuario = user.id_usuario;
        }

        // Buscar citas para el usuario (o globales si tiene el privilegio)
        const citas = await this.prisma.cita.findMany({
          where: whereCitas,
          select: {
            id_cita: true,
            fecha_inicio: true,
            persona: {
              select: { primer_nombre: true, primer_apellido: true },
            },
            doctor: {
              select: { persona: { select: { primer_nombre: true, primer_apellido: true, sexo: true } } }
            }
          },
        });

        for (const cita of citas) {
          // Evitar duplicados: verificar si ya se creó una notificación de este tipo para esta cita hoy
          const yaExiste = await this.prisma.notificacion.findFirst({
            where: {
              id_usuario: user.id_usuario,
              tipo: 'cita_proxima',
              id_cita: cita.id_cita,
              created_at: {
                gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
              },
            },
          });

          if (yaExiste) continue;

          const pacienteNombre = [
            cita.persona?.primer_nombre,
            cita.persona?.primer_apellido,
          ]
            .filter(Boolean)
            .join(' ');

          const doctorNombre = cita.doctor?.persona ? `${cita.doctor.persona.primer_nombre} ${cita.doctor.persona.primer_apellido}` : 'el doctor';
          const tratamientoDoctor = this.getTratamientoDoctor(cita.doctor?.persona?.sexo);

          const diffMs = cita.fecha_inicio.getTime() - now.getTime();
          const minutosFaltantes = Math.max(0, Math.round(diffMs / 60000));

          const titulo = minutosFaltantes > 0 ? `Cita próxima en ${minutosFaltantes} minutos` : 'Cita próxima ahora';
          const mensaje = isGlobal && cita.doctor?.persona 
            ? `Cita de ${pacienteNombre} con ${tratamientoDoctor} ${doctorNombre} programada para dentro de ${minutosFaltantes} minutos.`
            : `Tu cita con ${pacienteNombre} está programada para dentro de ${minutosFaltantes} minutos.`;

          await this.crearNotificacion(
            user.id_usuario,
            'cita_proxima',
            titulo,
            mensaje,
            cita.id_cita,
          );

          this.logger.debug(
            `Notificación cita_proxima creada: usuario=${user.id_usuario}, cita=${cita.id_cita}`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(`Error en checkCitasProximas: ${error?.message}`);
    }
  }
}
