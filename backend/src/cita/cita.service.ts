import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { Prisma } from '@prisma/client';

const citaInclude = {
  persona: {
    select: {
      id_persona: true,
      primer_nombre: true,
      segundo_nombre: true,
      primer_apellido: true,
      segundo_apellido: true,
      numero_identidad: true,
      telefono: true,
    },
  },
  doctor: {
    select: {
      id_usuario: true,
      username: true,
      persona: {
        select: {
          primer_nombre: true,
          primer_apellido: true,
        },
      },
    },
  },
} satisfies Prisma.CitaInclude;

const DEFAULT_DURATION_MINUTES = 30;

@Injectable()
export class CitaService {
  constructor(private prisma: PrismaService) {}

  async create(createCitaDto: CreateCitaDto) {
    await this.assertPersonaExists(createCitaDto.id_persona);
    await this.assertUsuarioExists(createCitaDto.id_usuario);

    const fechaInicio = new Date(createCitaDto.fecha_inicio);
    const fechaFin = createCitaDto.fecha_fin
      ? new Date(createCitaDto.fecha_fin)
      : new Date(fechaInicio.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);

    await this.checkTimeConflict(
      createCitaDto.id_usuario,
      fechaInicio,
      fechaFin,
    );

    const estado = createCitaDto.estado ?? 'programada';

    const cita = await this.prisma.cita.create({
      data: {
        id_persona: createCitaDto.id_persona,
        id_usuario: createCitaDto.id_usuario,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        tipo_cita: createCitaDto.tipo_cita ?? null,
        motivo: createCitaDto.motivo ?? null,
        notas: createCitaDto.notas ?? null,
        estado,
      },
      include: citaInclude,
    });

    await this.prisma.estadoHistorial.create({
      data: {
        id_cita: cita.id_cita,
        estado_anterior: null,
        estado_nuevo: estado,
        cambiado_por: createCitaDto.id_usuario,
      },
    });

    return cita;
  }

  async findByCalendar(
    start: string,
    end: string,
    id_usuario?: number,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    const where: Prisma.CitaWhereInput = {
      fecha_inicio: { gte: startDate, lte: endDate },
    };

    if (id_usuario) {
      where.id_usuario = id_usuario;
    }

    const citas = await this.prisma.cita.findMany({
      where,
      include: citaInclude,
      orderBy: { fecha_inicio: 'asc' },
    });

    return { data: citas };
  }

  async findOne(id: number) {
    const cita = await this.prisma.cita.findUnique({
      where: { id_cita: id },
      include: {
        ...citaInclude,
        consulta: {
          include: {
            antecedentes: {
              include: {
                pregunta: {
                  select: {
                    id_pregunta: true,
                    pregunta: true,
                    orden_num: true,
                  },
                },
              },
              orderBy: { pregunta: { orden_num: 'asc' } },
            },
            odontogramas: {
              include: {
                diente: {
                  select: {
                    numero_diente: true,
                    nombre: true,
                  },
                },
              },
            },
            pagos: {
              orderBy: { fecha: 'desc' },
            },
          },
        },
      },
    });

    if (!cita) {
      throw new NotFoundException(`No se encontró la cita con id ${id}`);
    }

    return cita;
  }

  async update(id: number, updateCitaDto: UpdateCitaDto) {
    const existing = await this.findOne(id);

    if (
      updateCitaDto.id_persona &&
      updateCitaDto.id_persona !== existing.id_persona
    ) {
      await this.assertPersonaExists(updateCitaDto.id_persona);
    }
    if (
      updateCitaDto.id_usuario &&
      updateCitaDto.id_usuario !== existing.id_usuario
    ) {
      await this.assertUsuarioExists(updateCitaDto.id_usuario);
    }

    const updateData: Record<string, unknown> = {};
    if (updateCitaDto.id_persona !== undefined)
      updateData.id_persona = updateCitaDto.id_persona;
    if (updateCitaDto.id_usuario !== undefined)
      updateData.id_usuario = updateCitaDto.id_usuario;
    if (updateCitaDto.tipo_cita !== undefined)
      updateData.tipo_cita = updateCitaDto.tipo_cita;
    if (updateCitaDto.motivo !== undefined)
      updateData.motivo = updateCitaDto.motivo;
    if (updateCitaDto.notas !== undefined)
      updateData.notas = updateCitaDto.notas;
    if (updateCitaDto.estado !== undefined)
      updateData.estado = updateCitaDto.estado;

    let newFechaInicio = existing.fecha_inicio;
    let newFechaFin = existing.fecha_fin;

    if (updateCitaDto.fecha_inicio !== undefined) {
      newFechaInicio = new Date(updateCitaDto.fecha_inicio);
      updateData.fecha_inicio = newFechaInicio;
    }
    if (updateCitaDto.fecha_fin !== undefined) {
      newFechaFin = updateCitaDto.fecha_fin
        ? new Date(updateCitaDto.fecha_fin)
        : null;
      updateData.fecha_fin = newFechaFin;
    }

    const doctorId = (updateCitaDto.id_usuario ?? existing.id_usuario) as number;
    const checkStart = newFechaInicio;
    const checkEnd =
      newFechaFin ??
      new Date(checkStart.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);

    if (
      updateCitaDto.fecha_inicio !== undefined ||
      updateCitaDto.fecha_fin !== undefined ||
      (updateCitaDto.id_usuario !== undefined &&
        updateCitaDto.id_usuario !== existing.id_usuario)
    ) {
      await this.checkTimeConflict(doctorId, checkStart, checkEnd, id);
    }

    const updated = await this.prisma.cita.update({
      where: { id_cita: id },
      data: updateData,
      include: citaInclude,
    });

    if (
      updateCitaDto.estado !== undefined &&
      updateCitaDto.estado !== existing.estado
    ) {
      await this.prisma.estadoHistorial.create({
        data: {
          id_cita: id,
          estado_anterior: existing.estado,
          estado_nuevo: updateCitaDto.estado,
          cambiado_por: updateCitaDto.id_usuario ?? existing.id_usuario,
        },
      });
    }

    return updated;
  }

