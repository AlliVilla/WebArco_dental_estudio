import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovimientoDto, TipoMovimiento } from './dto/create-movimiento.dto';
import { GetMovimientosDto } from './dto/get-movimientos.dto';

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMovimientoDto: CreateMovimientoDto, userId: number) {
    const { id_insumo, tipo, cantidad, observaciones } = createMovimientoDto;

    const resultado = await this.prisma.$transaction(async (tx) => {
      const insumo = await tx.insumo.findUnique({ where: { id_insumo } });

      if (!insumo) {
        throw new NotFoundException(`El insumo con ID ${id_insumo} no existe`);
      }

      if (tipo === TipoMovimiento.Salida && cantidad > insumo.stock_actual) {
        throw new BadRequestException(
          `Stock insuficiente. El insumo tiene ${insumo.stock_actual} en stock, y se intentan sacar ${cantidad}.`
        );
      }

      const movimiento = await tx.movimientoInventario.create({
        data: {
          id_insumo,
          tipo,
          cantidad,
          observaciones,
          id_usuario: userId,
        },
      });

      const incremento = tipo === TipoMovimiento.Entrada ? cantidad : -cantidad;

      const insumoActualizado = await tx.insumo.update({
        where: { id_insumo },
        data: { stock_actual: { increment: incremento } },
      });

      return { movimiento, insumo: insumoActualizado };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return { message: 'Movimiento registrado exitosamente', ...resultado };
  }

  async findAll(query: GetMovimientosDto) {
    const { id_insumo, tipo, fecha_inicio, fecha_fin, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MovimientoInventarioWhereInput = {};

    if (id_insumo) {
      where.id_insumo = id_insumo;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (fecha_inicio || fecha_fin) {
      where.fecha = {};
      if (fecha_inicio) {
        where.fecha.gte = new Date(fecha_inicio + 'T00:00:00.000Z');
      }
      if (fecha_fin) {
        where.fecha.lte = new Date(fecha_fin + 'T23:59:59.999Z');
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.movimientoInventario.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
        include: {
          insumo: { select: { nombre: true, codigo: true } },
          usuario: {
            select: {
              username: true,
              id_usuario: true,
              persona: { select: { primer_nombre: true, primer_apellido: true } },
            },
          },
        },
      }),
      this.prisma.movimientoInventario.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
