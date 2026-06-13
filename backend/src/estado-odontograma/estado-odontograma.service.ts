import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEstadoDto } from './dto/create-estado.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';

@Injectable()
export class EstadoOdontogramaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.estadoOdontograma.findMany({
      orderBy: { nombre: 'asc' },
    });
    return items.map((e) => ({
      id: e.id_estado,
      nombre: e.nombre,
      color: e.color,
    }));
  }

  async create(dto: CreateEstadoDto) {
    const nombre = dto.nombre.charAt(0).toUpperCase() + dto.nombre.slice(1).toLowerCase();

    const dup = await this.prisma.estadoOdontograma.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
    });
    if (dup) throw new ConflictException('Ya existe un estado con ese nombre');

    const item = await this.prisma.estadoOdontograma.create({
      data: { nombre, color: dto.color.toUpperCase() },
    });
    return { id: item.id_estado, nombre: item.nombre, color: item.color };
  }

  async update(id: number, dto: UpdateEstadoDto) {
    const existing = await this.prisma.estadoOdontograma.findUnique({
      where: { id_estado: id },
    });
    if (!existing) throw new NotFoundException('Estado no encontrado');

    const data: any = {};
    if (dto.nombre) {
      data.nombre = dto.nombre.charAt(0).toUpperCase() + dto.nombre.slice(1).toLowerCase();
      const dup = await this.prisma.estadoOdontograma.findFirst({
        where: { nombre: { equals: data.nombre, mode: 'insensitive' }, id_estado: { not: id } },
      });
      if (dup) throw new ConflictException('Ya existe un estado con ese nombre');
    }
    if (dto.color) data.color = dto.color.toUpperCase();

    const item = await this.prisma.estadoOdontograma.update({
      where: { id_estado: id },
      data,
    });
    return { id: item.id_estado, nombre: item.nombre, color: item.color };
  }

  async remove(id: number) {
    const existing = await this.prisma.estadoOdontograma.findUnique({
      where: { id_estado: id },
    });
    if (!existing) throw new NotFoundException('Estado no encontrado');

    const count = await this.prisma.odontograma.count({
      where: { estado: existing.nombre },
    });
    if (count > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${count} registro(s) de odontograma usan este estado`,
      );
    }

    await this.prisma.estadoOdontograma.delete({
      where: { id_estado: id },
    });
    return null;
  }
}
