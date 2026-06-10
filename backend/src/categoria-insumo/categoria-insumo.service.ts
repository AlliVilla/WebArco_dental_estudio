import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaInsumoDto } from './dto/create-categoria-insumo.dto';
import { UpdateCategoriaInsumoDto } from './dto/update-categoria-insumo.dto';

@Injectable()
export class CategoriaInsumoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCategoriaInsumoDto) {
    try {
      const categoria = await this.prisma.categoriaInsumo.create({
        data: { nombre: createDto.nombre },
      });
      return { message: 'Categoría creada exitosamente', categoria };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Ya existe una categoría con el nombre "${createDto.nombre}"`);
      }
      throw error;
    }
  }

  async findAll() {
    const items = await this.prisma.categoriaInsumo.findMany({
      orderBy: { nombre: 'asc' },
      include: { _count: { select: { insumos: true } } },
    });
    return { items };
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoriaInsumo.findUnique({
      where: { id_categoria: id },
      include: { _count: { select: { insumos: true } } },
    });
    if (!categoria) {
      throw new NotFoundException(`La categoría con ID ${id} no existe`);
    }
    return { categoria };
  }

  async update(id: number, updateDto: UpdateCategoriaInsumoDto) {
    const categoria = await this.prisma.categoriaInsumo.findUnique({ where: { id_categoria: id } });
    if (!categoria) {
      throw new NotFoundException(`La categoría con ID ${id} no existe`);
    }
    try {
      const updated = await this.prisma.categoriaInsumo.update({
        where: { id_categoria: id },
        data: updateDto,
      });
      return { message: 'Categoría actualizada exitosamente', categoria: updated };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Ya existe una categoría con el nombre "${updateDto.nombre}"`);
      }
      throw error;
    }
  }

  async remove(id: number) {
    const categoria = await this.prisma.categoriaInsumo.findUnique({ where: { id_categoria: id } });
    if (!categoria) {
      throw new NotFoundException(`La categoría con ID ${id} no existe`);
    }
    const count = await this.prisma.insumo.count({ where: { id_categoria: id, activo: true } });
    if (count > 0) {
      throw new ConflictException(`No se puede eliminar la categoría porque tiene ${count} insumo(s) asociado(s)`);
    }
    await this.prisma.categoriaInsumo.delete({ where: { id_categoria: id } });
    return { message: 'Categoría eliminada exitosamente' };
  }
}
