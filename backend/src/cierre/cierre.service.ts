import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CierreService {
  constructor(private readonly prisma: PrismaService) {}

  async previewCierre() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ingresos = await this.prisma.pagoPaciente.aggregate({
      where: {
        fecha: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        abono: true,
      },
    });

    const egresos = await this.prisma.egreso.aggregate({
      where: {
        fecha: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        monto: true,
      },
    });

    const totalIngresos = Number(ingresos._sum.abono || 0);
    const totalEgresos = Number(egresos._sum.monto || 0);
    const saldo = totalIngresos - totalEgresos;

    return {
      totalIngresos,
      totalEgresos,
      saldo,
      fecha: new Date().toISOString(),
    };
  }

  async createCierre(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.prisma.cierre.findFirst({
      where: {
        fecha: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Ya existe un cierre de caja para el día de hoy');
    }

    const preview = await this.previewCierre();

    const nuevoCierre = await this.prisma.cierre.create({
      data: {
        fecha: new Date(),
        ingresos: preview.totalIngresos,
        egresos: preview.totalEgresos,
        saldo: preview.saldo,
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
