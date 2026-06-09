import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetInsumosDto } from './dto/get-insumo.dto';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';

@Injectable()
export class InsumoService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetInsumosDto) {
    const { search, id_categoria, stock_status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const searchFilter = search
      ? Prisma.sql`AND (i.nombre ILIKE ${'%' + search + '%'} OR i.codigo ILIKE ${'%' + search + '%'})`
      : Prisma.empty;

    const categoriaFilter = id_categoria
      ? Prisma.sql`AND i.id_categoria = ${id_categoria}`
      : Prisma.empty;

    const stockFilter =
      stock_status === 'agotado'
        ? Prisma.sql`AND i.stock_actual = 0`
        : stock_status === 'bajo'
          ? Prisma.sql`AND i.stock_actual > 0 AND i.stock_actual <= i.stock_minimo`
          : stock_status === 'normal'
            ? Prisma.sql`AND i.stock_actual > i.stock_minimo`
            : Prisma.empty;

    const [items, totalResult] = await Promise.all([
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          i.id_insumo, i.codigo, i.nombre, i.stock_actual, i.stock_minimo, i.precio_costo,
          c.nombre as categoria_nombre, u.nombre as unidad_nombre
        FROM insumo i
        INNER JOIN categoria_insumo c ON i.id_categoria = c.id_categoria
        INNER JOIN unidad_medida u ON i.id_unidad = u.id_unidad
        WHERE i.activo = true
        ${searchFilter}
        ${categoriaFilter}
        ${stockFilter}
        ORDER BY i.nombre ASC
        LIMIT ${limit} OFFSET ${skip}
      `),
      this.prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT COUNT(*)::int as total
        FROM insumo i
        WHERE i.activo = true
        ${searchFilter}
        ${categoriaFilter}
        ${stockFilter}
      `),
    ]);

    const total = totalResult[0].total;

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const result = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        COUNT(*) as total_productos,
        SUM(CASE WHEN stock_actual = 0 THEN 1 ELSE 0 END) as agotados,
        SUM(CASE WHEN stock_actual > 0 AND stock_actual <= stock_minimo THEN 1 ELSE 0 END) as stock_bajo,
        SUM(stock_actual * precio_costo) as valor_total
      FROM insumo
      WHERE activo = true
    `);

    return {
      total_productos: Number(result[0].total_productos || 0),
      agotados: Number(result[0].agotados || 0),
      stock_bajo: Number(result[0].stock_bajo || 0),
      valor_total: Number(result[0].valor_total || 0),
    };
  }

  async create(createInsumoDto: CreateInsumoDto) {
    const { id_categoria, id_unidad, nombre, stock_actual, stock_minimo, precio_costo } = createInsumoDto;

    const categoria = await this.prisma.categoriaInsumo.findUnique({ where: { id_categoria } });
    if (!categoria) {
      throw new NotFoundException(`La categoría con ID ${id_categoria} no existe`);
    }

    const unidad = await this.prisma.unidadMedida.findUnique({ where: { id_unidad } });
    if (!unidad) {
      throw new NotFoundException(`La unidad de medida con ID ${id_unidad} no existe`);
    }

    const lastInsumo = await this.prisma.insumo.findFirst({
      orderBy: { id_insumo: 'desc' },
    });

    let newCodeNumber = 1;
    if (lastInsumo && lastInsumo.codigo.startsWith('INS-')) {
      const parts = lastInsumo.codigo.split('-');
      if (parts.length === 2 && !isNaN(Number(parts[1]))) {
        newCodeNumber = parseInt(parts[1], 10) + 1;
      } else {
        newCodeNumber = lastInsumo.id_insumo + 1;
      }
    } else if (lastInsumo) {
       newCodeNumber = lastInsumo.id_insumo + 1;
    }
    
    const newCode = `INS-${newCodeNumber.toString().padStart(3, '0')}`;

    const newInsumo = await this.prisma.insumo.create({
      data: {
        codigo: newCode,
        nombre,
        id_categoria,
        id_unidad,
        stock_actual: stock_actual || 0,
        stock_minimo: stock_minimo || 0,
        precio_costo,
      },
    });

    return { message: 'Insumo creado exitosamente', insumo: newInsumo };
  }

  async update(id: number, updateInsumoDto: UpdateInsumoDto) {
    const insumo = await this.prisma.insumo.findUnique({ where: { id_insumo: id } });
    if (!insumo) {
      throw new NotFoundException(`El insumo con ID ${id} no existe`);
    }

    if (updateInsumoDto.id_categoria) {
      const categoria = await this.prisma.categoriaInsumo.findUnique({ where: { id_categoria: updateInsumoDto.id_categoria } });
      if (!categoria) throw new NotFoundException(`La categoría con ID ${updateInsumoDto.id_categoria} no existe`);
    }
    if (updateInsumoDto.id_unidad) {
      const unidad = await this.prisma.unidadMedida.findUnique({ where: { id_unidad: updateInsumoDto.id_unidad } });
      if (!unidad) throw new NotFoundException(`La unidad con ID ${updateInsumoDto.id_unidad} no existe`);
    }

    const updatedInsumo = await this.prisma.insumo.update({
      where: { id_insumo: id },
      data: updateInsumoDto,
    });

    return { message: 'Insumo actualizado exitosamente', insumo: updatedInsumo };
  }

  async remove(id: number) {
    const insumo = await this.prisma.insumo.findUnique({ where: { id_insumo: id } });

    if (!insumo || !insumo.activo) {
      throw new NotFoundException(`El insumo con ID ${id} no existe`);
    }

    await this.prisma.insumo.update({
      where: { id_insumo: id },
      data: { activo: false },
    });

    return { message: 'Insumo eliminado exitosamente' };
  }
}