  async remove(id: number) {
    const cita = await this.prisma.cita.findUnique({
      where: { id_cita: id },
      include: { consulta: { select: { id_consulta: true } } },
    });

    if (!cita) {
      throw new NotFoundException(`No se encontró la cita con id ${id}`);
    }

    if (cita.consulta) {
      throw new ConflictException(
        'No se puede eliminar la cita porque tiene una consulta asociada. Elimine primero la consulta.',
      );
    }

    await this.prisma.estadoHistorial.deleteMany({
      where: { id_cita: id },
    });

    await this.prisma.cita.delete({
      where: { id_cita: id },
    });
  }

  async changeStatus(id: number, changeStatusDto: ChangeStatusDto) {
    const cita = await this.prisma.cita.findUnique({
      where: { id_cita: id },
      select: { id_cita: true, estado: true },
    });

    if (!cita) {
      throw new NotFoundException(`No se encontró la cita con id ${id}`);
    }

    await this.assertUsuarioExists(changeStatusDto.cambiado_por);

    if (cita.estado === changeStatusDto.estado) {
      throw new BadRequestException(
        `La cita ya se encuentra en estado "${changeStatusDto.estado}"`,
      );
    }

    const [updated] = await Promise.all([
      this.prisma.cita.update({
        where: { id_cita: id },
        data: { estado: changeStatusDto.estado },
        include: citaInclude,
      }),
      this.prisma.estadoHistorial.create({
        data: {
          id_cita: id,
          estado_anterior: cita.estado,
          estado_nuevo: changeStatusDto.estado,
          cambiado_por: changeStatusDto.cambiado_por,
        },
      }),
    ]);

    return updated;
  }

  async getStatusHistory(id: number) {
    const cita = await this.prisma.cita.findUnique({
      where: { id_cita: id },
      select: { id_cita: true },
    });

    if (!cita) {
      throw new NotFoundException(`No se encontró la cita con id ${id}`);
    }

    const history = await this.prisma.estadoHistorial.findMany({
      where: { id_cita: id },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            username: true,
            persona: {
              select: {
                primer_nombre: true,
                primer_apellido: true,
              },
            },
          },
        },
      },
      orderBy: { fecha_cambio: 'desc' },
    });

    return { data: history };
  }

  async getPatientHistory(
    patientId: number,
    page: number = 1,
    limit: number = 10,
    filters?: {
      estado?: string;
      start?: string;
      end?: string;
    },
  ) {
    const persona = await this.prisma.persona.findUnique({
      where: { id_persona: patientId },
      select: { id_persona: true },
    });

    if (!persona) {
      throw new NotFoundException(
        `No se encontró el paciente con id ${patientId}`,
      );
    }

    const skip = (page - 1) * limit;
    const where: Prisma.CitaWhereInput = {
      id_persona: patientId,
    };

    if (filters?.estado) {
      where.estado = filters.estado as Prisma.EnumEstadoCitaFilter['equals'];
    }

    if (filters?.start || filters?.end) {
      where.fecha_inicio = {};
      if (filters.start) {
        (where.fecha_inicio as Prisma.DateTimeFilter).gte = new Date(filters.start);
      }
      if (filters.end) {
        const endDate = new Date(filters.end);
        endDate.setHours(23, 59, 59, 999);
        (where.fecha_inicio as Prisma.DateTimeFilter).lte = endDate;
      }
    }

    const [citas, total] = await Promise.all([
      this.prisma.cita.findMany({
        where,
        skip,
        take: limit,
        include: {
          ...citaInclude,
          historial_estados: {
            orderBy: { fecha_cambio: 'desc' },
            take: 5,
          },
        },
        orderBy: { fecha_inicio: 'desc' },
      }),
      this.prisma.cita.count({ where }),
    ]);

    return {
      data: citas,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private async checkTimeConflict(
    id_usuario: number,
    fecha_inicio: Date,
    fecha_fin: Date,
    excludeId?: number,
  ) {
    const startOfDay = new Date(fecha_inicio);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fecha_inicio);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.prisma.cita.findMany({
      where: {
        id_usuario,
        fecha_inicio: { gte: startOfDay, lte: endOfDay },
        estado: { notIn: ['cancelada', 'ausente'] },
        ...(excludeId ? { id_cita: { not: excludeId } } : {}),
      },
      select: {
        id_cita: true,
        fecha_inicio: true,
        fecha_fin: true,
      },
    });

    const newStart = fecha_inicio.getTime();
    const newEnd = fecha_fin.getTime();

    for (const appt of existing) {
      const apptStart = appt.fecha_inicio.getTime();
      const apptEnd = appt.fecha_fin
        ? appt.fecha_fin.getTime()
        : apptStart + DEFAULT_DURATION_MINUTES * 60 * 1000;

      if (newStart < apptEnd && newEnd > apptStart) {
        throw new ConflictException(
          'Conflicto de horario: el doctor ya tiene una cita en ese horario',
        );
      }
    }
  }

  private async assertPersonaExists(id: number) {
    const persona = await this.prisma.persona.findUnique({
      where: { id_persona: id },
      select: { id_persona: true },
    });
    if (!persona) {
      throw new BadRequestException(
        `No existe una persona con el id ${id}`,
      );
    }
  }

  private async assertUsuarioExists(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: { id_usuario: true },
    });
    if (!usuario) {
      throw new BadRequestException(
        `No existe un usuario con el id ${id}`,
      );
    }
  }
}
