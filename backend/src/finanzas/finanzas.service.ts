import { PrismaService } from '../prisma/prisma.service';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

@Injectable()
export class FinanzasService {
    constructor(private prismaService: PrismaService){}

    async getEstadoResultado(fecha_inicio: Date, fecha_fin: Date) {
        const consultas = await this.prismaService.consulta.findMany({
          where: {
            fecha_inicio: {
              gte: fecha_inicio,
              lte: fecha_fin,
            },
          },
          include: {
            tratamientos: true,
          },
        });

        const ingresos = consultas.reduce((acc, c) => {
          const tratamientos = c.tratamientos.reduce((sum, t) => {
            return sum + Number(t.precio);
          }, 0);
      
          return acc + tratamientos;
        }, 0);

        const gastos = await this.prismaService.movimientoInventario.findMany({
          where: {
            tipo: 'Salida',
            fecha: {
              gte: fecha_inicio,
              lte: fecha_fin,
            },
          },
          include: {
            insumo: {
              include: {
                categoria: true,
              },
            },
          },
        });

        const gastosPorCategoria: Record<string, number> = {};

        for (const g of gastos) {
          const categoria = g.insumo.categoria.nombre;
        
          if (!gastosPorCategoria[categoria]) {
            gastosPorCategoria[categoria] = 0;
          }
      
          gastosPorCategoria[categoria] += Number(g.cantidad) * Number(g.insumo.precio_costo);
        }

        const totalGastos = Object.values(gastosPorCategoria).reduce(
          (a, b) => a + b,
          0,
        );

        const utilidadNeta = ingresos - totalGastos;

        return {
          ingresos,
          gastosPorCategoria,
          totalGastos,
          utilidadNeta,
        };
    }
};