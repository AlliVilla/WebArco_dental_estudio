import { PrismaService } from '../prisma/prisma.service';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BalanceReportDto } from './dto/balance-report.dto';

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

  async getBalance(fecha_inicio: Date, fecha_fin: Date): Promise<BalanceReportDto> {
    // --- Ingresos por tratamientos ----------------------------------------------
    const consultasConTratamientos = await this.prismaService.consulta.findMany({
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

    const totalIngresosConsultas = consultasConTratamientos.reduce((acc, c) => {
      const tratamientos = c.tratamientos.reduce((sum, t) => {
        return sum + Number(t.precio);
      }, 0);
      return acc + tratamientos;
    }, 0);

    // --- Ingresos por consulta --------------------------------------------------
    const pagosSimples = await this.prismaService.pagoPaciente.findMany({
      where: {
        fecha: {
          gte: fecha_inicio,
          lte: fecha_fin,
        },
      },
    });

    const totalCobranzasSimples = pagosSimples.reduce((acc, pago) => {
      return acc + Number(pago.abono);
    }, 0);

    const pagosConsulta = await this.prismaService.pagoConsulta.findMany({
      where: {
        fecha: {
          gte: fecha_inicio,
          lte: fecha_fin,
        },
      },
    });

    const totalPagosConsulta = pagosConsulta.reduce((acc, pago) => {
      return acc + Number(pago.monto);
    }, 0);

    // --- Activos y cuentas por cobrar -------------------------------------------
    const totalCobranzas = totalCobranzasSimples + totalPagosConsulta;

    const cuentasPorCobrar = totalIngresosConsultas - totalCobranzas;
    const totalActivosCirculantes = totalCobranzas + cuentasPorCobrar;

    // --- Movimeintos de Inventario ----------------------------------------------
    const movimientosEgreso = await this.prismaService.movimientoInventario.findMany({
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

    const egresosPorCategoria: Record<string, number> = {};
    let totalEgresosPorInventario = 0;

    for (const movimiento of movimientosEgreso) {
      const categoria = movimiento.insumo.categoria.nombre;
      const egreso = Number(movimiento.cantidad) * Number(movimiento.insumo.precio_costo);

      if (!egresosPorCategoria[categoria]) {
        egresosPorCategoria[categoria] = 0;
      }

      egresosPorCategoria[categoria] += egreso;
      totalEgresosPorInventario += egreso;
    }

    // --- Pasivos ----------------------------------------------------------------
    const totalPasivosCirculantes = totalEgresosPorInventario * 0.1; // 10% como estimado

    // --- Flujo de caja ----------------------------------------------------------
    // 8. Calcular flujo de caja
    const flujoCajaActual = totalCobranzas - totalEgresosPorInventario;

    // 9. Calcular totales consolidados
    const totalActivos = totalActivosCirculantes;
    const totalPasivos = totalPasivosCirculantes;
    const capitalNeto = totalActivos - totalPasivos;

    return {
      totalIngresosConsultas,
      totalCobranzasSimples,
      totalPagosConsulta,
      totalCobranzas,
      totalActivosCirculantes,
      totalEgresosPorInventario,
      totalPasivosCirculantes,
      flujoCajaActual,
      totalActivos,
      totalPasivos,
      capitalNeto,
      egresosPorCategoria,
      fechaInicio: fecha_inicio,
      fechaFin: fecha_fin,
    };

  }
};
