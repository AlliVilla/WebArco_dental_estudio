import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryConsentimientoDto } from './dto/query-consentimiento.dto';
import { CreateConsentimientoDto } from './dto/create-consentimiento.dto';
import { UpdateSignaturesDto } from './dto/update-signatures.dto';
@Injectable()
export class ConsentimientoService {
  constructor(private prisma: PrismaService) { }

  // --- Helpers 

  /**
   * Si el string es un Data URL (base64), lo retorna tal cual para almacenarlo
   * directamente en la BD (como hace expediente-clínico). Si no, retorna el string
   * original (URL de archivo o null).
   */
  private procesarBase64SiEsNecesario(base64: string | null | undefined, _prefix: string): string | null {
    return base64 || null;
  }

  /** Calcula el estado de firmas en memoria a partir de los valores almacenados. */
  private calcularEstadoFirmas(firmaPaciente: string | null, firmaDoctor: string | null) {
    const tieneFirmaPaciente = !!firmaPaciente;
    const tieneFirmaDoctor = !!firmaDoctor;

    let estadoFirmas: 'completo' | 'pendiente' | 'incompleto' = 'incompleto';
    if (tieneFirmaPaciente && tieneFirmaDoctor) {
      estadoFirmas = 'completo';
    } else if (tieneFirmaPaciente || tieneFirmaDoctor) {
      estadoFirmas = 'pendiente';
    }

    return { estadoFirmas, tieneFirmaPaciente, tieneFirmaDoctor };
  }

  /**
   * Construye el nombre completo de una persona incluyendo segundo nombre
   * y segundo apellido si existen.
   */
  private nombresCompletos(persona: {
    primer_nombre: string;
    segundo_nombre?: string | null;
    primer_apellido: string;
    segundo_apellido?: string | null;
  }): string {
    const partes = [
      persona.primer_nombre,
      persona.segundo_nombre ?? null,
      persona.primer_apellido,
      persona.segundo_apellido ?? null,
    ].filter(Boolean);
    return partes.join(' ');
  }

  private getEstadoWhere(estado?: string) {
    const base = {};

    let firmaValues: { firma_paciente: any; firma_doctor_snapshot: any };
    switch (estado) {
      case 'completos':
      case 'completo':
        firmaValues = { firma_paciente: { not: null }, firma_doctor_snapshot: { not: null } };
        break;
      case 'pendientes':
      case 'pendiente':
        return {
          ...base,
          OR: [
            { firma_paciente: { not: null }, firma_doctor_snapshot: null },
            { firma_paciente: null, firma_doctor_snapshot: { not: null } },
          ],
        };
      case 'incompletos':
      case 'incompleto':
        firmaValues = { firma_paciente: null, firma_doctor_snapshot: null };
        break;
      default:
        return base;
    }
    return { ...base, ...firmaValues };
  }

