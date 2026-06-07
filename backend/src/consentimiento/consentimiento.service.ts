import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryConsentimientoDto } from './dto/query-consentimiento.dto';
import { CreateConsentimientoDto } from './dto/create-consentimiento.dto';
import { UpdateSignaturesDto } from './dto/update-signatures.dto';

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
        };
      case 'incompletos':
        return {
          OR: [
            { firma_paciente: { not: null }, doctor: { firma: null } },
            { firma_paciente: { not: null }, doctor: { firma: { not: null } }, consentimiento: false },
            { firma_paciente: null, consentimiento: true },
          ],
        };
      default:
        return {};
    }
  }

  async create(data: CreateConsentimientoDto) {
    // Si el doctor adjuntó firma, actualizamos su perfil de usuario
    if (data.firma_doctor) {
      await this.prisma.usuario.update({
        where: { id_usuario: data.id_doctor },
        data: { firma: data.firma_doctor },
      });
    }

    return this.prisma.consulta.create({
      data: {
        id_persona: data.id_paciente,
        id_usuario: data.id_doctor,
        fecha_inicio: new Date(data.fecha),
        tratamiento: data.tipo_tratamiento,
        firma_paciente: data.firma_paciente,
        consentimiento: true,
      },
    });
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
            select: { id_persona: true, numero_identidad: true, primer_nombre: true, primer_apellido: true },
          },
          doctor: {
            select: { id_usuario: true, username: true, firma: true },
          },
        },
      }),
    ]);

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

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(idConsulta: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: idConsulta },
      include: {
        persona: true,
        doctor: { select: { id_usuario: true, username: true, firma: true } },
      },
    });

    if (!consulta) {
      throw new NotFoundException(`Consentimiento (consulta) con ID ${idConsulta} no encontrado`);
    }

    const tieneFirmaPaciente = !!consulta.firma_paciente;
    const tieneFirmaDoctor = !!consulta.doctor.firma;
    let estadoFirma = 'pendiente';
    if (tieneFirmaPaciente && tieneFirmaDoctor && consulta.consentimiento) {
      estadoFirma = 'completo';
    } else if (tieneFirmaPaciente || consulta.consentimiento) {
      estadoFirma = 'incompleto';
    }

    return {
      ...consulta,
      estado_firmas: estadoFirma,
      tiene_firma_paciente: tieneFirmaPaciente,
      tiene_firma_doctor: tieneFirmaDoctor,
    };
  }

  async getStats() {
    const [total, completos, pendientes, incompletos] = await Promise.all([
      this.prisma.consulta.count(),
      this.prisma.consulta.count({ where: this.getEstadoWhere('completos') }),
      this.prisma.consulta.count({ where: this.getEstadoWhere('pendientes') }),
      this.prisma.consulta.count({ where: this.getEstadoWhere('incompletos') }),
    ]);

    return { total, completos, pendientes, incompletos };
  }

  async updateSignatures(idConsulta: number, data: UpdateSignaturesDto) {
    const consulta = await this.prisma.consulta.findUnique({ where: { id_consulta: idConsulta } });
    if (!consulta) throw new NotFoundException(`Consentimiento no encontrado`);

    if (data.firma_doctor) {
      await this.prisma.usuario.update({
        where: { id_usuario: consulta.id_usuario },
        data: { firma: data.firma_doctor },
      });
    }

    if (data.firma_paciente) {
      await this.prisma.consulta.update({
        where: { id_consulta: idConsulta },
        data: { firma_paciente: data.firma_paciente },
      });
    }

    return this.findOne(idConsulta);
  }

  async imprimirConsentimiento(idConsulta: number) {
    const data = await this.findOne(idConsulta);
    return {
      consulta_id: data.id_consulta,
      fecha: data.fecha_inicio,
      diagnostico: data.diagnostico,
      tratamiento: data.tratamiento,
      paciente: {
        identidad: data.persona.numero_identidad,
        nombre_completo: `${data.persona.primer_nombre} ${data.persona.primer_apellido}`,
        telefono: data.persona.telefono,
      },
      doctor: {
        nombre: data.doctor.username,
        firma: data.doctor.firma,
      },
      firma_paciente: data.firma_paciente,
      consentimiento_aceptado: data.consentimiento,
      estado_firmas: data.estado_firmas,
    };
  }
}
