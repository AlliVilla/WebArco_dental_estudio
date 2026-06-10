import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnidadMedidaDto } from './dto/create-unidad-medida.dto';
import { UpdateUnidadMedidaDto } from './dto/update-unidad-medida.dto';

@Injectable()
export class UnidadMedidaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateUnidadMedidaDto) {
    try {
      const unidad = await this.prisma.unidadMedida.create({
        data: { nombre: createDto.nombre },
      });
      return { message: 'Unidad de medida creada exitosamente', unidad };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Ya existe una unidad de medida con el nombre "${createDto.nombre}"`);
      }
      throw error;
    }
  }

  async findAll() {
    const items = await this.prisma.unidadMedida.findMany({
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { insumos: true } } },
    });
    return { items };
  }

  async findOne(id: number) {
    const unidad = await this.prisma.unidadMedida.findUnique({
      where: { id_unidad: id },
      include: { _count: { select: { insumos: true } } },
    });
    if (!unidad) {
      throw new NotFoundException(`La unidad de medida con ID ${id} no existe`);
    }
    return { unidad };
  }

  async update(id: number, updateDto: UpdateUnidadMedidaDto) {
    const unidad = await this.prisma.unidadMedida.findUnique({ where: { id_unidad: id } });
    if (!unidad) {
      throw new NotFoundException(`La unidad de medida con ID ${id} no existe`);
    }
    try {
      const updated = await this.prisma.unidadMedida.update({
        where: { id_unidad: id },
        data: updateDto,
      });
      return { message: 'Unidad de medida actualizada exitosamente', unidad: updated };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Ya existe una unidad de medida con el nombre "${updateDto.nombre}"`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    const unidad = await this.prisma.unidadMedida.findUnique({ where: { id_unidad: id } });
    if (!unidad) {
      throw new NotFoundException(`La unidad de medida con ID ${id} no existe`);
    }
    const count = await this.prisma.insumo.count({ where: { id_unidad: id, activo: true } });
    if (count > 0) {
      throw new ConflictException(`No se puede eliminar la unidad porque tiene ${count} insumo(s) asociado(s)`);
    }
    await this.prisma.unidadMedida.delete({ where: { id_unidad: id } });
    return { message: 'Unidad de medida eliminada exitosamente' };
  }
}
