import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type React from 'react';
import { Activity, ArrowLeft, Download, RefreshCw, Search, TrendingDown, TrendingUp } from 'lucide-react';

import { DataTable, type Column } from '../../../components';
import { Alert, Button, Card, Input, SectionBlock, Select } from '../../../context';
import { useTheme } from '../../../context/ThemeContext';
import { inventoryService } from '../services/inventoryService';
import { formatDate } from '../../../utils/formatters';
import type {
  InventoryItem,
  InventoryMovement,
  InventoryMovementHistoryParams,
  InventoryMovementSummary,
  TipoMovimientoInventario,
} from '../types';

export interface InventoryHistoryScreenProps {}

type HistoryFilterState = {
  search: string;
  id_insumo: string;
  tipo: TipoMovimientoInventario | '';
  fechaInicio: string;
  fechaFin: string;
};

const emptyFilters: HistoryFilterState = {
  search: '',
  id_insumo: '',
  tipo: '',
  fechaInicio: '',
  fechaFin: '',
};

const emptySummary: InventoryMovementSummary = {
  total_movimientos: 0,
  total_entradas: 0,
  total_salidas: 0,
  balance_unidades: 0,
};

const movementTypeOptions = [
  { value: 'Entrada', label: 'Entrada' },
  { value: 'Salida', label: 'Salida' },
];

export function InventoryHistoryScreen(_props: InventoryHistoryScreenProps) {
  useTheme();
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [summary, setSummary] = useState<InventoryMovementSummary>(emptySummary);
  const [filters, setFilters] = useState<HistoryFilterState>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const productOptions = useMemo(
    () => items.map((item) => ({ value: String(item.id_insumo), label: `${item.codigo} - ${item.nombre}` })),
    [items],
  );

  const columns: Column<InventoryMovement>[] = useMemo(
    () => [
      { key: 'fecha', label: 'Fecha', width: 128, render: (value) => formatDate(String(value)) },
      { key: 'codigo', label: 'Código', width: 100, render: (value) => <strong style={{ color: 'var(--foreground)', fontWeight: 500 }}>{String(value)}</strong> },
      { key: 'producto', label: 'Producto', render: (value) => <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>{String(value)}</span> },
      { key: 'tipo', label: 'Tipo', align: 'center', width: 112, render: (value) => <MovementBadge type={String(value)} /> },
      { key: 'cantidad', label: 'Cantidad', align: 'center', width: 94, render: (value, row) => <QuantityValue value={Number(value)} type={row.tipo} /> },
      { key: 'responsable', label: 'Responsable', width: 170 },
      { key: 'observaciones', label: 'Observaciones', render: (value) => <span style={{ color: value ? 'var(--arco-gray-700)' : 'var(--arco-gray-500)' }}>{String(value || 'Sin observaciones')}</span> },
    ],
    [],
  );

  const loadProducts = useCallback(async () => {
    const response = await inventoryService.getAll();
    setItems(response.data.data);
  }, []);

  const loadHistory = useCallback(async (nextFilters: HistoryFilterState) => {
    setLoading(true);
    setError('');
    try {
      const params = toHistoryParams(nextFilters);
      const response = await inventoryService.getMovementHistory(params);
      setMovements(response.data.data);
      setSummary(response.data.summary);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts().catch((err) => setError(getErrorMessage(err)));
    void loadHistory(emptyFilters);
  }, [loadHistory, loadProducts]);

  const applyFilters = () => {
    void loadHistory(filters);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    void loadHistory(emptyFilters);
  };

  const exportCsv = () => {
    exportMovementsCsv(movements);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <Alert variant="error" message={error} onClose={() => setError('')} />}

      <Card style={{ padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ margin: 0, color: 'var(--foreground)', fontSize: 18, fontWeight: 600 }}>Historial de movimientos</h2>
          <p style={{ margin: 0, color: 'var(--arco-gray-500)', fontSize: 13 }}>Consulta entradas y salidas registradas en inventario con filtros por producto, tipo y fecha.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/inventory')}>
            <ArrowLeft size={16} />
            Volver
          </Button>
          <Button variant="secondary" size="sm" onClick={exportCsv}>
            <Download size={16} />
            Exportar CSV
          </Button>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 16 }}>
        <HistoryMetricCard label="Movimientos" value={String(summary.total_movimientos)} icon={<Activity size={22} />} tone="primary" />
        <HistoryMetricCard label="Entradas" value={String(summary.total_entradas)} icon={<TrendingUp size={22} />} tone="success" />
        <HistoryMetricCard label="Salidas" value={String(summary.total_salidas)} icon={<TrendingDown size={22} />} tone="danger" />
        <HistoryMetricCard label="Balance" value={String(summary.balance_unidades)} icon={<Activity size={22} />} tone="warning" />
      </div>

      <SectionBlock title="Filtros del historial">
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr 1fr 1fr', gap: 14, alignItems: 'end' }}>
          <Input
            label="Buscar"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Código o producto"
          />
          <Select
            label="Producto"
            placeholder="Todos los productos"
            options={productOptions}
            value={filters.id_insumo}
            onChange={(value) => setFilters((prev) => ({ ...prev, id_insumo: value }))}
          />
          <Select
            label="Tipo"
            placeholder="Todos"
            options={movementTypeOptions}
            value={filters.tipo}
            onChange={(value) => setFilters((prev) => ({ ...prev, tipo: value as TipoMovimientoInventario | '' }))}
          />
          <Input
            label="Desde"
            type="date"
            value={filters.fechaInicio}
            onChange={(event) => setFilters((prev) => ({ ...prev, fechaInicio: event.target.value }))}
          />
          <Input
            label="Hasta"
            type="date"
            value={filters.fechaFin}
            onChange={(event) => setFilters((prev) => ({ ...prev, fechaFin: event.target.value }))}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <Button variant="secondary" size="sm" onClick={clearFilters}>Limpiar</Button>
          <Button variant="primary" size="sm" onClick={applyFilters} loading={loading}>
            <Search size={16} />
            Aplicar filtros
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void loadHistory(filters)}>
            <RefreshCw size={16} />
            Actualizar
          </Button>
        </div>
      </SectionBlock>

      <DataTable<InventoryMovement>
        title="Detalle de movimientos"
        description="Listado cronológico de entradas y salidas de insumos"
        columns={columns}
        data={movements}
        searchable={false}
        pageSize={10}
        getRowKey={(row) => String(row.id_movimiento)}
        emptyMessage={loading ? 'Cargando historial...' : 'No hay movimientos que coincidan con los filtros.'}
      />
    </div>
  );
}

function HistoryMetricCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: 'primary' | 'success' | 'warning' | 'danger' }) {
  const map = {
    primary: { bg: 'var(--arco-primary-light)', color: 'var(--arco-primary)' },
    success: { bg: 'var(--arco-success-soft)', color: 'var(--arco-success)' },
    warning: { bg: 'var(--arco-warning-soft)', color: 'var(--arco-warning)' },
    danger: { bg: 'var(--arco-danger-soft)', color: 'var(--arco-danger)' },
  };
  const selected = map[tone];

  return (
    <Card style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--arco-gray-500)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</div>
        <div style={{ fontSize: 18, color: selected.color, fontWeight: 600 }}>{value}</div>
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: selected.bg, color: selected.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    </Card>
  );
}

function MovementBadge({ type }: { type: string }) {
  const isEntry = type === 'Entrada';
  return <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, background: isEntry ? 'var(--arco-success-soft)' : 'var(--arco-danger-soft)', color: isEntry ? 'var(--arco-success)' : 'var(--arco-danger)' }}>{type}</span>;
}

function QuantityValue({ value, type }: { value: number; type: TipoMovimientoInventario }) {
  const isEntry = type === 'Entrada';
  return <strong style={{ color: isEntry ? 'var(--arco-success)' : 'var(--arco-danger)', fontWeight: 600 }}>{isEntry ? '+' : '-'}{value}</strong>;
}

function toHistoryParams(filters: HistoryFilterState): InventoryMovementHistoryParams {
  const params: InventoryMovementHistoryParams = { page: 1, limit: 100 };

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.id_insumo) params.id_insumo = Number(filters.id_insumo);
  if (filters.tipo) params.tipo = filters.tipo;
  if (filters.fechaInicio) params.fechaInicio = filters.fechaInicio;
  if (filters.fechaFin) params.fechaFin = filters.fechaFin;

  return params;
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: string }).message);
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

function exportMovementsCsv(movements: InventoryMovement[]) {
  const header = ['Fecha', 'Código', 'Producto', 'Tipo', 'Cantidad', 'Responsable', 'Observaciones'];
  const rows = movements.map((movement) => [movement.fecha, movement.codigo, movement.producto, movement.tipo, movement.cantidad, movement.responsable, movement.observaciones ?? '']);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `historial-inventario-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
