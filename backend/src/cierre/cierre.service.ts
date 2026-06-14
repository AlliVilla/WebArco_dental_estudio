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
      default:
        // Already set to today
        break;
    }

    return { start, end };
  }

  async previewCierre(tipoCierre: TipoCierre = 'Diario') {
    const { start, end } = this.getDateRange(tipoCierre);

    const ingresos = await this.prisma.pagoPaciente.aggregate({
      where: {
        fecha: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        abono: true,
      },
    });

    const egresos = await this.prisma.egreso.aggregate({
      where: {
        fecha: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        monto: true,
      },
    });

    // Breakdown by payment method
    const pagosEfectivo = await this.prisma.pagoPaciente.aggregate({
      where: { fecha: { gte: start, lte: end }, metodo_pago: 'Efectivo' },
      _sum: { abono: true },
    });

    const pagosTarjeta = await this.prisma.pagoPaciente.aggregate({
      where: { fecha: { gte: start, lte: end }, metodo_pago: 'Tarjeta' },
      _sum: { abono: true },
    });

    const pagosTransferencia = await this.prisma.pagoPaciente.aggregate({
      where: { fecha: { gte: start, lte: end }, metodo_pago: 'Transferencia' },
      _sum: { abono: true },
    });

    const totalIngresos = Number(ingresos._sum.abono || 0);
    const totalEgresos = Number(egresos._sum.monto || 0);
    const utilidad = Number((totalIngresos - totalEgresos).toFixed(2));

    const efectivo = Number(pagosEfectivo._sum.abono || 0);
    const tarjeta = Number(pagosTarjeta._sum.abono || 0);
    const transferencia = Number(pagosTransferencia._sum.abono || 0);

    return {
      totalIngresos: Number(totalIngresos.toFixed(2)),
      totalEgresos: Number(totalEgresos.toFixed(2)),
      utilidad,
      efectivo: Number(efectivo.toFixed(2)),
      tarjeta: Number(tarjeta.toFixed(2)),
      transferencia: Number(transferencia.toFixed(2)),
      fecha: new Date().toISOString(),
      tipoCierre,
    };
  }

  async createCierre(userId: number, tipoCierre: TipoCierre = 'Diario') {
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
