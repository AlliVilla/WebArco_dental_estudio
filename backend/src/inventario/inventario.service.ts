import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TipoMovimiento } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { GetMovementHistoryDto } from './dto/get-movement-history.dto';

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    categoria?: string;
    estado?: string;
    estadoRegistro?: string;
  }) {
    const where: Prisma.InsumoWhereInput = {};

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
      where.categoria = {
        nombre: params.categoria,
      };
    }

    const insumos = await this.prisma.insumo.findMany({
      where,
      include: {
        categoria: true,
        unidad: true,
      },
      orderBy: { id_insumo: 'asc' },
    });

    const filtered = params.estado
      ? insumos.filter(
          (insumo) =>
            this.getEstado(insumo.stock_actual, insumo.stock_minimo) ===
            params.estado,
        )
      : insumos;

    const stats = await this.getStats();

    return {
      data: filtered.map((insumo) => this.mapInsumo(insumo)),
      stats,
    };
  }

  async create(dto: CreateInsumoDto) {
    const codigo = await this.nextCodigo();

    const categoria = await this.findOrCreateCategoria(dto.categoria);
    const unidad = await this.findOrCreateUnidad(dto.unidad_medida);

    const insumo = await this.prisma.insumo.create({
      data: {
        codigo,
        nombre: dto.nombre.trim(),
        id_categoria: categoria.id_categoria,
        id_unidad: unidad.id_unidad,
        stock_actual: dto.stock_actual,
        stock_minimo: dto.stock_minimo,
        precio_costo: new Prisma.Decimal(dto.precio_costo),
        activo: true,
      },
      include: {
        categoria: true,
        unidad: true,
      },
    });

    return this.mapInsumo(insumo);
  }

  async update(id: number, dto: UpdateInsumoDto) {
    await this.assertInsumoExists(id, { includeInactive: true });

    const data: Prisma.InsumoUpdateInput = {};

    if (dto.nombre !== undefined) {
      data.nombre = dto.nombre.trim();
    }

    if (dto.categoria !== undefined) {
      const categoria = await this.findOrCreateCategoria(dto.categoria);
      data.categoria = {
        connect: { id_categoria: categoria.id_categoria },
      };
    }

    if (dto.unidad_medida !== undefined) {
      const unidad = await this.findOrCreateUnidad(dto.unidad_medida);
      data.unidad = {
        connect: { id_unidad: unidad.id_unidad },
      };
    }


    if (dto.stock_minimo !== undefined) {
      data.stock_minimo = dto.stock_minimo;
    }

    if (dto.precio_costo !== undefined) {
      data.precio_costo = new Prisma.Decimal(dto.precio_costo);
    }

    const insumo = await this.prisma.insumo.update({
      where: { id_insumo: id },
      data,
      include: {
        categoria: true,
        unidad: true,
      },
    });

    return this.mapInsumo(insumo);
  }

  async delete(id: number) {
    await this.assertInsumoExists(id, { includeInactive: true });

    const insumo = await this.prisma.insumo.update({
      where: { id_insumo: id },
      data: { activo: false },
    });

    return {
      id_insumo: insumo.id_insumo,
      message: 'Insumo eliminado correctamente',
    };
  }

  async restore(id: number) {
    await this.assertInsumoExists(id, { includeInactive: true });

    const insumo = await this.prisma.insumo.update({
      where: { id_insumo: id },
      data: { activo: true },
      include: {
        categoria: true,
        unidad: true,
      },
    });

    return {
      ...this.mapInsumo(insumo),
      message: 'Insumo readmitido correctamente',
    };
  }

  async createMovimiento(dto: CreateMovimientoDto) {
    const userId = dto.id_usuario ?? 1;

    const insumo = await this.assertInsumoExists(dto.id_insumo);

    if (dto.tipo === TipoMovimiento.Salida && dto.cantidad > insumo.stock_actual) {
      throw new BadRequestException(
        'No hay stock suficiente para registrar la salida',
      );
    }

    const delta =
      dto.tipo === TipoMovimiento.Entrada ? dto.cantidad : -dto.cantidad;

    const fecha = dto.fecha ? new Date(dto.fecha) : new Date();

    const movimiento = await this.prisma.$transaction(async (tx) => {
      let observacionesMovimiento = dto.observaciones?.trim() || null;

      if (dto.tipo === TipoMovimiento.Salida) {
        const conceptoEgreso = `Salida de inventario: ${insumo.nombre}`;
        const costo = Number(insumo.precio_costo) * dto.cantidad;
        
        const egreso = await tx.egreso.create({
          data: {
            concepto: conceptoEgreso,
            monto: new Prisma.Decimal(costo),
            categoria: 'Insumos',
            fecha,
            observaciones: dto.observaciones?.trim() || 'Generado automáticamente desde el módulo de inventario',
            id_usuario_creacion: userId,
          },
        });

        observacionesMovimiento = `Restado por egreso: ${conceptoEgreso} (Egreso #${egreso.id_egreso})`;
      }

      const created = await tx.movimientoInventario.create({
        data: {
          id_insumo: dto.id_insumo,
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          fecha,
          id_usuario: userId,
          observaciones: observacionesMovimiento,
        },
        include: {
          insumo: true,
          usuario: {
            include: {
              persona: true,
            },
          },
        },
      });

      await tx.insumo.update({
        where: { id_insumo: dto.id_insumo },
        data: {
          stock_actual: {
            increment: delta,
          },
        },
      });

      return created;
    });

    return this.mapMovimiento(movimiento);
  }

  async getMovimientos(params?: {
    id_insumo?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }) {
    const where: Prisma.MovimientoInventarioWhereInput = {};

    if (params?.id_insumo) {
      where.id_insumo = Number(params.id_insumo);
    }

    if (params?.tipo) {
      where.tipo = params.tipo as TipoMovimiento;
    }

    if (params?.fechaInicio || params?.fechaFin) {
      where.fecha = {};

      if (params.fechaInicio) {
        where.fecha.gte = new Date(`${params.fechaInicio}T00:00:00.000Z`);
      }

      if (params.fechaFin) {
        where.fecha.lte = new Date(`${params.fechaFin}T23:59:59.999Z`);
      }
    }

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where,
      include: {
        insumo: true,
        usuario: {
          include: {
            persona: true,
          },
        },
      },
      orderBy: [{ fecha: 'desc' }, { id_movimiento: 'desc' }],
      take: 100,
    });

    return movimientos.map((movimiento) => this.mapMovimiento(movimiento));
  }

  async getMovementHistory(query: GetMovementHistoryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Prisma.MovimientoInventarioWhereInput = {};

    if (query.id_insumo) {
      where.id_insumo = Number(query.id_insumo);
    }

    if (query.tipo) {
      where.tipo = query.tipo as TipoMovimiento;
    }

    if (query.search) {
      where.insumo = {
        OR: [
          { nombre: { contains: query.search, mode: 'insensitive' } },
          { codigo: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    if (query.fechaInicio || query.fechaFin) {
      where.fecha = {};

      if (query.fechaInicio) {
        where.fecha.gte = new Date(`${query.fechaInicio}T00:00:00.000Z`);
      }

      if (query.fechaFin) {
        where.fecha.lte = new Date(`${query.fechaFin}T23:59:59.999Z`);
      }
    }

    const [movimientos, total, resumen] = await Promise.all([
      this.prisma.movimientoInventario.findMany({
        where,
        skip,
        take: limit,
        include: {
          insumo: true,
          usuario: {
            include: {
              persona: true,
            },
          },
        },
        orderBy: [{ fecha: 'desc' }, { id_movimiento: 'desc' }],
      }),
      this.prisma.movimientoInventario.count({ where }),
      this.prisma.movimientoInventario.findMany({
        where,
        select: {
          tipo: true,
          cantidad: true,
        },
      }),
    ]);

    const totalEntradas = resumen
      .filter((item) => item.tipo === TipoMovimiento.Entrada)
      .reduce((sum, item) => sum + item.cantidad, 0);

    const totalSalidas = resumen
      .filter((item) => item.tipo === TipoMovimiento.Salida)
      .reduce((sum, item) => sum + item.cantidad, 0);

    return {
      data: movimientos.map((movimiento) => this.mapMovimiento(movimiento)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        total_movimientos: total,
        total_entradas: totalEntradas,
        total_salidas: totalSalidas,
        balance_unidades: totalEntradas - totalSalidas,
      },
    };
  }

  async getStats() {
    const insumos = await this.prisma.insumo.findMany({
      where: { activo: true },
    });

    return {
      total_productos: insumos.length,
      stock_bajo: insumos.filter(
        (item) =>
          item.stock_actual > 0 && item.stock_actual <= item.stock_minimo,
      ).length,
      agotados: insumos.filter((item) => item.stock_actual === 0).length,
      valor_total: insumos.reduce(
        (total, item) =>
          total + item.stock_actual * Number(item.precio_costo),
        0,
      ),
    };
  }

  private async nextCodigo() {
    const last = await this.prisma.insumo.findFirst({
      orderBy: { id_insumo: 'desc' },
    });

    const next = (last?.id_insumo ?? 0) + 1;
    return `INS-${String(next).padStart(3, '0')}`;
  }

  private async assertInsumoExists(
    id: number,
    options: { includeInactive?: boolean } = {},
  ) {
    const where: Prisma.InsumoWhereInput = {
      id_insumo: id,
    };

    if (!options.includeInactive) {
      where.activo = true;
    }

    const insumo = await this.prisma.insumo.findFirst({
      where,
    });

    if (!insumo) {
      throw new NotFoundException('Insumo no encontrado');
    }

    return insumo;
  }

  private async findOrCreateCategoria(nombre: string) {
    return this.prisma.categoriaInsumo.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  private async findOrCreateUnidad(nombre: string) {
    return this.prisma.unidadMedida.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    });
  }

  private getEstado(stockActual: number, stockMinimo: number) {
    if (stockActual === 0) return 'Agotado';
    if (stockActual <= stockMinimo) return 'Stock bajo';
    return 'Normal';
  }

  private mapInsumo(
    insumo: Prisma.InsumoGetPayload<{
      include: {
        categoria: true;
        unidad: true;
      };
    }>,
  ) {
    return {
      id_insumo: insumo.id_insumo,
      codigo: insumo.codigo,
      nombre: insumo.nombre,
      categoria: insumo.categoria.nombre,
      unidad_medida: insumo.unidad.nombre,
      stock_actual: insumo.stock_actual,
      stock_minimo: insumo.stock_minimo,
      precio_costo: Number(insumo.precio_costo),
      activo: insumo.activo,
      created_at: insumo.created_at,
      updated_at: insumo.updated_at,
      estado: this.getEstado(insumo.stock_actual, insumo.stock_minimo),
      estado_registro: insumo.activo ? 'Activo' : 'Inactivo',
    };
  }

  private mapMovimiento(
    movimiento: Prisma.MovimientoInventarioGetPayload<{
      include: {
        insumo: true;
        usuario: {
          include: {
            persona: true;
          };
        };
      };
    }>,
  ) {
    const persona = movimiento.usuario?.persona;
    const responsable = persona
      ? `${persona.primer_nombre} ${persona.primer_apellido}`
      : movimiento.usuario?.username ?? 'Usuario';

    return {
      id_movimiento: movimiento.id_movimiento,
      id_insumo: movimiento.id_insumo,
      producto: movimiento.insumo.nombre,
      codigo: movimiento.insumo.codigo,
      tipo: movimiento.tipo,
      cantidad: movimiento.cantidad,
      fecha: movimiento.fecha.toISOString(),
      id_usuario: movimiento.id_usuario,
      responsable,
      observaciones: movimiento.observaciones,
    };
  }
}