import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@Injectable()
export class TratamientoService {
  constructor(private prisma: PrismaService) {}

  private toResponse(t: any) {
    return {
      id: t.id_tratamiento,
      especialidad: t.especialidad,
      nombre: t.nombre,
      descripcion: t.descripcion ?? '',
      impactoOdontograma: t.impacto_odontograma,
      precio: Number(t.precio),
    };
  }

  async findAll() {
    const items = await this.prisma.tratamiento.findMany({
      orderBy: { created_at: 'desc' },
    });
    return items.map((t) => this.toResponse(t));
  }

  async findOne(id: number) {
    const t = await this.prisma.tratamiento.findUnique({
      where: { id_tratamiento: id },
    });
    if (!t) throw new NotFoundException('Tratamiento no encontrado');
    return this.toResponse(t);
  }

  async create(dto: CreateTratamientoDto) {
    const t = await this.prisma.tratamiento.create({
      data: {
        especialidad: dto.especialidad,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        impacto_odontograma: dto.impactoOdontograma,
        precio: dto.precio,
      },
    });
    return this.toResponse(t);
  }

  async update(id: number, dto: UpdateTratamientoDto) {
    await this.findOne(id);
    const t = await this.prisma.tratamiento.update({
      where: { id_tratamiento: id },
      data: {
        especialidad: dto.especialidad,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        impacto_odontograma: dto.impactoOdontograma,
        precio: dto.precio,
      },
    });
    return this.toResponse(t);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.tratamiento.delete({ where: { id_tratamiento: id } });
    return null;
  }
}
