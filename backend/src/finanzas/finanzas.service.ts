import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BalanceReportDto } from './dto/balance-report.dto';

type RangoFechas = {
  inicio: Date;
  finExclusivo: Date;
};

type TotalesEstadoResultado = {
  ingresosBrutos: number;
  descuentosAplicados: number;
  ingresosNetos: number;
  costoInsumos: number;
  gastosAdministrativos: number;
  nomina: number;
  servicios: number;
  equipos: number;
  otrosGastos: number;
  comisionesTarjeta: number;
  impuestos: number;
  utilidadBruta: number;
  utilidadOperativa: number;
  utilidadNeta: number;
  margenNeto: number;
};

@Injectable()
export class FinanzasService {
  constructor(private prismaService: PrismaService) {}

  async getEstadoResultado(fecha_inicio: Date, fecha_fin: Date) {
    const rango = this.normalizarRango(fecha_inicio, fecha_fin);
    const actual = await this.calcularTotalesEstado(rango);
    const periodoAnterior = this.obtenerRangoAnterior(rango);
    const anterior = await this.calcularTotalesEstado(periodoAnterior);
    const meses = await this.obtenerSerieMensual(rango.finExclusivo);

    const variacionVsPeriodoAnterior = anterior.utilidadNeta
      ? ((actual.utilidadNeta - anterior.utilidadNeta) / Math.abs(anterior.utilidadNeta)) * 100
      : 0;

    const gastosPorCategoria = {
      Insumos: actual.costoInsumos,
      Nómina: actual.nomina,
      'Renta/servicios': actual.servicios,
      Equipos: actual.equipos,
      Otros: actual.otrosGastos,
      Comisiones: actual.comisionesTarjeta,
      Impuestos: actual.impuestos,
    };

    return {
      periodo: {
        fechaInicio: rango.inicio.toISOString().split('T')[0],
        fechaFin: this.toDateOnly(this.addDays(rango.finExclusivo, -1)),
        nombre: this.obtenerNombrePeriodo(rango.inicio, rango.finExclusivo),
      },
      tarjetas: {
        ingresosTotales: actual.ingresosNetos,
        costoInsumos: actual.costoInsumos,
        gastosAdministrativos: actual.gastosAdministrativos,
        utilidadNeta: actual.utilidadNeta,
        margenNeto: actual.margenNeto,
      },
      ingresos: {
        consultasTratamientos: actual.ingresosBrutos,
        descuentosAplicados: actual.descuentosAplicados,
        ingresosNetos: actual.ingresosNetos,
      },
      costoInsumos: {
        insumosUtilizados: actual.costoInsumos,
      },
      gastosAdministrativos: {
        nomina: actual.nomina,
        rentaServiciosBasicos: actual.servicios,
        equipos: actual.equipos,
        otros: actual.otrosGastos,
        totalGastos: actual.gastosAdministrativos,
      },
      resultadoFinal: {
        comisionesPorTarjeta: actual.comisionesTarjeta,
        impuestos: actual.impuestos,
        utilidadBruta: actual.utilidadBruta,
        utilidadOperativa: actual.utilidadOperativa,
        utilidadNeta: actual.utilidadNeta,
        margenNeto: actual.margenNeto,
        variacionVsPeriodoAnterior,
      },
      gastosPorCategoria,
      meses,
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

  private async calcularTotalesEstado(rango: RangoFechas): Promise<TotalesEstadoResultado> {
    const tratamientos = await this.prismaService.consulta_Tratamiento.findMany({
      where: {
        consulta: {
          fecha_inicio: {
            gte: rango.inicio,
            lt: rango.finExclusivo,
          },
        },
      },
      select: {
        precio: true,
        descuento: true,
      },
    });

    const ingresosBrutos = tratamientos.reduce(
      (total, tratamiento) => total + Number(tratamiento.precio || 0),
      0,
    );

    const descuentosAplicados = tratamientos.reduce((total, tratamiento) => {
      const precio = Number(tratamiento.precio || 0);
      const descuento = Number(tratamiento.descuento || 0);
      return total + (precio * descuento) / 100;
    }, 0);

    const ingresosNetos = ingresosBrutos - descuentosAplicados;

    const movimientosInsumos = await this.prismaService.movimientoInventario.findMany({
      where: {
        tipo: 'Salida',
        fecha: {
          gte: rango.inicio,
          lt: rango.finExclusivo,
        },
      },
      include: {
        insumo: true,
      },
    });

    const costoInsumos = movimientosInsumos.reduce((total, movimiento) => {
      return total + Number(movimiento.cantidad || 0) * Number(movimiento.insumo.precio_costo || 0);
    }, 0);

    const egresos = await this.prismaService.egreso.findMany({
      where: {
        fecha: {
          gte: rango.inicio,
          lt: rango.finExclusivo,
        },
      },
      select: {
        id_egreso: true,
        categoria: true,
        monto: true,
        concepto: true,
      },
    });

    // IDs de egresos que ya tienen movimientos de inventario registrados
    const egresoIdsConMovimientos = new Set<number>();
    for (const m of movimientosInsumos) {
      if (m.observaciones) {
        const match = m.observaciones.match(/\(Egreso #(\d+)\)/);
        if (match) egresoIdsConMovimientos.add(parseInt(match[1], 10));
      }
    }

    let nomina = 0;
    let servicios = 0;
    let equipos = 0;
    let otrosGastos = 0;
    let insumosSinInventario = 0;

    for (const egreso of egresos) {
      const categoria = this.normalizarTexto(egreso.categoria);
      const concepto = this.normalizarTexto(egreso.concepto);
      const monto = Number(egreso.monto || 0);

      if (categoria.includes('insumo')) {
        if (!egresoIdsConMovimientos.has(egreso.id_egreso)) {
          insumosSinInventario += monto;
        }
        continue;
      }

      if (categoria.includes('nomina') || concepto.includes('nomina') || concepto.includes('salario')) {
        nomina += monto;
      } else if (
        categoria.includes('servicio') ||
        concepto.includes('renta') ||
        concepto.includes('alquiler') ||
        concepto.includes('servicio')
      ) {
        servicios += monto;
      } else if (categoria.includes('equipo') || concepto.includes('equipo')) {
        equipos += monto;
      } else {
        otrosGastos += monto;
      }
    }

    const gastosAdministrativos = nomina + servicios + equipos + otrosGastos;
    const costoInsumosTotal = costoInsumos + insumosSinInventario;
    const comisionesTarjeta = await this.calcularComisionesTarjeta(rango);
    const utilidadBruta = ingresosNetos - costoInsumosTotal;
    const utilidadAntesImpuestos = utilidadBruta - gastosAdministrativos - comisionesTarjeta;
    const impuestos = Math.max(0, utilidadAntesImpuestos) * 0.15;
    const utilidadOperativa = utilidadBruta - gastosAdministrativos;
    const utilidadNeta = utilidadAntesImpuestos - impuestos;
    const margenNeto = ingresosNetos > 0 ? (utilidadNeta / ingresosNetos) * 100 : 0;

    return {
      ingresosBrutos,
      descuentosAplicados,
      ingresosNetos,
      costoInsumos: costoInsumosTotal,
      gastosAdministrativos,
      nomina,
      servicios,
      equipos,
      otrosGastos,
      comisionesTarjeta,
      impuestos,
      utilidadBruta,
      utilidadOperativa,
      utilidadNeta,
      margenNeto,
    };
  }

  private async calcularComisionesTarjeta(rango: RangoFechas): Promise<number> {
    const [cuentasDestino, pagosPacienteTarjeta, pagosConsultaTarjeta] = await Promise.all([
      this.prismaService.cuentaDestinoConfig.findMany({
        where: { activo: true, comision: { gt: 0 } },
        select: { nombre: true, comision: true },
      }),
      this.prismaService.pagoPaciente.findMany({
        where: {
          metodo_pago: { contains: 'Tarjeta', mode: 'insensitive' },
          fecha: { gte: rango.inicio, lt: rango.finExclusivo },
        },
        select: { abono: true, cuenta_destino: true },
      }),
      this.prismaService.pagoConsulta.findMany({
        where: {
          metodoPago: 'TARJETA',
          fecha: { gte: rango.inicio, lt: rango.finExclusivo },
        },
        select: { monto: true },
      }),
    ]);

    // Mapa de nombre de cuenta destino -> comisión (decimal, ej. 2.5 = 2.5%)
    const comisionMap = new Map<string, number>();
    for (const c of cuentasDestino) {
      if (c.comision) comisionMap.set(c.nombre, Number(c.comision));
    }
    const comisionDefault = 2.0; // fallback si no hay config

    let totalComisiones = 0;

    for (const pago of pagosPacienteTarjeta) {
      const monto = Number(pago.abono || 0);
      const pct = pago.cuenta_destino ? comisionMap.get(pago.cuenta_destino) : undefined;
      totalComisiones += monto * ((pct ?? comisionDefault) / 100);
    }

    const montoConsulta = pagosConsultaTarjeta.reduce((sum, p) => sum + Number(p.monto || 0), 0);
    // pagos de consulta no tienen cuenta_destino, usar default
    totalComisiones += montoConsulta * (comisionDefault / 100);

    return totalComisiones;
  }

  private async obtenerSerieMensual(finExclusivo: Date): Promise<Array<{ mes: string; ingresos: number; gastos: number; utilidad: number }>> {
    const referencia = this.addDays(finExclusivo, -1);
    const meses: Array<{ mes: string; ingresos: number; gastos: number; utilidad: number }> = [];

    for (let i = 5; i >= 0; i -= 1) {
      const inicioMes = new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth() - i, 1));
      const finMes = new Date(Date.UTC(inicioMes.getUTCFullYear(), inicioMes.getUTCMonth() + 1, 1));
      const totales = await this.calcularTotalesEstado({ inicio: inicioMes, finExclusivo: finMes });

      meses.push({
        mes: this.obtenerNombreMesCorto(inicioMes),
        ingresos: totales.ingresosNetos,
        gastos: totales.costoInsumos + totales.gastosAdministrativos + totales.comisionesTarjeta + totales.impuestos,
        utilidad: totales.utilidadNeta,
      });
    }

    return meses;
  }

  private normalizarRango(fechaInicio: Date, fechaFin: Date): RangoFechas {
    const inicio = new Date(Date.UTC(
      fechaInicio.getUTCFullYear(),
      fechaInicio.getUTCMonth(),
      fechaInicio.getUTCDate(),
    ));
    const finExclusivo = new Date(Date.UTC(
      fechaFin.getUTCFullYear(),
      fechaFin.getUTCMonth(),
      fechaFin.getUTCDate() + 1,
    ));

    return { inicio, finExclusivo };
  }

  private obtenerRangoAnterior(rango: RangoFechas): RangoFechas {
    const dias = Math.max(
      1,
      Math.round((rango.finExclusivo.getTime() - rango.inicio.getTime()) / 86_400_000),
    );

    return {
      inicio: this.addDays(rango.inicio, -dias),
      finExclusivo: new Date(rango.inicio),
    };
  }

  private obtenerNombrePeriodo(inicio: Date, finExclusivo: Date): string {
    const fin = this.addDays(finExclusivo, -1);
    const mismoMes = inicio.getUTCFullYear() === fin.getUTCFullYear() && inicio.getUTCMonth() === fin.getUTCMonth();

    if (mismoMes && inicio.getUTCDate() === 1 && fin.getUTCDate() === new Date(Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth() + 1, 0)).getUTCDate()) {
      return `${this.obtenerNombreMesLargo(inicio)} ${inicio.getUTCFullYear()}`;
    }

    return `${this.toDateOnly(inicio)} al ${this.toDateOnly(fin)}`;
  }

  private obtenerNombreMesLargo(date: Date): string {
    return new Intl.DateTimeFormat('es-HN', {
      month: 'long',
      timeZone: 'UTC',
    }).format(date).replace(/^./, (letter) => letter.toUpperCase());
  }

  private obtenerNombreMesCorto(date: Date): string {
    return new Intl.DateTimeFormat('es-HN', {
      month: 'short',
      timeZone: 'UTC',
    }).format(date).replace('.', '').replace(/^./, (letter) => letter.toUpperCase());
  }

  private normalizarTexto(value: string | null | undefined): string {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
