import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateToothStateDto } from './dto/update-tooth-state.dto';

@Injectable()
export class OdontogramaService {
  constructor(private prisma: PrismaService) {}

  private async assertEstadoValido(estado: string) {
    const exists = await this.prisma.estadoOdontograma.findFirst({
      where: { nombre: { equals: estado, mode: 'insensitive' } },
    });
    if (!exists) {
      throw new BadRequestException(
        `Estado inválido: "${estado}". Use un estado registrado en el catálogo.`,
      );
    }
  }

  async getPatientOdontogram(patientId: number) {
    await this.assertPatientExists(patientId);

    const dientes = await this.prisma.diente.findMany({
      orderBy: { numero_diente: 'asc' },
    });

    const latestRecords = await this.prisma.$queryRaw<
      Array<{
        id_diente: number;
        estado: string | null;
        observacion: string | null;
        id_consulta: number;
        fecha_inicio: Date;
        id_usuario: number;
        doctor_nombre: string;
        doctor_apellido: string;
      }>
    >`
      SELECT DISTINCT ON (o.id_diente)
        o.id_diente,
        o.estado,
        o.observacion,
        o.id_consulta,
        c.fecha_inicio,
        c.id_usuario,
        p.primer_nombre AS doctor_nombre,
        p.primer_apellido AS doctor_apellido
      FROM odontograma o
      JOIN consulta c ON c.id_consulta = o.id_consulta
      JOIN usuario u ON u.id_usuario = c.id_usuario
      JOIN persona p ON p.id_persona = u.id_persona
      WHERE c.id_persona = ${patientId}
      ORDER BY o.id_diente, c.fecha_inicio DESC
    `;

    const recordCounts = await this.prisma.$queryRaw<
      Array<{ id_diente: number; count: number }>
    >`
      SELECT o.id_diente, COUNT(*)::int AS count
      FROM odontograma o
      JOIN consulta c ON c.id_consulta = o.id_consulta
      WHERE c.id_persona = ${patientId}
      GROUP BY o.id_diente
    `;

    const recordMap = new Map<number, (typeof latestRecords)[number]>();
    for (const record of latestRecords) {
      recordMap.set(record.id_diente, record);
    }

    const countMap = new Map<number, number>();
    for (const rc of recordCounts) {
      countMap.set(rc.id_diente, rc.count);
    }

    const result = dientes.map((diente) => {
      const record = recordMap.get(diente.numero_diente);
      const prevCount = countMap.get(diente.numero_diente) ?? 0;
      return {
        numero_diente: diente.numero_diente,
        nombre: diente.nombre,
        estado: record?.estado ?? 'Sano',
        observacion: record?.observacion ?? null,
        doctor: record
          ? {
              id_usuario: record.id_usuario,
              nombre: `${record.doctor_nombre} ${record.doctor_apellido}`,
            }
          : null,
        fecha_consulta: record?.fecha_inicio ?? null,
        hasPreviousRecords: prevCount > 0,
        previousRecordsCount: prevCount,
      };
    });

    const totalPreviousRecords = latestRecords.length;

    return {
      paciente_id: patientId,
      total_dientes: dientes.length,
      total_dientes_con_registros: totalPreviousRecords,
      dientes: result,
    };
  }

