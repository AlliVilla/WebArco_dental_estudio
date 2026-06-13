import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@Injectable()
export class TratamientoService {
  constructor(private prisma: PrismaService) {}

  private toResponse(t: any) {
    return {
      id: t.id_tratamiento,
      idEspecialidad: t.id_especialidad,
      especialidad: t.especialidad?.nombre ?? '',
      nombre: t.nombre,
      descripcion: t.descripcion ?? '',
      impactoOdontograma: t.impacto_odontograma,
      precio: Number(t.precio),
      activo: t.activo,
    };
  }

  async findAll(nombre?: string, especialidad?: string, activo?: string) {
    const where: any = {};

    if (nombre) {
      where.nombre = { contains: nombre, mode: 'insensitive' };
    }

    if (especialidad) {
      where.especialidad = { nombre: { contains: especialidad, mode: 'insensitive' } };
    }

    if (activo === 'true') {
      where.activo = true;
    } else if (activo === 'false') {
      where.activo = false;
    }

    const items = await this.prisma.tratamiento.findMany({
      where,
      include: { especialidad: true },
      orderBy: { created_at: 'desc' },
    });
    return items.map((t) => this.toResponse(t));
  }

  async findOne(id: number) {
    const t = await this.prisma.tratamiento.findUnique({
      where: { id_tratamiento: id },
      include: { especialidad: true },
    });
    if (!t) throw new NotFoundException('Tratamiento no encontrado');
    return this.toResponse(t);
  }

  async create(dto: CreateTratamientoDto) {
    const t = await this.prisma.tratamiento.create({
      data: {
        id_especialidad: dto.idEspecialidad,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        impacto_odontograma: dto.impactoOdontograma,
        precio: dto.precio,
      },
      include: { especialidad: true },
    });
    return this.toResponse(t);
  }

  async update(id: number, dto: UpdateTratamientoDto) {
    await this.findOne(id);
    const t = await this.prisma.tratamiento.update({
      where: { id_tratamiento: id },
      data: {
        id_especialidad: dto.idEspecialidad,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        impacto_odontograma: dto.impactoOdontograma,
        precio: dto.precio,
      },
      include: { especialidad: true },
    });
    return this.toResponse(t);
  }

  async toggleActivo(id: number) {
    const t = await this.prisma.tratamiento.findUnique({
      where: { id_tratamiento: id },
    });
    if (!t) throw new NotFoundException('Tratamiento no encontrado');

    const updated = await this.prisma.tratamiento.update({
      where: { id_tratamiento: id },
      data: { activo: !t.activo },
      include: { especialidad: true },
    });
    return this.toResponse(updated);
  }

  async remove(id: number) {
    await this.findOne(id);

    const count = await this.prisma.consulta_Tratamiento.count({
      where: { id_tratamiento: id },
    });
    if (count > 0) {
      throw new ConflictException(
        `No se puede eliminar: el tratamiento está asignado a ${count} consulta(s). Elimine primero las consultas asociadas.`,
      );
    }

    await this.prisma.tratamiento.delete({ where: { id_tratamiento: id } });
    return null;
  }
}
