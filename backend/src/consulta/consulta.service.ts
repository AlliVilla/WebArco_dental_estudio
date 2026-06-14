import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { UpdateConsultaDto } from './dto/update-consulta.dto';
import { Prisma } from '@prisma/client';

const consultaInclude = {
  cita: {
    select: {
      id_cita: true,
      tipo_cita: true,
      estado: true,
      fecha_inicio: true,
      fecha_fin: true,
    },
  },
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
  pagos: {
    orderBy: { fecha: 'desc' },
  },
} satisfies Prisma.ConsultaInclude;

@Injectable()
export class ConsultaService {
  constructor(private prisma: PrismaService) {}

  async create(createConsultaDto: CreateConsultaDto) {
    await this.assertPersonaExists(createConsultaDto.id_persona);
    await this.assertUsuarioExists(createConsultaDto.id_usuario);

    if (createConsultaDto.id_cita) {
      await this.assertCitaExists(createConsultaDto.id_cita);
    }

    const consulta = await this.prisma.consulta.create({
      data: {
        id_persona: createConsultaDto.id_persona,
        id_usuario: createConsultaDto.id_usuario,
        id_cita: createConsultaDto.id_cita ?? null,
        fecha_inicio: new Date(createConsultaDto.fecha_inicio),
        fecha_fin: createConsultaDto.fecha_fin
          ? new Date(createConsultaDto.fecha_fin)
          : null,
        motivo: createConsultaDto.motivo ?? null,
        notas: createConsultaDto.notas ?? null,
        diagnostico: createConsultaDto.diagnostico ?? null,
        tratamiento: createConsultaDto.tratamiento ?? null,
        firma_paciente: createConsultaDto.firma_paciente ?? null,
        consentimiento: createConsultaDto.consentimiento ?? false,
      },
      include: consultaInclude,
    });

    return consulta;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters?: {
      id_persona?: number;
      id_usuario?: number;
    },
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.ConsultaWhereInput = {};

    if (filters?.id_persona) {
      where.id_persona = filters.id_persona;
    }
    if (filters?.id_usuario) {
      where.id_usuario = filters.id_usuario;
    }

    const [consultas, total] = await Promise.all([
      this.prisma.consulta.findMany({
        where,
        skip,
        take: limit,
        include: consultaInclude,
        orderBy: { fecha_inicio: 'desc' },
      }),
      this.prisma.consulta.count({ where }),
    ]);

    return {
      data: consultas,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: id },
      include: {
        ...consultaInclude,
        respuestas: {
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
      },
    });

    if (!consulta) {
      throw new NotFoundException(`No se encontró la consulta con id ${id}`);
    }

    return consulta;
  }

  async update(id: number, updateConsultaDto: UpdateConsultaDto) {
    await this.findOne(id);

    if (updateConsultaDto.id_persona) {
      await this.assertPersonaExists(updateConsultaDto.id_persona);
    }
    if (updateConsultaDto.id_usuario) {
      await this.assertUsuarioExists(updateConsultaDto.id_usuario);
    }
    if (updateConsultaDto.id_cita) {
      await this.assertCitaExists(updateConsultaDto.id_cita);
    }

    const updateData: Record<string, unknown> = {};
    if (updateConsultaDto.id_persona !== undefined)
      updateData.id_persona = updateConsultaDto.id_persona;
    if (updateConsultaDto.id_usuario !== undefined)
      updateData.id_usuario = updateConsultaDto.id_usuario;
    if (updateConsultaDto.id_cita !== undefined)
      updateData.id_cita = updateConsultaDto.id_cita;
    if (updateConsultaDto.fecha_inicio !== undefined)
      updateData.fecha_inicio = new Date(updateConsultaDto.fecha_inicio);
    if (updateConsultaDto.fecha_fin !== undefined)
      updateData.fecha_fin = updateConsultaDto.fecha_fin
        ? new Date(updateConsultaDto.fecha_fin)
        : null;
    if (updateConsultaDto.motivo !== undefined)
      updateData.motivo = updateConsultaDto.motivo;
    if (updateConsultaDto.notas !== undefined)
      updateData.notas = updateConsultaDto.notas;
    if (updateConsultaDto.diagnostico !== undefined)
      updateData.diagnostico = updateConsultaDto.diagnostico;
    if (updateConsultaDto.tratamiento !== undefined)
      updateData.tratamiento = updateConsultaDto.tratamiento;
    if (updateConsultaDto.firma_paciente !== undefined)
      updateData.firma_paciente = updateConsultaDto.firma_paciente;
    if (updateConsultaDto.consentimiento !== undefined)
      updateData.consentimiento = updateConsultaDto.consentimiento;

    const updated = await this.prisma.consulta.update({
      where: { id_consulta: id },
      data: updateData,
      include: consultaInclude,
    });

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);

    const antecedentesCount = await this.prisma.consultaRespuesta.count({
      where: { id_consulta: id },
    });
    const odontogramasCount = await this.prisma.odontograma.count({
      where: { id_consulta: id },
    });
    const pagosCount = await this.prisma.pagoPaciente.count({
      where: { id_consulta: id },
    });

    if (antecedentesCount > 0 || odontogramasCount > 0 || pagosCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar la consulta porque tiene registros asociados (antecedentes, odontogramas o pagos)',
      );
    }

    await this.prisma.consulta.delete({
      where: { id_consulta: id },
    });

    return { message: 'Consulta eliminada exitosamente' };
  }

  private async assertCitaExists(id: number) {
    const cita = await this.prisma.cita.findUnique({
      where: { id_cita: id },
      select: { id_cita: true },
    });
    if (!cita) {
      throw new BadRequestException(
        `No existe una cita con el id ${id}`,
      );
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
