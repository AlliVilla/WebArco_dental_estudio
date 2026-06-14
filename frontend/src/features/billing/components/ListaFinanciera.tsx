import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, FileSpreadsheet, FileText, Info, RefreshCcw, X } from 'lucide-react';

import { DataTable } from '../../../components';
import type { Column } from '../../../components';
import { Button, Card, Input, Select } from '../../../context';
import { formatCurrency } from '../../../utils/formatters';
import type { FinancialRecord, TransactionKind } from '../types';
import billingService from '../services/billingService';

export interface ListaFinancieraProps {
  records?: FinancialRecord[];
}

const financialRecords: FinancialRecord[] = [
  {
    id_registro: 'income-1',
    tipo: 'ingreso',
    fecha: '2026-06-03',
    paciente: 'María González',
    concepto: 'Limpieza dental',
    monto: 1200,
    metodoPago: 'Tarjeta',
  },
  {
    id_registro: 'income-2',
    tipo: 'ingreso',
    fecha: '2026-06-02',
    paciente: 'Juan Pérez',
    concepto: 'Ortodoncia - Consulta',
    monto: 2500,
    metodoPago: 'Efectivo',
  },
  {
    id_registro: 'income-3',
    tipo: 'ingreso',
    fecha: '2026-06-01',
    paciente: 'Ana Rodríguez',
    concepto: 'Endodoncia',
    monto: 3800,
    metodoPago: 'Transferencia',
  },
  {
    id_registro: 'income-4',
    tipo: 'ingreso',
    fecha: '2026-06-01',
    paciente: 'Carlos Méndez',
    concepto: 'Extracción',
    monto: 800,
    metodoPago: 'Efectivo',
  },
  {
    id_registro: 'income-5',
    tipo: 'ingreso',
    fecha: '2026-05-31',
    paciente: 'Sofía Torres',
    concepto: 'Implante dental - Anticipo',
    monto: 5000,
    metodoPago: 'Transferencia',
  },
];

const tabStyles = {
  active: {
    background: '#0BC5DF',
    color: '#F8F9FA',
    border: '1px solid #0BC5DF',
  },
  inactive: {
    background: '#F8F9FA',
    color: '#888F94',
    border: '1px solid transparent',
  },
};

function formatTableDate(fecha: string) {
  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
}

function parseFilterDate(fecha: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) return '';

  const [day, month, year] = fecha.split('/');
  return `${year}-${month}-${day}`;
}

function formatFilterDate(fecha: string) {
  if (!fecha) return '';

  const [year, month, day] = fecha.split('-');
  return `${day}/${month}/${year}`;
}

function DateFilterField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const pickerValue = parseFilterDate(value);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>{label}</label>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        border: '1px solid #D3D7DA',
        borderRadius: 8,
        background: '#F8F9FA',
        padding: '0 10px 0 12px',
        height: 42,
      }}>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="dd/mm/yyyy"
          inputMode="numeric"
          maxLength={10}
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            color: '#203F49',
            fontSize: 14,
            minWidth: 0,
          }}
        />
        <button
          type="button"
          onClick={() => pickerRef.current?.showPicker()}
          aria-label={`Seleccionar ${label.toLowerCase()}`}
          style={{
            width: 28,
            height: 28,
            border: 'none',
            background: 'transparent',
            color: '#203F49',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <Calendar size={16} />
        </button>
        <input
          ref={pickerRef}
          type="date"
          value={pickerValue}
          onChange={(event) => onChange(formatFilterDate(event.target.value))}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
            right: 12,
            bottom: 0,
          }}
        />
      </div>
    </div>
  );
}

function MoneyText({ monto, tipo }: { monto: number; tipo: TransactionKind }) {
  return (
    <span style={{
      color: tipo === 'ingreso' ? '#1D9E75' : '#E24B4A',
      fontSize: 13,
      fontWeight: 600,
    }}>
      {formatCurrency(monto)}
    </span>
  );
}

function MethodBadge({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      background: '#F1F3F4',
      color: '#5F656A',
      fontSize: 11,
      fontWeight: 500,
      padding: '3px 10px',
      minWidth: 72,
    }}>
      {label}
    </span>
  );
}

function CategoryBadge({ label }: { label: string }) {
  const badgeStyles: Record<string, { background: string; color: string }> = {
    Insumos: { background: '#E6F8FB', color: '#0899B0' },
    Equipos: { background: '#E8EDFF', color: '#4F6FB5' },
    Nómina: { background: '#FDE9BA', color: '#A76B00' },
    Servicios: { background: '#DDF4EA', color: '#3B8F6A' },
  };

  const style = badgeStyles[label] ?? { background: '#F1F3F4', color: '#5F656A' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      background: style.background,
      color: style.color,
      fontSize: 11,
      fontWeight: 500,
      padding: '3px 10px',
      minWidth: 72,
    }}>
      {label}
    </span>
  );
}

