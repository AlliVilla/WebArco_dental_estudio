import { useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, Info, RefreshCcw, X } from 'lucide-react';

import { DataTable } from '../../../components';
import type { Column } from '../../../components';
import { Button, Card, Input, Select } from '../../../context';
import { formatCurrency } from '../../../utils/formatters';
import type { FinancialRecord, TransactionKind } from '../types';

export interface ListaFinancieraProps {
  records?: FinancialRecord[];
}

const financialRecords: FinancialRecord[] = [
  {
    id: 'income-1',
    type: 'income',
    date: '03/06/2026',
    patient: 'Mar\u00eda Gonz\u00e1lez',
    concept: 'Limpieza dental',
    amount: 1200,
    paymentMethod: 'Tarjeta',
  },
  {
    id: 'income-2',
    type: 'income',
    date: '02/06/2026',
    patient: 'Juan P\u00e9rez',
    concept: 'Ortodoncia - Consulta',
    amount: 2500,
    paymentMethod: 'Efectivo',
  },
  {
    id: 'income-3',
    type: 'income',
    date: '01/06/2026',
    patient: 'Ana Rodr\u00edguez',
    concept: 'Endodoncia',
    amount: 3800,
    paymentMethod: 'Transferencia',
  },
  {
    id: 'income-4',
    type: 'income',
    date: '01/06/2026',
    patient: 'Carlos M\u00e9ndez',
    concept: 'Extracci\u00f3n',
    amount: 800,
    paymentMethod: 'Efectivo',
  },
  {
    id: 'income-5',
    type: 'income',
    date: '31/05/2026',
    patient: 'Sof\u00eda Torres',
    concept: 'Implante dental - Anticipo',
    amount: 5000,
    paymentMethod: 'Transferencia',
  },
  {
    id: 'expense-1',
    type: 'expense',
    date: '03/06/2026',
    concept: 'Compra de guantes l\u00e1tex x500',
    amount: 450,
    category: 'Insumos',
    responsible: 'Dr. Karla Arita',
  },
  {
    id: 'expense-2',
    type: 'expense',
    date: '02/06/2026',
    concept: 'Mantenimiento autoclave',
    amount: 1200,
    category: 'Equipos',
    responsible: 'Dr. Karla Arita',
  },
  {
    id: 'expense-3',
    type: 'expense',
    date: '01/06/2026',
    concept: 'Pago n\u00f3mina asistente',
    amount: 8500,
    category: 'N\u00f3mina',
    responsible: 'Dr. Karla Arita',
  },
  {
    id: 'expense-4',
    type: 'expense',
    date: '01/06/2026',
    concept: 'Resinas dentales x10',
    amount: 2300,
    category: 'Insumos',
    responsible: 'Dr. Karla Arita',
  },
  {
    id: 'expense-5',
    type: 'expense',
    date: '31/05/2026',
    concept: 'Servicio de limpieza',
    amount: 800,
    category: 'Servicios',
    responsible: 'Dr. Karla Arita',
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

function MoneyText({ amount, type }: { amount: number; type: TransactionKind }) {
  return (
    <span style={{
      color: type === 'income' ? '#1D9E75' : '#E24B4A',
      fontSize: 13,
      fontWeight: 600,
    }}>
      {formatCurrency(amount)}
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
    Equipos: { background: '#F1F3F4', color: '#203F49' },
    'N\u00f3mina': { background: '#F1F3F4', color: '#EF9F27' },
    Servicios: { background: '#F1F3F4', color: '#1D9E75' },
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

export function ListaFinanciera({ records = financialRecords }: ListaFinancieraProps) {
  const [activeType, setActiveType] = useState<TransactionKind>('income');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setPatientSearch('');
    setPaymentMethod('');
    setExpenseCategory('');
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (record.type !== activeType) return false;

      const [day, month, year] = record.date.split('/');
      const sortableDate = `${year}-${month}-${day}`;

      if (fromDate && sortableDate < fromDate) return false;
      if (toDate && sortableDate > toDate) return false;
      if (
        activeType === 'income' &&
        patientSearch &&
        !String(record.patient ?? '').toLowerCase().includes(patientSearch.toLowerCase())
      ) {
        return false;
      }
      if (activeType === 'income' && paymentMethod && record.paymentMethod !== paymentMethod) return false;
      if (activeType === 'expense' && expenseCategory && record.category !== expenseCategory) return false;

      return true;
    });
  }, [activeType, expenseCategory, fromDate, patientSearch, paymentMethod, records, toDate]);

  const total = useMemo(
    () => filteredRecords.reduce((sum, record) => sum + record.amount, 0),
    [filteredRecords],
  );

  const incomeColumns: Column<FinancialRecord>[] = [
    { key: 'date', label: 'Fecha', width: 150 },
    { key: 'patient', label: 'Paciente' },
    { key: 'concept', label: 'Concepto' },
    {
      key: 'amount',
      label: 'Monto',
      render: (_value, record) => <MoneyText amount={record.amount} type="income" />,
    },
    {
      key: 'paymentMethod',
      label: 'M\u00e9todo',
      render: (_value, record) => <MethodBadge label={record.paymentMethod ?? 'Sin m\u00e9todo'} />,
    },
  ];

  const expenseColumns: Column<FinancialRecord>[] = [
    { key: 'date', label: 'Fecha', width: 150 },
    { key: 'concept', label: 'Concepto' },
    {
      key: 'category',
      label: 'Categor\u00eda',
      render: (_value, record) => <CategoryBadge label={record.category ?? 'Sin categor\u00eda'} />,
    },
    {
      key: 'amount',
      label: 'Monto',
      render: (_value, record) => <MoneyText amount={record.amount} type="expense" />,
    },
    { key: 'responsible', label: 'Responsable' },
  ];

  const columns = activeType === 'income' ? incomeColumns : expenseColumns;

  const footer = (
    <tfoot>
      <tr style={{ background: activeType === 'income' ? '#E6F8FB' : '#F1F3F4' }}>
        <td
          colSpan={3}
          style={{ padding: '12px 8px', color: '#203F49', fontSize: 13, fontWeight: 600 }}
        >
          {activeType === 'income' ? 'Total del periodo filtrado:' : 'Total del periodo:'}
        </td>
        <td style={{ padding: '12px 8px' }}>
          <MoneyText amount={total} type={activeType} />
        </td>
        <td />
      </tr>
    </tfoot>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1180 }}>
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
        Mostrando registros de {activeType === 'income' ? 'ingresos' : 'egresos'} del periodo seleccionado
      </div>

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
            setActiveType('income');
            clearFilters();
          }}
          style={{
            ...tabStyles[activeType === 'income' ? 'active' : 'inactive'],
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
            setActiveType('expense');
            clearFilters();
          }}
          style={{
            ...tabStyles[activeType === 'expense' ? 'active' : 'inactive'],
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
          gridTemplateColumns: activeType === 'income'
            ? '1fr 1fr 1fr 1fr'
            : '1fr 1fr 1fr',
          gap: 14,
          marginBottom: 18,
        }}>
          <Input
            label="Rango de fechas"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            aria-label="Rango de fechas"
          />
          <Input
            label="Hasta"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            aria-label="Hasta"
          />
          {activeType === 'income' ? (
            <>
              <Input
                label="Paciente"
                placeholder="Buscar paciente..."
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
                aria-label="Paciente"
              />
              <Select
                label="M\u00e9todo de pago"
                value={paymentMethod}
                onChange={setPaymentMethod}
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
              label="Categor\u00eda"
              value={expenseCategory}
              onChange={setExpenseCategory}
              placeholder="Todas"
              options={[
                { value: '', label: 'Todas' },
                { value: 'Insumos', label: 'Insumos' },
                { value: 'Equipos', label: 'Equipos' },
                { value: 'N\u00f3mina', label: 'N\u00f3mina' },
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
          <Button variant="secondary" size="sm">
            <RefreshCcw size={16} />
            Actualizar
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
          getRowKey={(row) => row.id}
          emptyMessage="No hay registros financieros para este periodo."
          style={{ borderRadius: 8 }}
        />
      </Card>
    </div>
  );
}