  async updateToothState(
    patientId: number,
    toothNumber: number,
    dto: UpdateToothStateDto,
    userId: number,
  ) {
    await this.assertPatientExists(patientId);
    await this.assertToothExists(toothNumber);
    await this.assertEstadoValido(dto.estado);

    const activeConsulta = await this.prisma.consulta.findFirst({
      where: {
        id_persona: patientId,
        fecha_fin: null,
      },
      orderBy: { fecha_inicio: 'desc' },
    });

    if (!activeConsulta) {
      throw new BadRequestException(
        'No hay una consulta activa para este paciente. Debe iniciar una consulta antes de modificar el odontograma.',
      );
    }

    // Get current record for this tooth in this consultation (if exists)
    const currentRecord = await this.prisma.odontograma.findUnique({
      where: {
        id_consulta_id_diente: {
          id_consulta: activeConsulta.id_consulta,
          id_diente: toothNumber,
        },
      },
      select: { estado: true, observacion: true },
    });

    // Get previous state:
    // - If updating existing record in this consult → use current record's estado
    // - If creating new record → use latest record from prior consultations
    const previousRecord = currentRecord ?? await this.prisma.odontograma.findFirst({
      where: {
        id_diente: toothNumber,
        consulta: {
          id_persona: patientId,
          id_consulta: { not: activeConsulta.id_consulta },
        },
      },
      orderBy: { consulta: { fecha_inicio: 'desc' } },
    });

    const estadoAnterior = currentRecord?.estado ?? previousRecord?.estado ?? null;
    const observacionAnterior = currentRecord?.observacion ?? previousRecord?.observacion ?? null;

    const odontograma = await this.prisma.odontograma.upsert({
      where: {
        id_consulta_id_diente: {
          id_consulta: activeConsulta.id_consulta,
          id_diente: toothNumber,
        },
      },
      create: {
        id_consulta: activeConsulta.id_consulta,
        id_diente: toothNumber,
        estado: dto.estado,
        observacion: dto.observacion ?? null,
        estado_anterior: estadoAnterior,
        observacion_anterior: observacionAnterior,
      },
      update: {
        estado: dto.estado,
        observacion: dto.observacion ?? null,
        estado_anterior: estadoAnterior,
        observacion_anterior: observacionAnterior,
      },
      include: {
        diente: {
          select: {
            numero_diente: true,
            nombre: true,
          },
        },
        consulta: {
          select: {
            id_consulta: true,
            fecha_inicio: true,
            doctor: {
              select: {
                id_usuario: true,
                persona: {
                  select: {
                    primer_nombre: true,
                    primer_apellido: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      message: 'Estado del diente actualizado exitosamente',
      id_odontograma: odontograma.id_odontograma,
      id_consulta: odontograma.id_consulta,
      diente: {
        numero_diente: odontograma.diente.numero_diente,
        nombre: odontograma.diente.nombre,
      },
      estado: odontograma.estado,
      observacion: odontograma.observacion,
      estado_anterior: odontograma.estado_anterior,
      observacion_anterior: odontograma.observacion_anterior,
      doctor: {
        id_usuario: odontograma.consulta.doctor.id_usuario,
        nombre: `${odontograma.consulta.doctor.persona.primer_nombre} ${odontograma.consulta.doctor.persona.primer_apellido}`,
      },
      fecha_consulta: odontograma.consulta.fecha_inicio,
    };
  }

  async getPatientHistory(patientId: number) {
    await this.assertPatientExists(patientId);

    const records = await this.prisma.odontograma.findMany({
      where: {
        consulta: {
          id_persona: patientId,
        },
      },
      include: {
        diente: {
          select: {
            numero_diente: true,
            nombre: true,
          },
        },
        consulta: {
          select: {
            id_consulta: true,
            fecha_inicio: true,
            fecha_fin: true,
            doctor: {
              select: {
                id_usuario: true,
                persona: {
                  select: {
                    primer_nombre: true,
                    primer_apellido: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        consulta: {
          fecha_inicio: 'desc',
        },
      },
    });

    const totalCount = await this.prisma.odontograma.count({
      where: {
        consulta: {
          id_persona: patientId,
        },
      },
    });

    return {
      paciente_id: patientId,
      total_registros: totalCount,
      historial: records.map((r) => ({
        id_odontograma: r.id_odontograma,
        id_consulta: r.id_consulta,
        diente: {
          numero_diente: r.diente.numero_diente,
          nombre: r.diente.nombre,
        },
        estado: r.estado,
        observacion: r.observacion,
        estado_anterior: r.estado_anterior,
        observacion_anterior: r.observacion_anterior,
        doctor: {
          id_usuario: r.consulta.doctor.id_usuario,
          nombre: `${r.consulta.doctor.persona.primer_nombre} ${r.consulta.doctor.persona.primer_apellido}`,
        },
        fecha_consulta: r.consulta.fecha_inicio,
        fecha_fin: r.consulta.fecha_fin,
      })),
    };
  }

  async getToothHistory(patientId: number, toothNumber: number) {
    await this.assertPatientExists(patientId);
    await this.assertToothExists(toothNumber);

    const records = await this.prisma.odontograma.findMany({
      where: {
        id_diente: toothNumber,
        consulta: {
          id_persona: patientId,
        },
      },
      include: {
        diente: {
          select: {
            numero_diente: true,
            nombre: true,
          },
        },
        consulta: {
          select: {
            id_consulta: true,
            fecha_inicio: true,
            fecha_fin: true,
            doctor: {
              select: {
                id_usuario: true,
                persona: {
                  select: {
                    primer_nombre: true,
                    primer_apellido: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        consulta: {
          fecha_inicio: 'desc',
        },
      },
    });

    return {
      paciente_id: patientId,
      diente: records.length > 0
        ? {
            numero_diente: records[0].diente.numero_diente,
            nombre: records[0].diente.nombre,
          }
        : null,
      total_registros: records.length,
      historial: records.map((r) => ({
        id_odontograma: r.id_odontograma,
        id_consulta: r.id_consulta,
        estado: r.estado,
        observacion: r.observacion,
        estado_anterior: r.estado_anterior,
        observacion_anterior: r.observacion_anterior,
        doctor: {
          id_usuario: r.consulta.doctor.id_usuario,
          nombre: `${r.consulta.doctor.persona.primer_nombre} ${r.consulta.doctor.persona.primer_apellido}`,
        },
        fecha_consulta: r.consulta.fecha_inicio,
        fecha_fin: r.consulta.fecha_fin,
      })),
    };
  }

  async bulkSave(
    consultaId: number,
    items: Array<{ id_diente: number; estado: string; observacion?: string }>,
    userId: number,
  ) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: consultaId },
      select: { id_consulta: true, id_persona: true },
    });

    if (!consulta) {
      throw new NotFoundException(`No se encontró la consulta con id ${consultaId}`);
    }

    await this.assertPatientExists(consulta.id_persona);

    const estadosUnicos = [...new Set(items.map((i) => i.estado))];
    for (const est of estadosUnicos) {
      await this.assertEstadoValido(est);
    }

    const results: Array<{
      id_odontograma: number;
      id_consulta: number;
      diente: { numero_diente: number; nombre: string | null };
      estado: string | null;
      observacion: string | null;
      estado_anterior: string | null;
      observacion_anterior: string | null;
      doctor: { id_usuario: number; nombre: string };
      fecha_consulta: Date;
    }> = [];
    for (const item of items) {
      await this.assertToothExists(item.id_diente);

      // Get current record for this tooth in this consultation (if exists)
      const currentRecord = await this.prisma.odontograma.findUnique({
        where: {
          id_consulta_id_diente: {
            id_consulta: consultaId,
            id_diente: item.id_diente,
          },
        },
        select: { estado: true, observacion: true },
      });

      // Get previous state:
      // - If updating existing record → use current record's estado
      // - If creating new record → use latest record from prior consultations
      const previousRecord = currentRecord ?? await this.prisma.odontograma.findFirst({
        where: {
          id_diente: item.id_diente,
          consulta: {
            id_persona: consulta.id_persona,
            id_consulta: { not: consultaId },
          },
        },
        orderBy: { consulta: { fecha_inicio: 'desc' } },
      });

      const estadoAnterior = currentRecord?.estado ?? previousRecord?.estado ?? null;
      const observacionAnterior = currentRecord?.observacion ?? previousRecord?.observacion ?? null;

      const odontograma = await this.prisma.odontograma.upsert({
        where: {
          id_consulta_id_diente: {
            id_consulta: consultaId,
            id_diente: item.id_diente,
          },
        },
        create: {
          id_consulta: consultaId,
          id_diente: item.id_diente,
          estado: item.estado,
          observacion: item.observacion ?? null,
          estado_anterior: estadoAnterior,
          observacion_anterior: observacionAnterior,
        },
        update: {
          estado: item.estado,
          observacion: item.observacion ?? null,
          estado_anterior: estadoAnterior,
          observacion_anterior: observacionAnterior,
        },
        include: {
          diente: {
            select: { numero_diente: true, nombre: true },
          },
          consulta: {
            select: {
              id_consulta: true,
              fecha_inicio: true,
              doctor: {
                select: {
                  id_usuario: true,
                  persona: {
                    select: { primer_nombre: true, primer_apellido: true },
                  },
                },
              },
            },
          },
        },
      });

      results.push({
        id_odontograma: odontograma.id_odontograma,
        id_consulta: odontograma.id_consulta,
        diente: {
          numero_diente: odontograma.diente.numero_diente,
          nombre: odontograma.diente.nombre,
        },
        estado: odontograma.estado,
        observacion: odontograma.observacion,
        estado_anterior: odontograma.estado_anterior,
        observacion_anterior: odontograma.observacion_anterior,
        doctor: {
          id_usuario: odontograma.consulta.doctor.id_usuario,
          nombre: `${odontograma.consulta.doctor.persona.primer_nombre} ${odontograma.consulta.doctor.persona.primer_apellido}`,
        },
        fecha_consulta: odontograma.consulta.fecha_inicio,
      });
    }

    return { message: 'Odontograma guardado exitosamente', registros: results };
  }

  async getActiveConsultationPatients(userId: number) {
    const activeConsultas = await this.prisma.consulta.findMany({
      where: {
        fecha_fin: null,
        id_usuario: userId,
      },
      include: {
        persona: {
          select: {
            id_persona: true,
            primer_nombre: true,
            segundo_nombre: true,
            primer_apellido: true,
            segundo_apellido: true,
            numero_identidad: true,
            fecha_nacimiento: true,
            sexo: true,
            telefono: true,
          },
        },
        doctor: {
          select: {
            id_usuario: true,
            persona: {
              select: {
                primer_nombre: true,
                primer_apellido: true,
              },
            },
          },
        },
      },
      orderBy: { fecha_inicio: 'desc' },
    });

    const seen = new Set<number>();
    return activeConsultas
      .filter((c) => {
        if (seen.has(c.id_persona)) return false;
        seen.add(c.id_persona);
        return true;
      })
      .map((c) => ({
        id_persona: c.persona.id_persona,
        primer_nombre: c.persona.primer_nombre,
        segundo_nombre: c.persona.segundo_nombre,
        primer_apellido: c.persona.primer_apellido,
        segundo_apellido: c.persona.segundo_apellido,
        numero_identidad: c.persona.numero_identidad,
        fecha_nacimiento: c.persona.fecha_nacimiento,
        sexo: c.persona.sexo,
        telefono: c.persona.telefono,
        id_consulta: c.id_consulta,
        doctor: c.doctor
          ? {
              id_usuario: c.doctor.id_usuario,
              nombre: `${c.doctor.persona.primer_nombre} ${c.doctor.persona.primer_apellido}`,
            }
          : null,
        fecha_inicio: c.fecha_inicio,
      }));
  }

  private async assertPatientExists(id: number) {
    const persona = await this.prisma.persona.findUnique({
      where: { id_persona: id },
      select: { id_persona: true },
    });
    if (!persona) {
      throw new NotFoundException(`No se encontró el paciente con id ${id}`);
    }
  }

  private async assertToothExists(numero: number) {
    const diente = await this.prisma.diente.findUnique({
      where: { numero_diente: numero },
      select: { numero_diente: true },
    });
    if (!diente) {
      throw new NotFoundException(
        `No se encontró el diente con número ${numero}`,
      );
    }
  }
}
