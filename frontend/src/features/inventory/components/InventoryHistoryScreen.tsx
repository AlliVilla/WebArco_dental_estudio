import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type React from 'react';
import { Activity, ArrowLeft, FileSpreadsheet, RefreshCw, Search, TrendingDown, TrendingUp } from 'lucide-react';

import { DataTable, type Column } from '../../../components';
import { Alert, Button, Card } from '../../../context';
import { useTheme } from '../../../context/ThemeContext';
import { inventoryService } from '../services/inventoryService';
import { formatDate } from '../../../utils/formatters';
import { exportToExcel } from '../../../utils/exportToExcel';
import type {
  InventoryItem,
  InventoryMovement,
  InventoryMovementHistoryParams,
  InventoryMovementSummary,
  TipoMovimientoInventario,
} from '../types';

export interface InventoryHistoryScreenProps {}

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
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const serverFiltersRef = useRef({ search: '', id_insumo: '', tipo: '' as TipoMovimientoInventario | '' });

  const productOptions = useMemo(
    () => items.map((item) => ({ value: String(item.id_insumo), label: `${item.codigo} - ${item.nombre}` })),
    [items],
  );

  const columns: Column<InventoryMovement>[] = useMemo(
    () => [
      { key: 'fecha', label: 'Fecha', width: 128, render: (value) => formatDate(String(value)) },
      { key: 'codigo', label: 'Código', width: 100, render: (value) => <strong style={{ color: '#203F49', fontWeight: 500 }}>{String(value)}</strong> },
      { key: 'producto', label: 'Producto', render: (value) => <span style={{ color: '#203F49', fontWeight: 500 }}>{String(value)}</span> },
      { key: 'tipo', label: 'Tipo', align: 'center', width: 112, render: (value) => <MovementBadge type={String(value)} /> },
      { key: 'cantidad', label: 'Cantidad', align: 'center', width: 94, render: (value, row) => <QuantityValue value={Number(value)} type={row.tipo} /> },
      { key: 'responsable', label: 'Responsable', width: 170 },
      { key: 'observaciones', label: 'Observaciones', render: (value) => <span style={{ color: value ? '#203F49' : '#888F94' }}>{String(value || 'Sin observaciones')}</span> },
    ],
    [],
  );

  const loadProducts = useCallback(async () => {
    try {
      const response = await inventoryService.getAll();
      setItems(response.data.data);
    } catch {
      // non-critical
    }
  }, []);

  const fetchHistory = useCallback(async (params: InventoryMovementHistoryParams) => {
    setLoading(true);
    setError('');
    try {
      const response = await inventoryService.getMovementHistory(params);
      setMovements(response.data.data);
      setSummary(response.data.summary);
      setTotalRecords(response.data.pagination?.total ?? 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const buildParams = useCallback(
    (server: { search: string; id_insumo: string; tipo: string }, page = 1): InventoryMovementHistoryParams => {
      const params: InventoryMovementHistoryParams = { page, limit: 10 };
      if (server.search) params.search = server.search;
      if (server.id_insumo) params.id_insumo = Number(server.id_insumo);
      if (server.tipo) params.tipo = server.tipo as TipoMovimientoInventario;
      if (fechaInicio) params.fechaInicio = fechaInicio;
      if (fechaFin) params.fechaFin = fechaFin;
      return params;
    },
    [fechaInicio, fechaFin],
  );

  const handleServerParams = useCallback(
    (params: { page: number; search: string; filters: Record<string, string> }) => {
      serverFiltersRef.current = {
        search: params.search,
        id_insumo: params.filters.id_insumo ?? '',
        tipo: (params.filters.tipo ?? '') as TipoMovimientoInventario | '',
      };
      void fetchHistory(buildParams(serverFiltersRef.current, params.page));
    },
    [fetchHistory, buildParams],
  );

  useEffect(() => {
    void loadProducts();
    handleServerParams({ page: 1, search: '', filters: {} });
  }, [handleServerParams, loadProducts]);

  const applyFilters = () => {
    void fetchHistory(buildParams(serverFiltersRef.current));
  };

  const clearFilters = () => {
    setFechaInicio('');
    setFechaFin('');
    serverFiltersRef.current = { search: '', id_insumo: '', tipo: '' };
    void fetchHistory(buildParams({ search: '', id_insumo: '', tipo: '' }));
  };

  const exportExcel = async () => {
    if (movements.length === 0) return;
    try {
      await exportMovementsToExcel(movements);
    } catch {
      setError('Error al exportar historial de inventario a Excel.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <Alert variant="error" message={error} onClose={() => setError('')} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(150px, 1fr))', gap: 16 }}>
        <MetricCard
          label="Movimientos"
          value={String(summary.total_movimientos)}
          icon={<Activity size={22} />}
          tone="primary"
        />
        <MetricCard
          label="Entradas"
          value={String(summary.total_entradas)}
          icon={<TrendingUp size={22} />}
          tone="success"
        />
        <MetricCard
          label="Salidas"
          value={String(summary.total_salidas)}
          icon={<TrendingDown size={22} />}
          tone="danger"
        />
        <MetricCard
          label="Balance"
          value={String(summary.balance_unidades)}
          icon={<Activity size={22} />}
          tone="warning"
        />
      </div>

      <DataTable<InventoryMovement>
        title="Detalle de movimientos"
        description="Listado cronológico de entradas y salidas de insumos"
        columns={columns}
        data={movements}
        searchable
        searchPlaceholder="Buscar código o producto..."
        searchKeys={['codigo', 'producto']}
        filters={[
          {
            key: 'id_insumo',
            placeholder: 'Todos los productos',
            options: productOptions,
          },
          {
            key: 'tipo',
            placeholder: 'Tipo',
            options: movementTypeOptions,
          },
        ]}
        isServerSide
        totalRecords={totalRecords}
        onServerParamsChange={handleServerParams}
        pageSize={10}
        filterExtra={
          <>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              placeholder="Desde"
              style={{
                height: 40,
                padding: '0 12px',
                border: '1px solid #E4E7EC',
                borderRadius: 8,
                background: '#fff',
                fontSize: 12,
                color: fechaInicio ? '#203F49' : '#98A2B3',
                outline: 'none',
                boxSizing: 'border-box',
                minWidth: 140,
              }}
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              placeholder="Hasta"
              style={{
                height: 40,
                padding: '0 12px',
                border: '1px solid #E4E7EC',
                borderRadius: 8,
                background: '#fff',
                fontSize: 12,
                color: fechaFin ? '#203F49' : '#98A2B3',
                outline: 'none',
                boxSizing: 'border-box',
                minWidth: 140,
              }}
            />
            <Button variant="primary" size="sm" onClick={applyFilters} loading={loading}>
              <Search size={16} />
              Buscar
            </Button>
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Limpiar
            </Button>
          </>
        }
        secondaryActions={[
          {
            label: 'Exportar Excel',
            icon: <FileSpreadsheet size={16} />,
            onClick: exportExcel,
          },
          {
            label: 'Volver',
            icon: <ArrowLeft size={16} />,
            onClick: () => navigate('/inventory'),
          },
        ]}
        getRowKey={(row) => String(row.id_movimiento)}
        emptyMessage={loading ? 'Cargando historial...' : 'No hay movimientos que coincidan con los filtros.'}
      />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const map = {
    primary: { bg: '#E6F8FB', color: '#0BC5DF' },
    success: { bg: '#ECFDF5', color: '#1D9E75' },
    warning: { bg: '#FFFBEB', color: '#EF9F27' },
    danger: { bg: '#FEF2F2', color: '#E24B4A' },
  };
  const selected = map[tone];
  return (
    <Card
      style={{
        padding: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#888F94', marginBottom: 8 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 18,
            color: selected.color,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </div>
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: selected.bg,
          color: selected.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: 12,
        }}
      >
        {icon}
      </div>
    </Card>
  );
}

function MovementBadge({ type }: { type: string }) {
  const isEntry = type === 'Entrada';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: 20,
        background: isEntry ? '#ECFDF5' : '#FEF2F2',
        color: isEntry ? '#1D9E75' : '#E24B4A',
      }}
    >
      {type}
    </span>
  );
}

function QuantityValue({ value, type }: { value: number; type: TipoMovimientoInventario }) {
  const isEntry = type === 'Entrada';
  return (
    <strong
      style={{
        color: isEntry ? '#1D9E75' : '#E24B4A',
        fontWeight: 600,
      }}
    >
      {isEntry ? '+' : '-'}{value}
    </strong>
  );
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: string }).message);
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

async function exportMovementsToExcel(movements: InventoryMovement[]) {
  const rows = movements.map((movement) => ({
    fecha: formatDate(String(movement.fecha)),
    codigo: movement.codigo,
    producto: movement.producto,
    tipo: movement.tipo,
    cantidad: movement.cantidad,
    responsable: movement.responsable,
    observaciones: movement.observaciones ?? '',
  }));

  const columnas = [
    { header: 'Fecha', key: 'fecha', width: 14 },
    { header: 'Código', key: 'codigo', width: 14 },
    { header: 'Producto', key: 'producto', width: 32 },
    { header: 'Tipo', key: 'tipo', width: 14 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: 'Responsable', key: 'responsable', width: 26 },
    { header: 'Observaciones', key: 'observaciones', width: 36 },
  ];

  await exportToExcel(rows, columnas, 'Historial', 'Historial_Inventario_WebArco');
}
