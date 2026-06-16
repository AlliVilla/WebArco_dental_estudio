export type CategoriaInsumo = 'Anestesia' | 'Higiene' | 'Materiales' | 'Instrumental' | 'Medicamento' | 'Otro';
export type UnidadMedidaInsumo = 'Unidad' | 'Caja' | 'Frasco' | 'Paquete' | 'Kit' | 'Tubo' | 'Bolsa';
export type EstadoInsumo = 'Normal' | 'Stock bajo' | 'Agotado';
export type EstadoRegistroInsumo = 'Activo' | 'Inactivo';
export type TipoMovimientoInventario = 'Entrada' | 'Salida';

export type InventoryItem = Record<string, unknown> & {
  id_insumo: number;
  codigo: string;
  nombre: string;
  categoria: CategoriaInsumo;
  unidad_medida: UnidadMedidaInsumo;
  stock_actual: number;
  stock_minimo: number;
  precio_costo: number;
  activo: boolean;
  estado: EstadoInsumo;
  estado_registro: EstadoRegistroInsumo;
};

export type InventoryMovement = Record<string, unknown> & {
  id_movimiento: number;
  id_insumo: number;
  producto: string;
  codigo: string;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  fecha: string;
  id_usuario?: number;
  responsable: string;
  observaciones?: string | null;
};

export type InventoryStats = {
  total_productos: number;
  stock_bajo: number;
  agotados: number;
  valor_total: number;
};

export type InventoryMovementSummary = {
  total_movimientos: number;
  total_entradas: number;
  total_salidas: number;
  balance_unidades: number;
};

export type InventoryMovementPagination = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type InventoryMovementHistoryResponse = {
  data: InventoryMovement[];
  summary: InventoryMovementSummary;
  pagination: InventoryMovementPagination;
};

export type InventoryMovementHistoryParams = {
  search?: string;
  id_insumo?: number;
  tipo?: TipoMovimientoInventario;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  limit?: number;
};

export type CreateInventoryItemInput = {
  nombre: string;
  categoria: CategoriaInsumo;
  unidad_medida: UnidadMedidaInsumo;
  stock_actual: number;
  stock_minimo: number;
  precio_costo: number;
};

export type UpdateInventoryItemInput = Partial<Omit<CreateInventoryItemInput, 'stock_actual'>>;

export type CreateInventoryMovementInput = {
  tipo: TipoMovimientoInventario;
  id_insumo: number;
  cantidad: number;
  fecha: string;
  observaciones?: string;
};

export type InventoryListResponse = {
  data: InventoryItem[];
  stats: InventoryStats;
};
