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
    const { numero_identidad, correo_electronico, ...rest } = createPersonaDto;

    // Check if numero_identidad already exists
    const existingPersonaByIdentity = await this.prisma.persona.findUnique({
      where: { numero_identidad },
    });

    if (existingPersonaByIdentity) {
      throw new ConflictException(
        `Ya existe una persona registrada con el número de identidad ${numero_identidad}`,
      );
    }

    // Check if correo_electronico already exists (if provided)
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

    // Verify that id_ciudad exists
    const municipio = await this.prisma.municipio.findUnique({
      where: { id_municipio: createPersonaDto.id_ciudad },
    });

    if (!municipio) {
      throw new BadRequestException(
        `No existe un municipio/ciudad con el id ${createPersonaDto.id_ciudad}`,
      );
    }

    // Create persona
    const persona = await this.prisma.persona.create({
      data: {
        numero_identidad,
        correo_electronico: correo_electronico || null,
        ...rest,
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

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    let where = {};

    if (search) {
      const searchLower = search.toLowerCase();
      where = {
        OR: [
          {
            numero_identidad: {
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
      };
    }

    const [personas, total] = await Promise.all([
      this.prisma.persona.findMany({
        where,
        skip,
        take: limit,
        include: {
          municipio: {
            include: {
              departamento: true,
            },
          },
        },
        orderBy: {
          id_persona: 'desc',
        },
      }),
      this.prisma.persona.count({ where }),
    ]);

    return {
      data: personas,
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
    // Verify persona exists
    await this.findOne(id);

    const { numero_identidad, correo_electronico, ...rest } = updatePersonaDto;

    // Check if numero_identidad already exists for a different persona
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

    // Check if correo_electronico already exists for a different persona
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

    // Verify that id_ciudad exists (if provided)
    if (updatePersonaDto.id_ciudad) {
      const municipio = await this.prisma.municipio.findUnique({
        where: { id_municipio: updatePersonaDto.id_ciudad },
      });

      if (!municipio) {
        throw new BadRequestException(
          `No existe un municipio/ciudad con el id ${updatePersonaDto.id_ciudad}`,
        );
      }
    }

    const updateData: Record<string, unknown> = { ...rest };
    if (numero_identidad) updateData.numero_identidad = numero_identidad;
    if (correo_electronico !== undefined)
      updateData.correo_electronico = correo_electronico;

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
    // Verify persona exists
    await this.findOne(id);

    // Perform soft delete (logical deletion)
    // First, check if the persona has related records
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

    // Hard delete only if no related records
    await this.prisma.persona.delete({
      where: { id_persona: id },
    });

    return { message: 'Persona eliminada exitosamente' };
  }
}
