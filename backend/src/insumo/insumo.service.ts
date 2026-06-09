import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetInsumosDto } from './dto/get-insumo.dto';

@Injectable()
export class InsumoService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetInsumosDto) {
    const { search, id_categoria, stock_status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    let whereSql = '1=1';

    if (search) {
      const searchStr = `%${search}%`;
      whereSql += ` AND (i.nombre ILIKE '${searchStr}' OR i.codigo ILIKE '${searchStr}')`;
    }

    if (id_categoria) {
      whereSql += ` AND i.id_categoria = ${id_categoria}`;
    }

    if (stock_status === 'agotado') {
      whereSql += ` AND i.stock_actual = 0`;
    } else if (stock_status === 'bajo') {
      whereSql += ` AND i.stock_actual > 0 AND i.stock_actual <= i.stock_minimo`;
    } else if (stock_status === 'normal') {
      whereSql += ` AND i.stock_actual > i.stock_minimo`;
    }

    const rawQuery = `
      SELECT 
        i.id_insumo, i.codigo, i.nombre, i.stock_actual, i.stock_minimo, i.precio_costo,
        c.nombre as categoria_nombre, u.nombre as unidad_nombre
      FROM insumo i
      INNER JOIN categoria_insumo c ON i.id_categoria = c.id_categoria
      INNER JOIN unidad_medida u ON i.id_unidad = u.id_unidad
      WHERE ${whereSql}
      ORDER BY i.nombre ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM insumo i
      WHERE ${whereSql}
    `;

    const [items, totalResult] = await Promise.all([
      this.prisma.$queryRawUnsafe<any[]>(rawQuery),
      this.prisma.$queryRawUnsafe<any[]>(countQuery),
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
    const statsQuery = `
      SELECT 
        COUNT(*) as total_productos,
        SUM(CASE WHEN stock_actual = 0 THEN 1 ELSE 0 END) as agotados,
        SUM(CASE WHEN stock_actual > 0 AND stock_actual <= stock_minimo THEN 1 ELSE 0 END) as stock_bajo,
        SUM(stock_actual * precio_costo) as valor_total
      FROM insumo
    `;

    const result = await this.prisma.$queryRawUnsafe<any[]>(statsQuery);
    
    return {
      total_productos: Number(result[0].total_productos || 0),
      agotados: Number(result[0].agotados || 0),
      stock_bajo: Number(result[0].stock_bajo || 0),
      valor_total: Number(result[0].valor_total || 0),
    };
  }
}
