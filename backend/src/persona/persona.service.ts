import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonaService {
  constructor(private prisma: PrismaService) {}

  async create(createPersonaDto: CreatePersonaDto) {
    const { numero_identidad, correo_electronico } = createPersonaDto;

    const existingPersonaByIdentity = await this.prisma.persona.findUnique({
      where: { numero_identidad },
    });

    if (existingPersonaByIdentity) {
      throw new ConflictException(
        `Ya existe una persona registrada con el número de identidad ${numero_identidad}`,
      );
    }

    if (correo_electronico) {
      const existingPersonaByEmail = await this.prisma.persona.findUnique({
        where: { correo_electronico },
      });

      if (existingPersonaByEmail) {
        throw new ConflictException(
          `Ya existe una persona registrada con el correo electrónico ${correo_electronico}`,
        );
      }
    }

    const municipio = await this.prisma.municipio.findUnique({
      where: { id_municipio: createPersonaDto.id_municipio },
    });

    if (!municipio) {
      throw new BadRequestException(
        `No existe un municipio con el id ${createPersonaDto.id_municipio}`,
      );
    }

    const persona = await this.prisma.persona.create({
      data: {
        numero_identidad,
        correo_electronico: correo_electronico || null,
        primer_nombre: createPersonaDto.primer_nombre,
        segundo_nombre: createPersonaDto.segundo_nombre,
        primer_apellido: createPersonaDto.primer_apellido,
        segundo_apellido: createPersonaDto.segundo_apellido,
        fecha_nacimiento: new Date(createPersonaDto.fecha_nacimiento),
        telefono: createPersonaDto.telefono,
        id_municipio: createPersonaDto.id_municipio,
        direccion_linea: createPersonaDto.direccion_linea,
        sexo: createPersonaDto.sexo,
        enfermedades: createPersonaDto.enfermedades ?? null,
        otras_enfermedades: createPersonaDto.otras_enfermedades ?? null,
        medicamentos: createPersonaDto.medicamentos ?? null,
        alergias: createPersonaDto.alergias ?? null,
        reaccion_anestesia: createPersonaDto.reaccion_anestesia ?? null,
      },
      include: {
        municipio: {
          include: {
            departamento: true,
          },
        },
      },
    });

    return persona;
  }

    async findAll(page: number = 1, limit: number = 10, filters?: { search?: string; nombre?: string; identidad?: string; telefono?: string; codigo?: string }, includeConsulta: boolean = false) {
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      const andFilters: Record<string, unknown>[] = [];
      const search = filters?.search?.trim();

      if (search) {
        const searchLower = search.toLowerCase();
        const numericSearch = search.replace(/\D/g, '');
        andFilters.push({
          OR: [
            ...(numericSearch
              ? [
                  {
                    id_persona: Number(numericSearch),
                  },
                ]
              : []),
            {
              numero_identidad: {
                contains: searchLower,
                mode: 'insensitive',
              },
            },
            {
              telefono: {
                contains: searchLower,
                mode: 'insensitive',
              },
            },
            {
              primer_nombre: {
                contains: searchLower,
                mode: 'insensitive',
              },
            },
            {
              segundo_nombre: {
                contains: searchLower,
                mode: 'insensitive',
              },
            },
            {
              primer_apellido: {
                contains: searchLower,
                mode: 'insensitive',
              },
            },
            {
              segundo_apellido: {
                contains: searchLower,
                mode: 'insensitive',
              },
            },
          ],
        });
      }

      if (filters?.nombre?.trim()) {
        const nombre = filters.nombre.trim().toLowerCase();
        andFilters.push({
          OR: [
            { primer_nombre: { contains: nombre, mode: 'insensitive' } },
            { segundo_nombre: { contains: nombre, mode: 'insensitive' } },
            { primer_apellido: { contains: nombre, mode: 'insensitive' } },
            { segundo_apellido: { contains: nombre, mode: 'insensitive' } },
          ],
        });
      }

      if (filters?.identidad?.trim()) {
        andFilters.push({
          numero_identidad: {
            contains: filters.identidad.replace(/\D/g, ''),
            mode: 'insensitive',
          },
        });
      }

      if (filters?.telefono?.trim()) {
        andFilters.push({
          telefono: {
            contains: filters.telefono.replace(/\D/g, ''),
            mode: 'insensitive',
          },
        });
      }

      if (filters?.codigo?.trim()) {
        const codigo = Number(filters.codigo.replace(/^PAC-/i, '').replace(/\D/g, ''));
        if (Number.isFinite(codigo) && codigo > 0) {
          andFilters.push({ id_persona: codigo });
        }
      }

      if (andFilters.length > 0) {
        where.AND = andFilters;
      }

      const include: any = {
        municipio: {
          include: {
            departamento: true,
          },
        },
      };

      if (includeConsulta) {
        include.tratamientosPaciente = {
          include: {
            consultas: {
              orderBy: { fecha_inicio: 'desc' },
              include: {
                doctor: { include: { persona: true } },
                pagos: { orderBy: { fecha: 'desc' } },
              },
            },
            abonos: true,
          },
          orderBy: { createdAt: 'desc' },
        };
        include.consultas = {
          orderBy: {
            fecha_inicio: 'desc', 
          },
          include : {
            doctor: {
              include: {
                persona: true,
              }
            },
            respuestas: {
              include: {
                pregunta: {
                  select: { id_pregunta: true, pregunta: true, orden_num: true },
                },
              },
              orderBy: { pregunta: { orden_num: 'asc' } },
            },
            tratamientos: {
              include: {
                tratamiento: true,
              }
            },
            archivos : true,
            pagos: {
              orderBy: { fecha: 'desc' },
            },
          } 
        };
      }

      const [personas, total] = await Promise.all([
        this.prisma.persona.findMany({
          where,
          skip,
          take: limit,
          include,
          orderBy: {
            id_persona: 'desc',
          },
        }),
        this.prisma.persona.count({ where }),
      ]);

      const mapped = personas.map((p: Record<string, any>) => {
        const { tratamientosPaciente: tpRaw, ...rest } = p;
        const tratamientos = (tpRaw ?? []).map((t: Record<string, any>) => {
          const totalAbonado = (t.abonos ?? []).reduce((sum: number, a: any) => sum + Number(a.montoAbonado || 0), 0);
          return {
            ...t,
            costoTotal: Number(t.costoTotal),
            totalAbonado,
            saldoPendiente: Number(t.costoTotal) - totalAbonado,
            consultas: t.consultas ?? [],
          };
        });
        return { ...rest, tratamientos };
      });

      return {
        data: mapped,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    }

  async findOne(id: number) {
    const persona = await this.prisma.persona.findUnique({
      where: { id_persona: id },
      include: {
        municipio: {
          include: {
            departamento: true,
          },
        },
      },
    });

    if (!persona) {
      throw new NotFoundException(`No se encontró la persona con id ${id}`);
    }

    return persona;
  }

  async update(id: number, updatePersonaDto: UpdatePersonaDto) {
    await this.findOne(id);

    const { numero_identidad, correo_electronico } = updatePersonaDto;

    if (numero_identidad) {
      const existingPersona = await this.prisma.persona.findUnique({
        where: { numero_identidad },
      });

      if (existingPersona && existingPersona.id_persona !== id) {
        throw new ConflictException(
          `Ya existe otra persona registrada con el número de identidad ${numero_identidad}`,
        );
      }
    }

    if (correo_electronico) {
      const existingPersona = await this.prisma.persona.findUnique({
        where: { correo_electronico },
      });

      if (existingPersona && existingPersona.id_persona !== id) {
        throw new ConflictException(
          `Ya existe otra persona registrada con el correo electrónico ${correo_electronico}`,
        );
      }
    }

    if (updatePersonaDto.id_municipio) {
      const municipio = await this.prisma.municipio.findUnique({
        where: { id_municipio: updatePersonaDto.id_municipio },
      });

      if (!municipio) {
        throw new BadRequestException(
          `No existe un municipio con el id ${updatePersonaDto.id_municipio}`,
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (numero_identidad) updateData.numero_identidad = numero_identidad;
    if (correo_electronico !== undefined)
      updateData.correo_electronico = correo_electronico;
    if (updatePersonaDto.primer_nombre !== undefined)
      updateData.primer_nombre = updatePersonaDto.primer_nombre;
    if (updatePersonaDto.segundo_nombre !== undefined)
      updateData.segundo_nombre = updatePersonaDto.segundo_nombre;
    if (updatePersonaDto.primer_apellido !== undefined)
      updateData.primer_apellido = updatePersonaDto.primer_apellido;
    if (updatePersonaDto.segundo_apellido !== undefined)
      updateData.segundo_apellido = updatePersonaDto.segundo_apellido;
    if (updatePersonaDto.fecha_nacimiento !== undefined)
      updateData.fecha_nacimiento = new Date(updatePersonaDto.fecha_nacimiento);
    if (updatePersonaDto.telefono !== undefined)
      updateData.telefono = updatePersonaDto.telefono;
    if (updatePersonaDto.id_municipio !== undefined)
      updateData.id_municipio = updatePersonaDto.id_municipio;
    if (updatePersonaDto.direccion_linea !== undefined)
      updateData.direccion_linea = updatePersonaDto.direccion_linea;
    if (updatePersonaDto.enfermedades !== undefined)
      updateData.enfermedades = updatePersonaDto.enfermedades;
    if (updatePersonaDto.otras_enfermedades !== undefined)
      updateData.otras_enfermedades = updatePersonaDto.otras_enfermedades;
    if (updatePersonaDto.medicamentos !== undefined)
      updateData.medicamentos = updatePersonaDto.medicamentos;
    if (updatePersonaDto.alergias !== undefined)
      updateData.alergias = updatePersonaDto.alergias;
    if (updatePersonaDto.reaccion_anestesia !== undefined)
      updateData.reaccion_anestesia = updatePersonaDto.reaccion_anestesia;
    if (updatePersonaDto.sexo !== undefined)
      updateData.sexo = updatePersonaDto.sexo;

    const updatedPersona = await this.prisma.persona.update({
      where: { id_persona: id },
      data: updateData,
      include: {
        municipio: {
          include: {
            departamento: true,
          },
        },
      },
    });

    return updatedPersona;
  }

  async remove(id: number) {
    await this.findOne(id);

    const consultasCount = await this.prisma.consulta.count({
      where: { id_persona: id },
    });

    const usuariosCount = await this.prisma.usuario.count({
      where: { id_persona: id },
    });

    if (consultasCount > 0 || usuariosCount > 0) {
      throw new ConflictException(
        'No se puede eliminar la persona porque tiene registros asociados (consultas o usuarios). Considere desactivar el usuario asociado en su lugar.',
      );
    }

    await this.prisma.persona.delete({
      where: { id_persona: id },
    });

    return { message: 'Persona eliminada exitosamente' };
  }
}
