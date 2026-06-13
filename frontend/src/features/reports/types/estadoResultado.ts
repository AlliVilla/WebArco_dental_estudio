export interface GastosPorCategoria {
  [categoria: string]: number;
}

export interface EstadoResultadoResponse {
  ingresos: number;

  gastosPorCategoria: Record<string, number>;

  totalGastos: number;

  utilidadNeta: number;
}