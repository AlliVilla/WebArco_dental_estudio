import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/** Campos del doctor incluidos en cada consulta */
const doctorSelect = {
  id_usuario: true,
  username: true,
  firma: true,
  persona: {
    select: {
      primer_nombre: true,
      primer_apellido: true,
    },
  },
} satisfies Prisma.UsuarioSelect;

/** Include base para visitas dentro del expediente */
const visitaInclude = {
  doctor: {
    select: doctorSelect,
  },
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
    orderBy: { fecha: 'desc' as const },
  },
} satisfies Prisma.ConsultaInclude;

@Injectable()
export class ExpedienteClinicoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna el expediente clínico completo de un paciente:
   * datos personales + lista de consultas ordenadas por fecha desc.
   */
  async obtenerExpediente(idPaciente: number) {
    const paciente = await this.prisma.persona.findUnique({
      where: { id_persona: idPaciente },
      select: {
        id_persona: true,
        numero_identidad: true,
        primer_nombre: true,
        segundo_nombre: true,
        primer_apellido: true,
        segundo_apellido: true,
        fecha_nacimiento: true,
        telefono: true,
        correo_electronico: true,
        sexo: true,
        direccion_linea: true,
        departamento: {
          select: { id_departamento: true, nombre: true },
        },
        municipio: {
          select: { id_municipio: true, nombre: true },
        },
      },
    });

    if (!paciente) {
      throw new NotFoundException(
        `No se encontró el paciente con id ${idPaciente}`,
      );
    }

    const consultas = await this.prisma.consulta.findMany({
      where: { id_persona: idPaciente },
      include: visitaInclude,
      orderBy: { fecha_inicio: 'desc' },
    });

    const totalConsultas = consultas.length;
    const firmasPendientes = consultas.filter(
      (c) => !c.firma_paciente || !c.doctor.firma,
    ).length;

    return {
      paciente,
      resumen: {
        total_consultas: totalConsultas,
        firmas_pendientes: firmasPendientes,
        alerta_firmas: firmasPendientes > 0,
      },
      consultas: consultas.map((consulta) =>
        this.mapearConsultaConEstadoFirmas(consulta),
      ),
    };
  }

  /**
   * Retorna solo las consultas del paciente que tienen firmas incompletas
   * (falta firma del paciente o firma del doctor).
   */
  async obtenerFirmasPendientes(idPaciente: number) {
    await this.assertPacienteExiste(idPaciente);

    const consultasPendientes = await this.prisma.consulta.findMany({
      where: {
        id_persona: idPaciente,
        OR: [
          { firma_paciente: null },
          { doctor: { firma: null } },
        ],
      },
      include: visitaInclude,
      orderBy: { fecha_inicio: 'desc' },
    });

    return {
      id_paciente: idPaciente,
      total_pendientes: consultasPendientes.length,
      alerta: consultasPendientes.length > 0,
      consultas: consultasPendientes.map((consulta) =>
        this.mapearConsultaConEstadoFirmas(consulta),
      ),
    };
  }

  // ─── Helpers privados ───────────────────────────────────────────────────────

  /**
   * Agrega campos calculados de estado de firmas a cada consulta.
   */
  private mapearConsultaConEstadoFirmas(consulta: {
    id_consulta: number;
    firma_paciente: string | null;
    doctor: { firma: string | null };
    [key: string]: unknown;
  }) {
    const firmaPacientePresente = Boolean(consulta.firma_paciente);
    const firmaDoctorPresente = Boolean(consulta.doctor.firma);

    return {
      ...consulta,
      estado_firmas: {
        firma_paciente_presente: firmaPacientePresente,
        firma_doctor_presente: firmaDoctorPresente,
        firmas_completas: firmaPacientePresente && firmaDoctorPresente,
        pendientes: [
          ...(!firmaPacientePresente ? ['paciente'] : []),
          ...(!firmaDoctorPresente ? ['doctor'] : []),
        ] as string[],
      },
    };
  }

  private async assertPacienteExiste(idPaciente: number) {
    const existe = await this.prisma.persona.findUnique({
      where: { id_persona: idPaciente },
      select: { id_persona: true },
    });
    if (!existe) {
      throw new NotFoundException(
        `No se encontró el paciente con id ${idPaciente}`,
      );
    }
  }
}
