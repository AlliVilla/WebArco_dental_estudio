import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';
import { UpdateEspecialidadDto } from './dto/update-especialidad.dto';

@Injectable()
export class EspecialidadService {
  constructor(private prisma: PrismaService) {}

  private stripAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private normalizeName(nombre: string): string {
    return nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
  }

  async findAll() {
    const items = await this.prisma.especialidad.findMany({
      orderBy: { nombre: 'asc' },
    });
    return items.map((e) => ({
      id: e.id_especialidad,
      nombre: e.nombre,
    }));
  }

  async create(dto: CreateEspecialidadDto) {
    const nombre = this.normalizeName(dto.nombre);
    const plain = this.stripAccents(nombre).toLowerCase();

    const all = await this.prisma.especialidad.findMany();
    const match = all.find(
      (e) => this.stripAccents(e.nombre).toLowerCase() === plain,
    );
    if (match) {
      return { id: match.id_especialidad, nombre: match.nombre };
    }

    const item = await this.prisma.especialidad.create({
      data: { nombre },
    });
    return { id: item.id_especialidad, nombre: item.nombre };
  }

  async update(id: number, dto: UpdateEspecialidadDto) {
    const existing = await this.prisma.especialidad.findUnique({
      where: { id_especialidad: id },
    });
    if (!existing) throw new NotFoundException('Especialidad no encontrada');

    if (!dto.nombre) {
      return { id: existing.id_especialidad, nombre: existing.nombre };
    }

    const nombre = this.normalizeName(dto.nombre);
    const plain = this.stripAccents(nombre).toLowerCase();

    const all = await this.prisma.especialidad.findMany({
      where: { id_especialidad: { not: id } },
    });
    const dup = all.find(
      (e) => this.stripAccents(e.nombre).toLowerCase() === plain,
    );
    if (dup) throw new ConflictException('Ya existe una especialidad con ese nombre');

    const item = await this.prisma.especialidad.update({
      where: { id_especialidad: id },
      data: { nombre },
    });
    return { id: item.id_especialidad, nombre: item.nombre };
  }

  async remove(id: number) {
    const existing = await this.prisma.especialidad.findUnique({
      where: { id_especialidad: id },
    });
    if (!existing) throw new NotFoundException('Especialidad no encontrada');

    const count = await this.prisma.tratamiento.count({
      where: { id_especialidad: id },
    });
    if (count > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${count} tratamiento(s) usan esta especialidad`,
      );
    }

    await this.prisma.especialidad.delete({
      where: { id_especialidad: id },
    });
    return null;
  }
}
