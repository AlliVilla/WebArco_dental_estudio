import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryConsentimientoDto } from './dto/query-consentimiento.dto';
import { CreateConsentimientoDto } from './dto/create-consentimiento.dto';

@Injectable()
export class ConsentimientoService {
  constructor(private prisma: PrismaService) {}

  private getEstadoWhere(estado?: string) {
    switch (estado) {
      case 'completos':
        return {
          firma_paciente: { not: null },
          consentimiento: true,
          doctor: { firma: { not: null } },
        };
      case 'pendientes':
        return {
          firma_paciente: null,
          consentimiento: false,
          // Un consentimiento pendiente no tiene firma de paciente
        };
      case 'incompletos':
        return {
          OR: [
            // Tiene firma de paciente pero el doctor no tiene firma
            { firma_paciente: { not: null }, doctor: { firma: null } },
            // Tiene firma de paciente y doctor pero el checkbox consentimiento es false
            { firma_paciente: { not: null }, doctor: { firma: { not: null } }, consentimiento: false },
            // El paciente no ha firmado pero ya se marcó el consentimiento (estado inconsistente)
            { firma_paciente: null, consentimiento: true },
          ],
        };
      default:
        return {};
    }
  }

  async findAll(query: QueryConsentimientoDto) {
    const { page = 1, limit = 10, paciente, tratamiento, estado, doctor, mes, anio } = query;
    const skip = (page - 1) * limit;

    const where: any = { ...this.getEstadoWhere(estado) };

    if (paciente) {
      where.persona = {
        OR: [
          { numero_identidad: { contains: paciente, mode: 'insensitive' } },
          { primer_nombre: { contains: paciente, mode: 'insensitive' } },
          { primer_apellido: { contains: paciente, mode: 'insensitive' } },
        ],
      };
    }

    if (tratamiento) {
      where.tratamiento = { contains: tratamiento, mode: 'insensitive' };
    }

    if (doctor) {
      where.id_usuario = doctor;
    }

    if (mes || anio) {
      const currentYear = anio || new Date().getFullYear();
      const currentMonth = mes ? mes - 1 : new Date().getMonth();
      
      const start = new Date(currentYear, mes ? currentMonth : 0, 1);
      const end = new Date(currentYear, mes ? currentMonth + 1 : 12, 0, 23, 59, 59);

      where.fecha_inicio = {
        gte: start,
        lte: end,
      };
    }

    const [total, consultas] = await Promise.all([
      this.prisma.consulta.count({ where }),
      this.prisma.consulta.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha_inicio: 'desc' },
        include: {
          persona: {
            select: {
              id_persona: true,
              numero_identidad: true,
              primer_nombre: true,
              primer_apellido: true,
            },
          },
          doctor: {
            select: {
              id_usuario: true,
              username: true,
              firma: true,
            },
          },
        },
      }),
    ]);

    // Mapeamos los resultados para agregar un campo de estado_firmas
    const data = consultas.map((c) => {
      let estadoFirma = 'pendiente';
      const tieneFirmaPaciente = !!c.firma_paciente;
      const tieneFirmaDoctor = !!c.doctor.firma;

      if (tieneFirmaPaciente && tieneFirmaDoctor && c.consentimiento) {
        estadoFirma = 'completo';
      } else if (tieneFirmaPaciente || c.consentimiento) {
        estadoFirma = 'incompleto';
      }

      return {
        id_consulta: c.id_consulta,
        fecha: c.fecha_inicio,
        tratamiento: c.tratamiento,
        consentimiento: c.consentimiento,
        tiene_firma_paciente: tieneFirmaPaciente,
        tiene_firma_doctor: tieneFirmaDoctor,
        estado_firmas: estadoFirma,
        paciente: c.persona,
        doctor: { id_usuario: c.doctor.id_usuario, username: c.doctor.username },
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const [total, completos, pendientes, incompletos] = await Promise.all([
      this.prisma.consulta.count(),
      this.prisma.consulta.count({ where: this.getEstadoWhere('completos') }),
      this.prisma.consulta.count({ where: this.getEstadoWhere('pendientes') }),
      this.prisma.consulta.count({ where: this.getEstadoWhere('incompletos') }),
    ]);

    return {
      total,
      completos,
      pendientes,
      incompletos,
    };
  }

  async registrarConsentimiento(idConsulta: number, data: CreateConsentimientoDto) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: idConsulta },
    });

    if (!consulta) {
      throw new NotFoundException(`Consulta con ID ${idConsulta} no encontrada`);
    }

    return this.prisma.consulta.update({
      where: { id_consulta: idConsulta },
      data: {
        firma_paciente: data.firma_paciente,
        consentimiento: data.consentimiento,
      },
    });
  }

  async imprimirConsentimiento(idConsulta: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: idConsulta },
      include: {
        persona: true,
        doctor: { select: { id_usuario: true, username: true, firma: true } },
      },
    });

    if (!consulta) {
      throw new NotFoundException(`Consulta con ID ${idConsulta} no encontrada`);
    }

    return {
      consulta_id: consulta.id_consulta,
      fecha: consulta.fecha_inicio,
      diagnostico: consulta.diagnostico,
      tratamiento: consulta.tratamiento,
      paciente: {
        identidad: consulta.persona.numero_identidad,
        nombre_completo: `${consulta.persona.primer_nombre} ${consulta.persona.primer_apellido}`,
        telefono: consulta.persona.telefono,
      },
      doctor: {
        nombre: consulta.doctor.username,
        firma: consulta.doctor.firma,
      },
      firma_paciente: consulta.firma_paciente,
      consentimiento_aceptado: consulta.consentimiento,
    };
  }
}