export function ListaFinanciera({ records: recordsProp }: ListaFinancieraProps) {
  const [tipoActivo, setTipoActivo] = useState<TransactionKind>('ingreso');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [categoriaEgreso, setCategoriaEgreso] = useState('');
  const [apiExpenseRecords, setApiExpenseRecords] = useState<FinancialRecord[]>([]);
  const [estaCargando, setEstaCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  const cargarEgresos = async () => {
    setEstaCargando(true);
    setErrorCarga('');

    try {
      const response = await billingService.getExpenses();
      setApiExpenseRecords(response.data ?? []);
    } catch (error: any) {
      setErrorCarga(error?.message ?? 'No se pudieron cargar los egresos.');
    } finally {
      setEstaCargando(false);
    }
  };

  useEffect(() => {
    if (recordsProp) return;

    void cargarEgresos();
  }, [recordsProp]);

  const records = useMemo(() => {
    if (recordsProp) return recordsProp;

    const ingresos = financialRecords.filter((record) => record.tipo === 'ingreso');

    return [...ingresos, ...apiExpenseRecords];
  }, [apiExpenseRecords, recordsProp]);

  const clearFilters = () => {
    setFechaDesde('');
    setFechaHasta('');
    setBusquedaPaciente('');
    setMetodoPago('');
    setCategoriaEgreso('');
  };

  const filteredRecords = useMemo(() => {
    const fechaDesdeIso = parseFilterDate(fechaDesde);
    const fechaHastaIso = parseFilterDate(fechaHasta);

    return records.filter((record) => {
      if (record.tipo !== tipoActivo) return false;
      if (fechaDesdeIso && record.fecha < fechaDesdeIso) return false;
      if (fechaHastaIso && record.fecha > fechaHastaIso) return false;

      if (
        tipoActivo === 'ingreso' &&
        busquedaPaciente &&
        !String(record.paciente ?? '').toLowerCase().includes(busquedaPaciente.toLowerCase())
      ) {
        return false;
      }

      if (tipoActivo === 'ingreso' && metodoPago && record.metodoPago !== metodoPago) return false;
      if (tipoActivo === 'egreso' && categoriaEgreso && record.categoria !== categoriaEgreso) return false;

      return true;
    });
  }, [busquedaPaciente, categoriaEgreso, fechaDesde, fechaHasta, metodoPago, records, tipoActivo]);

  const total = useMemo(
    () => filteredRecords.reduce((sum, record) => sum + record.monto, 0),
    [filteredRecords],
  );

  const incomeColumns: Column<FinancialRecord>[] = [
    {
      key: 'fecha',
      label: 'Fecha',
      width: 150,
      render: (_value, record) => formatTableDate(record.fecha),
    },
    { key: 'paciente', label: 'Paciente' },
    { key: 'concepto', label: 'Concepto' },
    {
      key: 'monto',
      label: 'Monto',
      render: (_value, record) => <MoneyText monto={record.monto} tipo="ingreso" />,
    },
    {
      key: 'metodoPago',
      label: 'Método',
      render: (_value, record) => <MethodBadge label={record.metodoPago ?? 'Sin método'} />,
    },
  ];

  const expenseColumns: Column<FinancialRecord>[] = [
    {
      key: 'fecha',
      label: 'Fecha',
      width: 150,
      render: (_value, record) => formatTableDate(record.fecha),
    },
    { key: 'concepto', label: 'Concepto' },
    {
      key: 'categoria',
      label: 'Categoría',
      render: (_value, record) => <CategoryBadge label={record.categoria ?? 'Sin categoría'} />,
    },
    {
      key: 'monto',
      label: 'Monto',
      render: (_value, record) => <MoneyText monto={record.monto} tipo="egreso" />,
    },
    {
      key: 'observaciones',
      label: 'Observaciones',
      render: (_value, record) => record.observaciones || '—',
    },
    {
      key: 'responsable',
      label: 'Responsable',
      render: (_value, record) => record.responsable || record.creado_por?.nombre_completo || '—',
    },
  ];

  const columns = tipoActivo === 'ingreso' ? incomeColumns : expenseColumns;

  const footer = (
    <tfoot>
      <tr style={{ background: tipoActivo === 'ingreso' ? '#E6F8FB' : '#F1F3F4' }}>
        <td
          colSpan={tipoActivo === 'ingreso' ? 3 : 4}
          style={{ padding: '12px 8px', color: '#203F49', fontSize: 13, fontWeight: 600 }}
        >
          {tipoActivo === 'ingreso' ? 'Total del periodo filtrado:' : 'Total del periodo:'}
        </td>
        <td style={{ padding: '12px 8px' }}>
          <MoneyText monto={total} tipo={tipoActivo} />
        </td>
        <td />
      </tr>
    </tfoot>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        border: '1px solid #0BC5DF',
        borderRadius: 8,
        background: '#E6F8FB',
        padding: '12px 16px',
        color: '#203F49',
        fontSize: 13,
      }}>
        <Info size={16} style={{ color: '#0BC5DF', flexShrink: 0 }} />
        Mostrando registros de {tipoActivo === 'ingreso' ? 'ingresos' : 'egresos'} del periodo seleccionado
      </div>

      {errorCarga && (
        <div style={{
          border: '1px solid #E24B4A',
          borderRadius: 8,
          background: '#FEE2E2',
          padding: '12px 16px',
          color: '#B91C1C',
          fontSize: 13,
        }}>
          {errorCarga}
        </div>
      )}

      <div style={{
        display: 'inline-flex',
        width: 'fit-content',
        background: '#F8F9FA',
        border: '1px solid #D3D7DA',
        borderRadius: 10,
        padding: 4,
        gap: 4,
      }}>
        <button
          type="button"
          onClick={() => {
            setTipoActivo('ingreso');
            clearFilters();
          }}
          style={{
            ...tabStyles[tipoActivo === 'ingreso' ? 'active' : 'inactive'],
            minWidth: 112,
            height: 28,
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Ingresos
        </button>
        <button
          type="button"
          onClick={() => {
            setTipoActivo('egreso');
            clearFilters();
          }}
          style={{
            ...tabStyles[tipoActivo === 'egreso' ? 'active' : 'inactive'],
            minWidth: 112,
            height: 28,
            borderRadius: 8,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Egresos
        </button>
      </div>

      <Card style={{ padding: 24, borderRadius: 14 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: tipoActivo === 'ingreso'
            ? '1fr 1fr 1fr 1fr'
            : '1fr 1fr 1fr',
          gap: 14,
          marginBottom: 18,
        }}>
          <DateFilterField
            label="Rango de fechas"
            value={fechaDesde}
            onChange={setFechaDesde}
          />

          <DateFilterField
            label="Hasta"
            value={fechaHasta}
            onChange={setFechaHasta}
          />

          {tipoActivo === 'ingreso' ? (
            <>
              <Input
                label="Paciente"
                placeholder="Buscar paciente..."
                value={busquedaPaciente}
                onChange={(event) => setBusquedaPaciente(event.target.value)}
                aria-label="Paciente"
              />

              <Select
                label="Método de Pago"
                value={metodoPago}
                onChange={setMetodoPago}
                placeholder="Todos"
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'Tarjeta', label: 'Tarjeta' },
                  { value: 'Efectivo', label: 'Efectivo' },
                  { value: 'Transferencia', label: 'Transferencia' },
                ]}
              />
            </>
          ) : (
            <Select
              label="Categoría"
              value={categoriaEgreso}
              onChange={setCategoriaEgreso}
              placeholder="Todas"
              options={[
                { value: '', label: 'Todas' },
                { value: 'Insumos', label: 'Insumos' },
                { value: 'Equipos', label: 'Equipos' },
                { value: 'Nómina', label: 'Nómina' },
                { value: 'Servicios', label: 'Servicios' },
              ]}
            />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            <X size={16} />
            Limpiar Filtros
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => void cargarEgresos()}
            disabled={estaCargando}
          >
            <RefreshCcw size={16} />
            {estaCargando ? 'Actualizando...' : 'Actualizar'}
          </Button>

          <Button variant="secondary" size="sm">
            <FileSpreadsheet size={16} />
            Exportar Excel
          </Button>

          <Button variant="secondary" size="sm">
            <FileText size={16} />
            Exportar PDF
          </Button>
        </div>

        <DataTable<FinancialRecord>
          columns={columns}
          data={filteredRecords}
          searchable={false}
          pageSize={20}
          hidePagination
          footer={footer}
          getRowKey={(row) => row.id_registro}
          emptyMessage="No hay registros financieros para este periodo."
          style={{ borderRadius: 8 }}
        />
      </Card>
    </div>
  );
}
