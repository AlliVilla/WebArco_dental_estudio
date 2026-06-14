import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { RegistrarConsultaDto } from './dto/registrar-consulta.dto';
import { ActualizarFirmasDto } from './dto/actualizar-firmas.dto';

/** Campos del doctor incluidos en cada consulta */
const doctorSelect = {
  id_usuario: true,
  username: true,
  persona: {
    select: {
      primer_nombre: true,
      primer_apellido: true,
      sexo: true,
    },
  },
} satisfies Prisma.UsuarioSelect;

/** Include base para consultas dentro del expediente */
const consultaInclude = {
  doctor: {
    select: doctorSelect,
  },
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
  tratamientos: {
    include: {
      tratamiento: true,
    },
  },
  archivos: true,
  tratamientoPaciente: {
    select: {
      id: true,
      nombre: true,
      costoTotal: true,
      estado: true,
      fechaInicio: true,
    },
  },
  pagosConsulta: {
    include: {
      abonos: {
        include: {
          tratamientoPaciente: {
            select: { id: true, nombre: true },
          },
        },
      },
    },
    orderBy: { fecha: 'desc' },
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

    const [consultas, tratamientosPaciente] = await Promise.all([
      this.prisma.consulta.findMany({
        where: { id_persona: idPaciente },
        include: consultaInclude,
        orderBy: { fecha_inicio: 'desc' },
      }),
      this.prisma.tratamientoPaciente.findMany({
        where: { pacienteId: idPaciente },
        include: {
          consultas: {
            orderBy: { fecha_inicio: 'desc' },
            include: {
              doctor: {
                select: {
                  id_usuario: true,
                  username: true,
                  persona: { select: { primer_nombre: true, primer_apellido: true } },
                },
              },
              pagosConsulta: true,
            },
          },
          abonos: {
            include: {
              pagoConsulta: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalConsultas = consultas.length;
    const firmasPendientes = consultas.filter(
      (c) => !c.firma_paciente || !c.firma_doctor_snapshot,
    ).length;

    const tratamientosConSaldo = tratamientosPaciente.map((t) => {
      const totalAbonado = t.abonos.reduce((s, a) => s + Number(a.montoAbonado), 0);
      return {
        id: t.id,
        nombre: t.nombre,
        costoTotal: Number(t.costoTotal),
        totalAbonado,
        saldoPendiente: Number(t.costoTotal) - totalAbonado,
        estado: t.estado,
        fechaInicio: t.fechaInicio,
        fechaFin: t.fechaFin,
        consultas: t.consultas,
      };
    });

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
      tratamientos: tratamientosConSaldo,
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
      include: consultaInclude,
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
   * Registra una nueva consulta en el expediente del paciente.
   * Si se envía firma_doctor, actualiza también la firma del usuario.
   * Retorna la consulta creada con el estado de firmas calculado.
   */
  async registrarConsulta(idPaciente: number, dto: RegistrarConsultaDto) {
    await this.assertPacienteExiste(idPaciente);

    const doctor = await this.prisma.usuario.findUnique({
      where: { id_usuario: dto.id_usuario },
      select: { id_usuario: true, firma: true },
    });
    if (!doctor) {
      throw new BadRequestException(
        `No existe un usuario con el id ${dto.id_usuario}`,
      );
    }

    // If fecha_fin is provided (finalizing consultation), make sure there's at least one treatment
    if (dto.fecha_fin) {
      const hasTratamiento = 
        dto.tratamiento?.trim() !== '' && dto.tratamiento !== undefined ||
        dto.tratamientoPacienteId !== undefined ||
        (dto.tratamientos && dto.tratamientos.length > 0);
      
      if (!hasTratamiento) {
        throw new BadRequestException(
          'Debe agregar al menos un tratamiento antes de finalizar la consulta.',
        );
      }
    }

    const consultaCreada = await this.prisma.$transaction(async (tx) => {
      if (dto.tratamientoPacienteId) {
        const tp = await tx.tratamientoPaciente.findUnique({
          where: { id: dto.tratamientoPacienteId },
          select: { id: true, pacienteId: true },
        });
        if (!tp || tp.pacienteId !== idPaciente) {
          throw new BadRequestException('El tratamiento de paciente no existe o no pertenece a este paciente');
        }
      }

      const nuevaConsulta = await tx.consulta.create({
        data: {
          id_persona: idPaciente,
          id_usuario: dto.id_usuario,
          fecha_inicio: new Date(dto.fecha_inicio),
          fecha_fin: dto.fecha_fin ? new Date(dto.fecha_fin) : null,
          motivo: dto.motivo ?? null,
          diagnostico: dto.diagnostico ?? null,
          tratamiento: dto.tratamiento ?? null,
          notas: dto.notas_adicionales ?? null,
          firma_paciente: dto.firma_paciente ?? null,
          consentimiento: Boolean(dto.firma_paciente),
          tratamientoPacienteId: dto.tratamientoPacienteId ?? null,
        },
      });

      if (dto.firma_doctor) {
        await tx.consulta.update({
          where: { id_consulta: nuevaConsulta.id_consulta },
          data: { firma_doctor_snapshot: dto.firma_doctor },
        });
      }

      if (dto.tratamientos && dto.tratamientos.length > 0) {
        const validTratamientos = dto.tratamientos.filter((t) => t.id_tratamiento > 0);
        if (validTratamientos.length > 0) {
          await tx.consulta_Tratamiento.createMany({
            data: validTratamientos.map((t) => ({
              id_consulta: nuevaConsulta.id_consulta,
              id_tratamiento: t.id_tratamiento,
              precio: t.precio,
              descuento: t.descuento ?? 0,
            })),
          });
        }
      }

      if (dto.respuestas && dto.respuestas.length > 0) {
        await tx.consultaRespuesta.createMany({
          data: dto.respuestas.map((r) => ({
            id_consulta: nuevaConsulta.id_consulta,
            id_pregunta: r.id_pregunta,
            respuesta_boolean: r.respuestaBoolean ?? null,
            explanation: r.explanation ?? null,
          })),
        });
      }

      return tx.consulta.findUnique({
        where: { id_consulta: nuevaConsulta.id_consulta },
        include: consultaInclude,
      }) as Promise<Prisma.ConsultaGetPayload<{ include: typeof consultaInclude }>>;
    });

    const consultaMapeada = this.mapearConsultaConEstadoFirmas(consultaCreada);

    return {
      message: 'Consulta registrada exitosamente',
      alerta_firmas: !consultaMapeada.estado_firmas.firmas_completas
        ? {
            activa: true,
            pendientes: consultaMapeada.estado_firmas.pendientes,
          }
        : { activa: false, pendientes: [] },
      consulta: consultaMapeada,
    };
  }

  /**
   * Retorna el detalle completo de una consulta específica de un paciente.
   * Incluye estado de firmas calculado.
   */
  async obtenerDetalleConsulta(idPaciente: number, idConsulta: number) {
    await this.assertPacienteExiste(idPaciente);

    const consulta = await this.prisma.consulta.findFirst({
      where: {
        id_consulta: idConsulta,
        id_persona: idPaciente,
      },
      include: consultaInclude,
    });

    if (!consulta) {
      throw new NotFoundException(
        `No se encontró la consulta con id ${idConsulta} para el paciente con id ${idPaciente}`,
      );
    }

    return this.mapearConsultaConEstadoFirmas(consulta);
  }

  /**
   * Actualiza las firmas pendientes (paciente y/o doctor) de una consulta existente.
   * - Valida que el body traiga al menos una firma.
   * - No sobreescribe firmas ya existentes (lanza BadRequestException).
   * - Si dto.firma_doctor se provee, actualiza la firma del usuario doctor asociado.
   */
  async actualizarFirmas(
    idPaciente: number,
    idConsulta: number,
    dto: ActualizarFirmasDto,
  ) {
    // Debe enviarse al menos una firma
    if (!dto.firma_paciente && !dto.firma_doctor) {
      throw new BadRequestException(
        'Debe proporcionar al menos una firma: firma_paciente o firma_doctor',
      );
    }

    await this.assertPacienteExiste(idPaciente);

    // Obtener la consulta validando que pertenezca al paciente
    const consulta = await this.prisma.consulta.findFirst({
      where: { id_consulta: idConsulta, id_persona: idPaciente },
      include: consultaInclude,
    });

    if (!consulta) {
      throw new NotFoundException(
        `No se encontró la consulta con id ${idConsulta} para el paciente con id ${idPaciente}`,
      );
    }

    // Proteger firmas ya existentes para no sobreescribirlas
    if (dto.firma_paciente && consulta.firma_paciente) {
      throw new BadRequestException(
        'La firma del paciente ya existe en esta consulta y no puede ser sobreescrita',
      );
    }
    if (dto.firma_doctor && consulta.firma_doctor_snapshot) {
      throw new BadRequestException(
        'La firma del doctor ya existe y no puede ser sobreescrita',
      );
    }

    // Aplicar actualizaciones en una transacción
    const consultaActualizada = await this.prisma.$transaction(async (tx) => {
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
        where: { id_consulta: idConsulta },
        data: datosConsulta,
        include: consultaInclude,
      });

      return consultaActualizada;
    });

    const consultaMapeada = this.mapearConsultaConEstadoFirmas(consultaActualizada);

    return {
      message: 'Firmas actualizadas exitosamente',
      alerta_firmas: !consultaMapeada.estado_firmas.firmas_completas
        ? {
            activa: true,
            pendientes: consultaMapeada.estado_firmas.pendientes,
          }
        : { activa: false, pendientes: [] },
      consulta: consultaMapeada,
    };
  }

  /**
   * Vincula archivos subidos a una consulta existente.
   */
  async agregarArchivos(
    idPaciente: number,
    idConsulta: number,
    archivos: Array<{ nombre: string; url: string; categoria: string }>,
  ) {
    const consulta = await this.prisma.consulta.findFirst({
      where: { id_consulta: idConsulta, id_persona: idPaciente },
    });
    if (!consulta) {
      throw new NotFoundException('Consulta no encontrada');
    }

    await this.prisma.archivo.createMany({
      data: archivos.map((a) => ({
        id_consulta: idConsulta,
        nombre: a.nombre,
        url: a.url,
        categoria: a.categoria as any,
      })),
    });

    return { message: `${archivos.length} archivo(s) vinculados` };
  }

  /**
   * Obtener todos los archivos de un paciente
   */
  async obtenerArchivosPaciente(idPaciente: number) {
    await this.assertPacienteExiste(idPaciente);

    const archivos = await this.prisma.archivo.findMany({
      where: {
        consulta: {
          id_persona: idPaciente,
        },
      },
      include: {
        consulta: {
          select: {
            fecha_inicio: true,
            fecha_fin: true,
            motivo: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return archivos;
  }

  /**
   * Subir un archivo a una consulta
   */
  async subirArchivo(
    idPaciente: number,
    file: Express.Multer.File,
    categoria: string,
    nombre: string,
    idConsulta: number,
  ) {
    const consulta = await this.prisma.consulta.findFirst({
      where: { id_consulta: idConsulta, id_persona: idPaciente },
    });
    if (!consulta) {
      throw new NotFoundException('Consulta no encontrada');
    }

    const url = `/uploads/${file.filename}`;

    const archivo = await this.prisma.archivo.create({
      data: {
        id_consulta: idConsulta,
        nombre: nombre || file.originalname,
        categoria: categoria as any,
        url,
      },
      include: {
        consulta: {
          select: {
            fecha_inicio: true,
            fecha_fin: true,
            motivo: true,
          },
        },
      },
    });

    return archivo;
  }

  /**
   * Eliminar un archivo
   */
  async eliminarArchivo(idPaciente: number, idArchivo: number) {
    await this.assertPacienteExiste(idPaciente);

    const archivo = await this.prisma.archivo.findUnique({
      where: { id_archivo: idArchivo },
      include: { consulta: true },
    });

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado');
    }

    if (archivo.consulta.id_persona !== idPaciente) {
      throw new BadRequestException('El archivo no pertenece a este paciente');
    }

    await this.prisma.archivo.delete({
      where: { id_archivo: idArchivo },
    });

    return { message: 'Archivo eliminado exitosamente' };
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
