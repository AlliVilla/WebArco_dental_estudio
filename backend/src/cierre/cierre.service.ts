import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoCierre } from '@prisma/client';

@Injectable()
export class CierreService {
  constructor(private readonly prisma: PrismaService) { }

  private getDateRange(tipoCierre: TipoCierre): { start: Date; end: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setHours(0, 0, 0, 0);

    switch (tipoCierre) {
      case 'Semanal':
        start.setDate(start.getDate() - 6); // 7 days total including today
        break;
      case 'Quincenal':
        start.setDate(start.getDate() - 14); // 15 days total
        break;
      case 'Mensual':
        start.setMonth(start.getMonth() - 1); // 1 month
        break;
      case 'Diario':
        // Already set to today
        break;
    }

    return { start, end };
  }

  async previewCierre(tipoCierre: TipoCierre = 'Diario') {
    const validos = Object.values(TipoCierre);
    if (!validos.includes(tipoCierre)) {
      throw new BadRequestException(
        `Tipo de cierre inválido: "${tipoCierre}". Valores permitidos: ${validos.join(', ')}`,
      );
    }

    const { start, end } = this.getDateRange(tipoCierre);
    const fechaWhere = { gte: start, lte: end };

    // Totales de egresos + desglose de pagos por método
    const [egresos, pagosPorMetodo] = await Promise.all([
      this.prisma.egreso.aggregate({
        where: { fecha: fechaWhere },
        _sum: { monto: true },
      }),
      this.prisma.pagoPaciente.groupBy({
        by: ['metodo_pago'],
        where: { fecha: fechaWhere },
        _sum: { abono: true },
      }),
    ]);

    // Extraer totales por método de pago del resultado agrupado
    const sumaMetodo = (metodo: string): number =>
      Number(
        pagosPorMetodo.find((r) => r.metodo_pago === metodo)?._sum.abono ?? 0,
      );

    const efectivo = sumaMetodo('Efectivo');
    const tarjeta = sumaMetodo('Tarjeta');
    const transferencia = sumaMetodo('Transferencia');

    const totalIngresos = efectivo + tarjeta + transferencia;
    const totalEgresos = Math.round(Number(egresos._sum.monto || 0) * 100) / 100;
    const utilidad = Math.round((totalIngresos - totalEgresos) * 100) / 100;

    return {
      totalIngresos,
      totalEgresos,
      utilidad,
      efectivo,
      tarjeta,
      transferencia,
      fecha: new Date().toISOString(),
      tipoCierre,
    };
  }

  async previewCierrePorFecha(fechaStr: string) {
    const parts = fechaStr.split('/');
    if (parts.length !== 3) {
      throw new BadRequestException('Formato de fecha inválido. Use DD/MM/YYYY');
    }
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new BadRequestException('Formato de fecha inválido. Use DD/MM/YYYY');
    }

    const start = new Date(year, month, day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(year, month, day);
    end.setHours(23, 59, 59, 999);

    const fechaWhere = { gte: start, lte: end };

    // Totales de egresos + desglose de pagos por método
    const [egresos, pagosPorMetodo] = await Promise.all([
      this.prisma.egreso.aggregate({
        where: { fecha: fechaWhere },
        _sum: { monto: true },
      }),
      this.prisma.pagoPaciente.groupBy({
        by: ['metodo_pago'],
        where: { fecha: fechaWhere },
        _sum: { abono: true },
      }),
    ]);

    // Extraer totales por método de pago del resultado agrupado
    const sumaMetodo = (metodo: string): number =>
      Number(
        pagosPorMetodo.find((r) => r.metodo_pago === metodo)?._sum.abono ?? 0,
      );

    const efectivo = sumaMetodo('Efectivo');
    const tarjeta = sumaMetodo('Tarjeta');
    const transferencia = sumaMetodo('Transferencia');

    const totalIngresos = efectivo + tarjeta + transferencia;
    const totalEgresos = Math.round(Number(egresos._sum.monto || 0) * 100) / 100;
    const utilidad = Math.round((totalIngresos - totalEgresos) * 100) / 100;

    return {
      totalIngresos,
      totalEgresos,
      utilidad,
      efectivo,
      tarjeta,
      transferencia,
      fecha: start.toISOString(),
      tipoCierre: 'Diario',
    };
  }

  async createCierre(userId: number, tipoCierre: TipoCierre = 'Diario') {
    const validos = Object.values(TipoCierre);
    if (!validos.includes(tipoCierre)) {
      throw new BadRequestException(
        `Tipo de cierre inválido: "${tipoCierre}". Valores permitidos: ${validos.join(', ')}`,
      );
    }

    const { start, end } = this.getDateRange(tipoCierre);

    const existing = await this.prisma.cierre.findFirst({
      where: {
        tipo_cierre: tipoCierre,
        fecha: {
          gte: start,
          lte: end,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Ya existe un cierre ${tipoCierre} para el período actual.`);
    }

    const preview = await this.previewCierre(tipoCierre);

    const nuevoCierre = await this.prisma.cierre.create({
      data: {
        fecha: new Date(),
        tipo_cierre: tipoCierre,
        ingresos: preview.totalIngresos,
        egresos: preview.totalEgresos,
        utilidad: preview.utilidad,
        efectivo: preview.efectivo,
        tarjeta: preview.tarjeta,
        transferencia: preview.transferencia,
        id_usuario: userId,
      },
    });

    return {
      cierre: nuevoCierre,
      message: 'Cierre de caja generado exitosamente',
    };
  }

  async getHistorial() {
    return await this.prisma.cierre.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        usuario: {
          select: {
            username: true,
            persona: {
              select: {
                primer_nombre: true,
                primer_apellido: true,
              }
            }
          }
        }
      }
    });
  }
}
