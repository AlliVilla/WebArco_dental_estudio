import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriaEgreso, CreateEgresoDto } from './dto/create-egreso.dto';

type UsuarioAuditoria = {
  id_usuario: number;
  username: string;
  persona?: {
    primer_nombre: string;
    segundo_nombre?: string | null;
    primer_apellido: string;
    segundo_apellido?: string | null;
  } | null;
};

type EgresoEntity = {
  id_egreso: number;
  concepto: string;
  monto: Prisma.Decimal;
  categoria: string;
  fecha: Date;
  observaciones?: string | null;
  usuario_creacion: UsuarioAuditoria;
  usuario_modificacion?: UsuarioAuditoria | null;
};

export interface EgresoFinancialRecord {
  id_registro: string;
  tipo: 'egreso';
  fecha: string;
  concepto: string;
  monto: number;
  categoria: CategoriaEgreso;
  observaciones: string | null;
  responsable: string;
  creado_por: {
    id_usuario: number;
    username: string;
    nombre_completo: string;
  };
  modificado_por: {
    id_usuario: number;
    username: string;
    nombre_completo: string;
  } | null;
}

@Injectable()
export class EgresoService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly usuarioInclude = {
    select: {
      id_usuario: true,
      username: true,
      persona: {
        select: {
          primer_nombre: true,
          segundo_nombre: true,
          primer_apellido: true,
          segundo_apellido: true,
        },
      },
    },
  } as const;

  async create(dto: CreateEgresoDto, idUsuarioCreacion: number) {
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Validate stock if category is Insumos and insumos array is provided
      if (dto.categoria === CategoriaEgreso.Insumos && dto.insumos && dto.insumos.length > 0) {
        for (const item of dto.insumos) {
          const insumo = await tx.insumo.findFirst({
            where: { id_insumo: item.id_insumo, activo: true },
          });
          if (!insumo) {
            throw new NotFoundException(`Insumo con ID ${item.id_insumo} no encontrado`);
          }
          if (insumo.stock_actual < item.cantidad) {
            throw new BadRequestException(
              `No hay stock suficiente para el insumo "${insumo.nombre}". Stock disponible: ${insumo.stock_actual}, solicitado: ${item.cantidad}`,
            );
          }
        }
      }

      // 2. Create the egreso
      const egreso = await tx.egreso.create({
        data: {
          concepto: dto.concepto.trim(),
          monto: new Prisma.Decimal(dto.monto),
          categoria: dto.categoria,
          fecha: new Date(`${dto.fecha}T00:00:00.000Z`),
          observaciones: dto.observaciones?.trim() || null,
          id_usuario_creacion: idUsuarioCreacion,
        },
        include: {
          usuario_creacion: this.usuarioInclude,
          usuario_modificacion: this.usuarioInclude,
        },
      });

      // 3. Deduct stock and create MovimientoInventario entries
      if (dto.categoria === CategoriaEgreso.Insumos && dto.insumos && dto.insumos.length > 0) {
        for (const item of dto.insumos) {
          await tx.insumo.update({
            where: { id_insumo: item.id_insumo },
            data: {
              stock_actual: {
                decrement: item.cantidad,
              },
            },
          });

          await tx.movimientoInventario.create({
            data: {
              id_insumo: item.id_insumo,
              tipo: 'Salida',
              cantidad: item.cantidad,
              fecha: new Date(`${dto.fecha}T12:00:00.000Z`),
              id_usuario: idUsuarioCreacion,
              observaciones: `Restado por egreso: ${dto.concepto.trim()} (Egreso #${egreso.id_egreso})`,
            },
          });
        }
      }

      return egreso;
    });

    return {
      message: 'Egreso registrado exitosamente',
      ...this.toFinancialRecord(result),
    };
  }

  async findAll(): Promise<EgresoFinancialRecord[]> {
    const egresos = await this.prisma.egreso.findMany({
      orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }],
      include: {
        usuario_creacion: this.usuarioInclude,
        usuario_modificacion: this.usuarioInclude,
      },
    });

    return egresos.map((egreso) => this.toFinancialRecord(egreso));
  }

  async findOne(id: number): Promise<EgresoFinancialRecord & { insumos?: any[] }> {
    const egreso = await this.prisma.egreso.findUnique({
      where: { id_egreso: id },
      include: {
        usuario_creacion: this.usuarioInclude,
        usuario_modificacion: this.usuarioInclude,
      },
    });

    if (!egreso) {
      throw new NotFoundException('Egreso no encontrado');
    }

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: {
        observaciones: {
          contains: `(Egreso #${id})`,
        },
      },
      include: {
        insumo: true,
      },
    });

    const insumosMapped = movimientos.map((mov) => ({
      id_insumo: mov.id_insumo,
      nombre: mov.insumo.nombre,
      cantidad: mov.cantidad,
    }));

    return {
      ...this.toFinancialRecord(egreso),
      insumos: insumosMapped,
    };
  }

  async getResumen() {
    const hoy = new Date();

    const rangoMes = this.getMonthRange(hoy);
    const rangoDia = this.getDayRange(hoy);

    const [egresosMes, egresosDia] = await Promise.all([
      this.findByDateRange(rangoMes.start, rangoMes.end),
      this.findByDateRange(rangoDia.start, rangoDia.end),
    ]);

    const totalMes = this.sumMonto(egresosMes);
    const totalDia = this.sumMonto(egresosDia);
    const promedioMes = egresosMes.length > 0 ? totalMes / egresosMes.length : 0;

    return {
      egresos_del_mes: {
        total: totalMes,
        registros: egresosMes.map((egreso) => this.toFinancialRecord(egreso)),
      },
      egreso_del_dia: {
        total: totalDia,
        registros: egresosDia.map((egreso) => this.toFinancialRecord(egreso)),
      },
      egreso_promedio: {
        total: promedioMes,
        registros: egresosMes.map((egreso) => this.toFinancialRecord(egreso)),
      },
    };
  }

  async getEgresosDelMes(): Promise<{
    total: number;
    registros: EgresoFinancialRecord[];
  }> {
    const hoy = new Date();
    const { start, end } = this.getMonthRange(hoy);
    const egresos = await this.findByDateRange(start, end);

    return {
      total: this.sumMonto(egresos),
      registros: egresos.map((egreso) => this.toFinancialRecord(egreso)),
    };
  }

  async getEgresosDelDia(): Promise<{
    total: number;
    registros: EgresoFinancialRecord[];
  }> {
    const hoy = new Date();
    const { start, end } = this.getDayRange(hoy);
    const egresos = await this.findByDateRange(start, end);

    return {
      total: this.sumMonto(egresos),
      registros: egresos.map((egreso) => this.toFinancialRecord(egreso)),
    };
  }

  async getPromedioDelMes(): Promise<{
    total: number;
    registros: EgresoFinancialRecord[];
  }> {
    const hoy = new Date();
    const { start, end } = this.getMonthRange(hoy);
    const egresos = await this.findByDateRange(start, end);

    const totalMes = this.sumMonto(egresos);
    const promedio = egresos.length > 0 ? totalMes / egresos.length : 0;

    return {
      total: promedio,
      registros: egresos.map((egreso) => this.toFinancialRecord(egreso)),
    };
  }

  async update(
    id: number,
    dto: CreateEgresoDto,
    idUsuarioModificacion: number,
  ) {
    const existing = await this.prisma.egreso.findUnique({
      where: { id_egreso: id },
      select: { id_egreso: true },
    });

    if (!existing) {
      throw new NotFoundException('Egreso no encontrado');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Revert previous inventory movements associated with this egreso
      const previousMovements = await tx.movimientoInventario.findMany({
        where: {
          observaciones: {
            contains: `(Egreso #${id})`,
          },
        },
      });

      for (const mov of previousMovements) {
        // Increment stock back (revert the subtraction)
        await tx.insumo.update({
          where: { id_insumo: mov.id_insumo },
          data: {
            stock_actual: {
              increment: mov.cantidad,
            },
          },
        });
      }

      // Delete the previous movements
      await tx.movimientoInventario.deleteMany({
        where: {
          observaciones: {
            contains: `(Egreso #${id})`,
          },
        },
      });

      // 2. Validate new stock list if new category is Insumos
      if (dto.categoria === CategoriaEgreso.Insumos && dto.insumos && dto.insumos.length > 0) {
        for (const item of dto.insumos) {
          const insumo = await tx.insumo.findFirst({
            where: { id_insumo: item.id_insumo, activo: true },
          });
          if (!insumo) {
            throw new NotFoundException(`Insumo con ID ${item.id_insumo} no encontrado`);
          }
          if (insumo.stock_actual < item.cantidad) {
            throw new BadRequestException(
              `No hay stock suficiente para el insumo "${insumo.nombre}". Stock disponible: ${insumo.stock_actual}, solicitado: ${item.cantidad}`,
            );
          }
        }
      }

      // 3. Update the egreso
      const egreso = await tx.egreso.update({
        where: { id_egreso: id },
        data: {
          concepto: dto.concepto.trim(),
          monto: new Prisma.Decimal(dto.monto),
          categoria: dto.categoria,
          fecha: new Date(`${dto.fecha}T00:00:00.000Z`),
          observaciones: dto.observaciones?.trim() || null,
          id_usuario_modificacion: idUsuarioModificacion,
        },
        include: {
          usuario_creacion: this.usuarioInclude,
          usuario_modificacion: this.usuarioInclude,
        },
      });

      // 4. Subtract stock for the new list of supplies and create new MovimientoInventario records
      if (dto.categoria === CategoriaEgreso.Insumos && dto.insumos && dto.insumos.length > 0) {
        for (const item of dto.insumos) {
          await tx.insumo.update({
            where: { id_insumo: item.id_insumo },
            data: {
              stock_actual: {
                decrement: item.cantidad,
              },
            },
          });

          await tx.movimientoInventario.create({
            data: {
              id_insumo: item.id_insumo,
              tipo: 'Salida',
              cantidad: item.cantidad,
              fecha: new Date(`${dto.fecha}T12:00:00.000Z`),
              id_usuario: idUsuarioModificacion,
              observaciones: `Restado por egreso: ${dto.concepto.trim()} (Egreso #${egreso.id_egreso})`,
            },
          });
        }
      }

      return egreso;
    });

    return {
      message: 'Egreso actualizado exitosamente',
      ...this.toFinancialRecord(result),
    };
  }

  async remove(id: number) {
    const existing = await this.prisma.egreso.findUnique({
      where: { id_egreso: id },
      select: {
        id_egreso: true,
        concepto: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Egreso no encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Revert previous inventory movements associated with this egreso
      const previousMovements = await tx.movimientoInventario.findMany({
        where: {
          observaciones: {
            contains: `(Egreso #${id})`,
          },
        },
      });

      for (const mov of previousMovements) {
        // Increment stock back (revert the subtraction)
        await tx.insumo.update({
          where: { id_insumo: mov.id_insumo },
          data: {
            stock_actual: {
              increment: mov.cantidad,
            },
          },
        });
      }

      // Delete the previous movements
      await tx.movimientoInventario.deleteMany({
        where: {
          observaciones: {
            contains: `(Egreso #${id})`,
          },
        },
      });

      // 2. Delete the egreso
      await tx.egreso.delete({
        where: { id_egreso: id },
      });
    });

    return {
      message: 'Egreso eliminado exitosamente',
      id_egreso: existing.id_egreso,
      concepto: existing.concepto,
    };
  }

    private async findByDateRange(
      start: Date,
      end: Date,
      categoria?: CategoriaEgreso,
    ) {
      return this.prisma.egreso.findMany({
        where: {
          fecha: {
            gte: start,
            lt: end,
          },
          ...(categoria ? { categoria } : {}),
        },
        orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }],
        include: {
          usuario_creacion: this.usuarioInclude,
          usuario_modificacion: this.usuarioInclude,
        },
      });
    }

    private getDatePartsInHonduras(date: Date) {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Tegucigalpa',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const parts = formatter.formatToParts(date);

      const year = Number(parts.find((part) => part.type === 'year')?.value);
      const month = Number(parts.find((part) => part.type === 'month')?.value);
      const day = Number(parts.find((part) => part.type === 'day')?.value);

      return { year, month, day };
    }

    private getMonthRange(date: Date) {
      const { year, month } = this.getDatePartsInHonduras(date);

      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month, 1));

      return { start, end };
    }

    private getDayRange(date: Date) {
      const { year, month, day } = this.getDatePartsInHonduras(date);

      const start = new Date(Date.UTC(year, month - 1, day));
      const end = new Date(Date.UTC(year, month - 1, day + 1));

      return { start, end };
    }

    private sumMonto(egresos: EgresoEntity[]): number {
      return egresos.reduce((total, egreso) => total + Number(egreso.monto), 0);
    }

  private toFinancialRecord(egreso: EgresoEntity): EgresoFinancialRecord {
    const creadoPor = this.toUserAudit(egreso.usuario_creacion);

    const modificadoPor = egreso.usuario_modificacion
      ? this.toUserAudit(egreso.usuario_modificacion)
      : null;

    return {
      id_registro: `expense-${egreso.id_egreso}`,
      tipo: 'egreso',
      fecha: egreso.fecha.toISOString().split('T')[0],
      concepto: egreso.concepto,
      monto: Number(egreso.monto),
      categoria: egreso.categoria as CategoriaEgreso,
      observaciones: egreso.observaciones ?? null,
      responsable: creadoPor.nombre_completo,
      creado_por: creadoPor,
      modificado_por: modificadoPor,
    };
  }

  private toUserAudit(usuario: UsuarioAuditoria) {
    const nombreCompleto = [
      usuario.persona?.primer_nombre,
      usuario.persona?.segundo_nombre,
      usuario.persona?.primer_apellido,
      usuario.persona?.segundo_apellido,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      id_usuario: usuario.id_usuario,
      username: usuario.username,
      nombre_completo: nombreCompleto || usuario.username,
    };
  }
}