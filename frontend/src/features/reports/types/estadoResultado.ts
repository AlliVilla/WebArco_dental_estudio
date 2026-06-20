export interface GastosPorCategoria {
  [categoria: string]: number;
}

export interface EstadoResultadoMes {
  mes: string;
  ingresos: number;
  gastos: number;
  utilidad: number;
}

export interface EstadoResultadoResponse {
  periodo: {
    fechaInicio: string;
    fechaFin: string;
    nombre: string;
  };
  tarjetas: {
    ingresosTotales: number;
    costoInsumos: number;
    gastosAdministrativos: number;
    utilidadNeta: number;
    margenNeto: number;
  };
  ingresos: {
    consultasTratamientos: number;
    descuentosAplicados: number;
    ingresosNetos: number;
  };
  costoInsumos: {
    insumosUtilizados: number;
  };
  gastosAdministrativos: {
    nomina: number;
    rentaServiciosBasicos: number;
    equipos: number;
    otros: number;
    totalGastos: number;
  };
  resultadoFinal: {
    comisionesPorTarjeta: number;
    impuestos: number;
    utilidadBruta: number;
    utilidadOperativa: number;
    utilidadNeta: number;
    margenNeto: number;
    variacionVsPeriodoAnterior: number;
  };
  gastosPorCategoria: GastosPorCategoria;
  meses: EstadoResultadoMes[];
}
