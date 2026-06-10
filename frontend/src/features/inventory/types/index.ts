export type CategoriaInsumo = 'Anestesia' | 'Higiene' | 'Materiales' | 'Instrumental' | 'Medicamento' | 'Otro';
export type UnidadMedidaInsumo = 'Unidad' | 'Caja' | 'Frasco' | 'Paquete' | 'Kit' | 'Tubo' | 'Bolsa';
export type EstadoInsumo = 'Normal' | 'Stock bajo' | 'Agotado';
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
  estado: EstadoInsumo;
};

export type InventoryMovement = Record<string, unknown> & {
  id_movimiento: number;
  id_insumo: number;
  producto: string;
  codigo: string;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  fecha: string;
  responsable: string;
  observaciones?: string | null;
};

export type InventoryStats = {
  total_productos: number;
  stock_bajo: number;
  agotados: number;
  valor_total: number;
};

export type CreateInventoryItemInput = {
  nombre: string;
  categoria: CategoriaInsumo;
  unidad_medida: UnidadMedidaInsumo;
  stock_actual: number;
  stock_minimo: number;
  precio_costo: number;
};

export type CreateInventoryMovementInput = {
  tipo: TipoMovimientoInventario;
  id_insumo: number;
  cantidad: number;
  fecha: string;
  responsable: string;
  observaciones?: string;
};

export type InventoryListResponse = {
  data: InventoryItem[];
  stats: InventoryStats;
};