  async create(data: CreateConsentimientoDto) {
    const [personaExiste, doctorExiste] = await Promise.all([
      this.prisma.persona.findUnique({ where: { id_persona: data.id_paciente }, select: { id_persona: true } }),
      this.prisma.usuario.findUnique({ where: { id_usuario: data.id_doctor }, select: { id_usuario: true } }),
    ]);
    if (!personaExiste) {
      throw new NotFoundException(`Paciente con ID ${data.id_paciente} no encontrado`);
    }
    if (!doctorExiste) {
      throw new NotFoundException(`Doctor con ID ${data.id_doctor} no encontrado`);
    }

    const fecha = new Date(data.fecha);
    if (isNaN(fecha.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }

    // Procesar firmas si vienen en base64 en el JSON inicial
    const firmaPacPath = this.procesarBase64SiEsNecesario(data.firma_paciente, 'firma-paciente');
    const firmaDocPath = this.procesarBase64SiEsNecesario(data.firma_doctor, 'firma-doctor');

    const consulta = await this.prisma.consulta.create({
      data: {
        id_persona: data.id_paciente,
        id_usuario: data.id_doctor,
        fecha_inicio: fecha,
        tratamiento: data.tipo_tratamiento,
        diagnostico: data.diagnostico ?? null,
        firma_paciente: firmaPacPath,
        firma_doctor_snapshot: firmaDocPath,
        consentimiento: true,
      },
      include: {
        persona: {
          select: {
            id_persona: true,
            numero_identidad: true,
            primer_nombre: true,
            segundo_nombre: true,
            primer_apellido: true,
            segundo_apellido: true,
          },
        },
        doctor: {
          select: { id_usuario: true, username: true, persona: { select: { primer_nombre: true, segundo_nombre: true, primer_apellido: true, segundo_apellido: true } } },
        },
      },
    });

    const { estadoFirmas, tieneFirmaPaciente, tieneFirmaDoctor } = this.calcularEstadoFirmas(
      consulta.firma_paciente,
      consulta.firma_doctor_snapshot,
    );

    return {
      ...consulta,
      estado_firmas: estadoFirmas,
      tiene_firma_paciente: tieneFirmaPaciente,
      tiene_firma_doctor: tieneFirmaDoctor,
    };
  }

  async findAll(query: QueryConsentimientoDto) {
    const { page = 1, limit = 10, id_persona, paciente, tratamiento, estado, doctor, mes, anio } = query;
    const skip = (page - 1) * limit;

    const where: any = { ...this.getEstadoWhere(estado) };

    if (id_persona) {
      // Filtro exacto por ID de paciente (tiene prioridad sobre búsqueda por nombre)
      where.id_persona = id_persona;
    } else if (paciente) {
      where.persona = {
        OR: [
          { numero_identidad: { contains: paciente, mode: 'insensitive' } },
          { primer_nombre: { contains: paciente, mode: 'insensitive' } },
          { segundo_nombre: { contains: paciente, mode: 'insensitive' } },
          { primer_apellido: { contains: paciente, mode: 'insensitive' } },
          { segundo_apellido: { contains: paciente, mode: 'insensitive' } },
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

      // Fix #16: currentMonth solo se calcula cuando se usa (hay mes)
      const start = mes
        ? new Date(currentYear, mes - 1, 1)
        : new Date(currentYear, 0, 1);
      const end = mes
        ? new Date(currentYear, mes, 0, 23, 59, 59)
        : new Date(currentYear, 12, 0, 23, 59, 59);

      where.fecha_inicio = { gte: start, lte: end };
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
              segundo_nombre: true,
              primer_apellido: true,
              segundo_apellido: true,
            },
          },
          doctor: {
            select: {
              id_usuario: true,
              username: true,
              persona: {
                select: { primer_nombre: true, segundo_nombre: true, primer_apellido: true, segundo_apellido: true },
              },
            },
          },
        },
      }),
    ]);

    const data = consultas.map((c) => {
      const { estadoFirmas, tieneFirmaPaciente, tieneFirmaDoctor } = this.calcularEstadoFirmas(
        c.firma_paciente,
        c.firma_doctor_snapshot,
      );

      return {
        id_consulta: c.id_consulta,
        fecha: c.fecha_inicio,
        tratamiento: c.tratamiento,
        consentimiento: c.consentimiento,
        tiene_firma_paciente: tieneFirmaPaciente,
        tiene_firma_doctor: tieneFirmaDoctor,
        estado_firmas: estadoFirmas,
        firma_paciente: c.firma_paciente,
        firma_doctor: c.firma_doctor_snapshot,
        paciente: c.persona,
        doctor: { id_usuario: c.doctor.id_usuario, username: c.doctor.username, nombre: this.nombresCompletos(c.doctor.persona)},
      };
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(idConsulta: number) {
    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: idConsulta },
      include: {
        persona: true,
        doctor: {
          select: {
            id_usuario: true,
            username: true,
            persona: {
              select: { primer_nombre: true, segundo_nombre: true, primer_apellido: true, segundo_apellido: true },
            },
          },
        },
      },
    });

    if (!consulta) {
      throw new NotFoundException(`Consentimiento con ID ${idConsulta} no encontrado`);
    }

    const { estadoFirmas, tieneFirmaPaciente, tieneFirmaDoctor } = this.calcularEstadoFirmas(
      consulta.firma_paciente,
      consulta.firma_doctor_snapshot,
    );

    return {
      ...consulta,
      estado_firmas: estadoFirmas,
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

    return { total, completos, pendientes, incompletos, pendingCount: pendientes, alerta_global: pendientes > 0 };
  }

  async updateSignatures(idConsulta: number, data: UpdateSignaturesDto) {
    if (!data.firma_paciente && !data.firma_doctor) {
      throw new BadRequestException(
        'Debe proporcionar al menos una firma (firma_paciente o firma_doctor)',
      );
    }

    const consulta = await this.prisma.consulta.findUnique({
      where: { id_consulta: idConsulta },
    });
    if (!consulta) {
      throw new NotFoundException(`Consentimiento con ID ${idConsulta} no encontrado`);
    }

    if (data.firma_paciente && consulta.firma_paciente) {
      throw new ConflictException(
        'La firma del paciente ya existe y no puede sobreescribirse',
      );
    }
    if (data.firma_doctor && consulta.firma_doctor_snapshot) {
      throw new ConflictException(
        'La firma del doctor ya existe y no puede sobreescribirse',
      );
    }

    // Procesar posibles base64 en el DTO (si no vinieron por multer)
    const firmaPacPath = this.procesarBase64SiEsNecesario(data.firma_paciente, 'firma-paciente');
    const firmaDocPath = this.procesarBase64SiEsNecesario(data.firma_doctor, 'firma-doctor');

    // Las URLs vienen resueltas desde el controller (ej: "/uploads/firma-123.png")
    await this.prisma.consulta.update({
      where: { id_consulta: idConsulta },
      data: {
        ...(firmaPacPath && { firma_paciente: firmaPacPath }),
        ...(firmaDocPath && { firma_doctor_snapshot: firmaDocPath }),
      },
    });

    return this.findOne(idConsulta);
  }

  async imprimir(idConsulta: number) {
    const data = await this.findOne(idConsulta);

    const nombreDoctor = this.nombresCompletos(data.doctor.persona);
    const nombrePaciente = this.nombresCompletos(data.persona);

    return {
      consulta_id: data.id_consulta,
      fecha: data.fecha_inicio,
      diagnostico: data.diagnostico,           // Fix #9: ya disponible en la consulta
      tratamiento: data.tratamiento,
      paciente: {
        identidad: data.persona.numero_identidad,
        nombre_completo: nombrePaciente,       // Fix #5: nombre completo del paciente
        telefono: data.persona.telefono,
      },
      doctor: {
        nombre: nombreDoctor,                  // Fix #4: nombre real del doctor
        firma: data.firma_doctor_snapshot,     // Fix #3: firma histórica de la consulta
      },
      firma_paciente: data.firma_paciente,
      consentimiento_aceptado: data.consentimiento,
      estado_firmas: data.estado_firmas,
    };
  }
}
