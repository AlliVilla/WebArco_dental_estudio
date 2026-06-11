import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { RegistrarVisitaDto } from './dto/registrar-visita.dto';
import { ActualizarFirmasDto } from './dto/actualizar-firmas.dto';

/** Campos del doctor incluidos en cada consulta */
const doctorSelect = {
  id_usuario: true,
  username: true,
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
        municipio: {
          select: {
            id_municipio: true,
            nombre: true,
            departamento: {
              select: { id_departamento: true, nombre: true },
            },
          },
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
      (c) => !c.firma_paciente || !c.firma_doctor_snapshot,
    ).length;

    return {
      paciente,
      resumen: {
        total_consultas: totalConsultas,
        firmas_pendientes: firmasPendientes,
        pendingSignaturesCount: firmasPendientes,
        alerta_firmas: firmasPendientes > 0,
      },
      pendingSignaturesCount: firmasPendientes,
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
          { firma_doctor_snapshot: null },
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

  /**
   * Registra una nueva visita/consulta en el expediente del paciente.
   * Si se envía firma_doctor, actualiza también la firma del usuario.
   * Retorna la visita creada con el estado de firmas calculado.
   */
  async registrarVisita(idPaciente: number, dto: RegistrarVisitaDto) {
    // Verificar que el paciente existe
    await this.assertPacienteExiste(idPaciente);

    // Verificar que el doctor (usuario) existe
    const doctor = await this.prisma.usuario.findUnique({
      where: { id_usuario: dto.id_usuario },
      select: { id_usuario: true, firma: true },
    });
    if (!doctor) {
      throw new BadRequestException(
        `No existe un usuario con el id ${dto.id_usuario}`,
      );
    }

    // Construir diagnóstico final (incluye notas_adicionales si se proporcionan)
    let diagnosticoFinal: string | undefined = dto.diagnostico;
    if (dto.notas_adicionales) {
      diagnosticoFinal = diagnosticoFinal
        ? `${diagnosticoFinal}\n\n--- Notas adicionales ---\n${dto.notas_adicionales}`
        : `--- Notas adicionales ---\n${dto.notas_adicionales}`;
    }

    // Crear la visita en una transacción para garantizar consistencia
    const visita = await this.prisma.$transaction(async (tx) => {
      // 1. Crear la consulta/visita
      const nuevaConsulta = await tx.consulta.create({
        data: {
          id_persona: idPaciente,
          id_usuario: dto.id_usuario,
          fecha_inicio: new Date(dto.fecha_inicio),
          fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : null,
          diagnostico: diagnosticoFinal ?? null,
          tratamiento: dto.tratamiento ?? null,
          firma_paciente: dto.firma_paciente ?? null,
          consentimiento: Boolean(dto.firma_paciente),
        },
        include: visitaInclude,
      }) as Prisma.ConsultaGetPayload<{ include: typeof visitaInclude }>;

      // 2. Guardar firma del doctor como snapshot en la consulta
      if (dto.firma_doctor) {
        await tx.consulta.update({
          where: { id_consulta: nuevaConsulta.id_consulta },
          data: { firma_doctor_snapshot: dto.firma_doctor },
        });
        nuevaConsulta.firma_doctor_snapshot = dto.firma_doctor;
      }

      return nuevaConsulta;
    });

    const visitaMapeada = this.mapearConsultaConEstadoFirmas(visita as Parameters<typeof this.mapearConsultaConEstadoFirmas>[0]);

    return {
      message: 'Visita registrada exitosamente',
      alerta_firmas: !visitaMapeada.estado_firmas.firmas_completas
        ? {
            activa: true,
            pendientes: visitaMapeada.estado_firmas.pendientes,
          }
        : { activa: false, pendientes: [] },
      visita: visitaMapeada,
    };
  }

  /**
   * Retorna el detalle completo de una visita específica de un paciente.
   * Incluye estado de firmas calculado.
   */
  async obtenerDetalleVisita(idPaciente: number, idVisita: number) {
    await this.assertPacienteExiste(idPaciente);

    const visita = await this.prisma.consulta.findFirst({
      where: {
        id_consulta: idVisita,
        id_persona: idPaciente,
      },
      include: visitaInclude,
    });

    if (!visita) {
      throw new NotFoundException(
        `No se encontró la visita con id ${idVisita} para el paciente con id ${idPaciente}`,
      );
    }

    return this.mapearConsultaConEstadoFirmas(visita);
  }

  /**
   * Actualiza las firmas pendientes (paciente y/o doctor) de una visita existente.
   * - Valida que el body traiga al menos una firma.
   * - No sobreescribe firmas ya existentes (lanza BadRequestException).
   * - Si dto.firma_doctor se provee, actualiza la firma del usuario doctor asociado.
   */
  async actualizarFirmas(
    idPaciente: number,
    idVisita: number,
    dto: ActualizarFirmasDto,
  ) {
    // Debe enviarse al menos una firma
    if (!dto.firma_paciente && !dto.firma_doctor) {
      throw new BadRequestException(
        'Debe proporcionar al menos una firma: firma_paciente o firma_doctor',
      );
    }

    await this.assertPacienteExiste(idPaciente);

    // Obtener la visita validando que pertenezca al paciente
    const visita = await this.prisma.consulta.findFirst({
      where: { id_consulta: idVisita, id_persona: idPaciente },
      include: visitaInclude,
    });

    if (!visita) {
      throw new NotFoundException(
        `No se encontró la visita con id ${idVisita} para el paciente con id ${idPaciente}`,
      );
    }

    // Proteger firmas ya existentes para no sobreescribirlas
    if (dto.firma_paciente && visita.firma_paciente) {
      throw new BadRequestException(
        'La firma del paciente ya existe en esta visita y no puede ser sobreescrita',
      );
    }
    if (dto.firma_doctor && visita.firma_doctor_snapshot) {
      throw new BadRequestException(
        'La firma del doctor ya existe y no puede ser sobreescrita',
      );
    }

    // Aplicar actualizaciones en una transacción
    const visitaActualizada = await this.prisma.$transaction(async (tx) => {
      // 1. Actualizar firmas en la consulta
      const datosConsulta: {
        firma_paciente?: string;
        consentimiento?: boolean;
        firma_doctor_snapshot?: string;
      } = {};
      if (dto.firma_paciente) {
        datosConsulta.firma_paciente = dto.firma_paciente;
        datosConsulta.consentimiento = true;
      }
      if (dto.firma_doctor) {
        datosConsulta.firma_doctor_snapshot = dto.firma_doctor;
      }

      const consultaActualizada = await tx.consulta.update({
        where: { id_consulta: idVisita },
        data: datosConsulta,
        include: visitaInclude,
      });

      return consultaActualizada;
    });

    const visitaMapeada = this.mapearConsultaConEstadoFirmas(visitaActualizada);

    return {
      message: 'Firmas actualizadas exitosamente',
      alerta_firmas: !visitaMapeada.estado_firmas.firmas_completas
        ? {
            activa: true,
            pendientes: visitaMapeada.estado_firmas.pendientes,
          }
        : { activa: false, pendientes: [] },
      visita: visitaMapeada,
    };
  }

  // ─── Helpers privados ───────────────────────────────────────────────────────

  /**
   * Agrega campos calculados de estado de firmas a cada consulta.
   */
  private mapearConsultaConEstadoFirmas(consulta: {
    id_consulta: number;
    firma_paciente: string | null;
    firma_doctor_snapshot: string | null;
    [key: string]: unknown;
  }) {
    const firmaPacientePresente = Boolean(consulta.firma_paciente);
    const firmaDoctorPresente = Boolean(consulta.firma_doctor_snapshot);

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
