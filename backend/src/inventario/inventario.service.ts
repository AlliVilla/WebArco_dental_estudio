<<<<<<< HEAD
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoMovimientoInventario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { search?: string; categoria?: string; estado?: string; estadoRegistro?: string }) {
    const where: Prisma.InsumoInventarioWhereInput = {};

    if (params.estadoRegistro === 'activo') {
      where.activo = true;
    } else if (params.estadoRegistro === 'inactivo') {
      where.activo = false;
    }

    if (params.search) {
      where.OR = [
        { nombre: { contains: params.search, mode: 'insensitive' } },
        { codigo: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.categoria) {
      where.categoria = params.categoria as Prisma.EnumCategoriaInsumoFilter;
    }

    const insumos = await this.prisma.insumoInventario.findMany({
      where,
      orderBy: { id_insumo: 'asc' },
    });

    const filtered = params.estado
      ? insumos.filter((insumo) => this.getEstado(insumo.stock_actual, insumo.stock_minimo) === params.estado)
      : insumos;

    const stats = await this.getStats();

    return {
      data: filtered.map((insumo) => ({
        ...insumo,
        precio_costo: Number(insumo.precio_costo),
        estado: this.getEstado(insumo.stock_actual, insumo.stock_minimo),
        estado_registro: insumo.activo ? 'Activo' : 'Inactivo',
      })),
      stats,
    };
  }

  async create(dto: CreateInsumoDto) {
    const codigo = await this.nextCodigo();

    const insumo = await this.prisma.insumoInventario.create({
      data: {
        codigo,
        nombre: dto.nombre.trim(),
        categoria: dto.categoria,
        unidad_medida: dto.unidad_medida,
        stock_actual: dto.stock_actual,
        stock_minimo: dto.stock_minimo,
        precio_costo: new Prisma.Decimal(dto.precio_costo),
      },
    });

    return { ...insumo, precio_costo: Number(insumo.precio_costo), estado: this.getEstado(insumo.stock_actual, insumo.stock_minimo), estado_registro: insumo.activo ? 'Activo' : 'Inactivo' };
  }

  async update(id: number, dto: UpdateInsumoDto) {
    await this.assertInsumoExists(id, { includeInactive: true });

    const data: Prisma.InsumoInventarioUpdateInput = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre.trim();
    if (dto.categoria !== undefined) data.categoria = dto.categoria;
    if (dto.unidad_medida !== undefined) data.unidad_medida = dto.unidad_medida;
    if (dto.stock_actual !== undefined) data.stock_actual = dto.stock_actual;
    if (dto.stock_minimo !== undefined) data.stock_minimo = dto.stock_minimo;
    if (dto.precio_costo !== undefined) data.precio_costo = new Prisma.Decimal(dto.precio_costo);

    const insumo = await this.prisma.insumoInventario.update({ where: { id_insumo: id }, data });
    return { ...insumo, precio_costo: Number(insumo.precio_costo), estado: this.getEstado(insumo.stock_actual, insumo.stock_minimo), estado_registro: insumo.activo ? 'Activo' : 'Inactivo' };
  }

  async delete(id: number) {
    await this.assertInsumoExists(id, { includeInactive: true });
    const insumo = await this.prisma.insumoInventario.update({ where: { id_insumo: id }, data: { activo: false } });
    return { id_insumo: insumo.id_insumo, message: 'Insumo eliminado correctamente' };
  }

  async restore(id: number) {
    await this.assertInsumoExists(id, { includeInactive: true });
    const insumo = await this.prisma.insumoInventario.update({ where: { id_insumo: id }, data: { activo: true } });
    return {
      ...insumo,
      precio_costo: Number(insumo.precio_costo),
      estado: this.getEstado(insumo.stock_actual, insumo.stock_minimo),
      estado_registro: insumo.activo ? 'Activo' : 'Inactivo',
      message: 'Insumo readmitido correctamente',
    };
  }

  async createMovimiento(dto: CreateMovimientoDto) {
    const insumo = await this.assertInsumoExists(dto.id_insumo);

    if (dto.tipo === TipoMovimientoInventario.Salida && dto.cantidad > insumo.stock_actual) {
      throw new BadRequestException('No hay stock suficiente para registrar la salida');
    }

    const delta = dto.tipo === TipoMovimientoInventario.Entrada ? dto.cantidad : -dto.cantidad;

    const [movimiento] = await this.prisma.$transaction([
      this.prisma.movimientoInventario.create({
        data: {
          id_insumo: dto.id_insumo,
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          fecha: new Date(dto.fecha),
          responsable: dto.responsable.trim(),
          observaciones: dto.observaciones?.trim() || null,
        },
        include: { insumo: true },
      }),
      this.prisma.insumoInventario.update({
        where: { id_insumo: dto.id_insumo },
        data: { stock_actual: { increment: delta } },
      }),
    ]);

    return this.mapMovimiento(movimiento);
  }

  async getMovimientos() {
    const movimientos = await this.prisma.movimientoInventario.findMany({
      include: { insumo: true },
      orderBy: [{ fecha: 'desc' }, { id_movimiento: 'desc' }],
      take: 100,
    });

    return movimientos.map((movimiento) => this.mapMovimiento(movimiento));
  }

  async getStats() {
    const insumos = await this.prisma.insumoInventario.findMany({ where: { activo: true } });
    return {
      total_productos: insumos.length,
      stock_bajo: insumos.filter((item) => item.stock_actual > 0 && item.stock_actual <= item.stock_minimo).length,
      agotados: insumos.filter((item) => item.stock_actual === 0).length,
      valor_total: insumos.reduce((total, item) => total + item.stock_actual * Number(item.precio_costo), 0),
    };
  }

  private async nextCodigo() {
    const last = await this.prisma.insumoInventario.findFirst({ orderBy: { id_insumo: 'desc' } });
    const next = (last?.id_insumo ?? 0) + 1;
    return `INS-${String(next).padStart(3, '0')}`;
  }

  private async assertInsumoExists(id: number, options: { includeInactive?: boolean } = {}) {
    const where: Prisma.InsumoInventarioWhereInput = { id_insumo: id };
    if (!options.includeInactive) where.activo = true;

    const insumo = await this.prisma.insumoInventario.findFirst({ where });
    if (!insumo) throw new NotFoundException('Insumo no encontrado');
    return insumo;
  }

  private getEstado(stockActual: number, stockMinimo: number) {
    if (stockActual === 0) return 'Agotado';
    if (stockActual <= stockMinimo) return 'Stock bajo';
    return 'Normal';
  }

  private mapMovimiento(movimiento: Prisma.MovimientoInventarioGetPayload<{ include: { insumo: true } }>) {
    return {
      id_movimiento: movimiento.id_movimiento,
      id_insumo: movimiento.id_insumo,
      producto: movimiento.insumo.nombre,
      codigo: movimiento.insumo.codigo,
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
      fecha: movimiento.fecha.toISOString(),
      responsable: movimiento.responsable,
      observaciones: movimiento.observaciones,
    };
=======
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
>>>>>>> main
  }
}
