import { useMemo } from 'react';
import { Calendar, CheckCircle, Download, Eye, FileText, Plus, XCircle } from 'lucide-react';

import { DataTable, type Column, type FilterDef } from '../../../components';
import { Alert, Card, StatusBadge, useTheme } from '../../../context';
import { formatDate, formatIdentity } from '../../../utils/formatters';
import type { ConsentimientoListItem, ConsentimientoStats, EstadoFirma } from '../types';

export type ConsentimientosTableParams = {
  page: number;
  search: string;
  filters: Record<string, string>;
};

export interface ListadoConsentimientosProps {
  consentimientos: ConsentimientoListItem[];
  stats?: ConsentimientoStats | null;
  totalRecords?: number;
  onPrint?: (id: number) => void;
  onViewDetail?: (id: number) => void;
  onCreateNew?: () => void;
  onTableParamsChange?: (params: ConsentimientosTableParams) => void;
  loading?: boolean;
}

type ConsentimientoTableItem = ConsentimientoListItem & Record<string, unknown>;

const ESTADO_LABELS: Record<EstadoFirma, string> = {
  completo: 'Completo',
  pendiente: 'Pendiente',
  incompleto: 'Incompleto',
};

function getPacienteNombre(consentimiento: ConsentimientoListItem) {
  const { paciente } = consentimiento;
  return [
    paciente.primer_nombre,
    paciente.segundo_nombre,
    paciente.primer_apellido,
    paciente.segundo_apellido,
  ]
    .filter(Boolean)
    .join(' ');
}

function getEstadoBadge(estado: EstadoFirma) {
  if (estado === 'completo') {
    return <StatusBadge status="confirmada" />;
  }

  if (estado === 'pendiente') {
    return <StatusBadge status="programada" />;
  }

  return <StatusBadge status="cancelada" />;
}

export function ListadoConsentimientos({
  consentimientos,
  stats,
  totalRecords = consentimientos.length,
  onPrint,
  onViewDetail,
  onCreateNew,
  onTableParamsChange,
  loading = false,
}: ListadoConsentimientosProps) {
  useTheme();

  const tableData = useMemo<ConsentimientoTableItem[]>(
    () =>
      consentimientos.map((consentimiento) => ({
        ...consentimiento,
        paciente_nombre: getPacienteNombre(consentimiento),
        numero_identidad: consentimiento.paciente.numero_identidad,
        tratamiento_busqueda: consentimiento.tratamiento,
        estado_label: ESTADO_LABELS[consentimiento.estado_firmas],
        mes: consentimiento.fecha.slice(0, 7),
      })),
    [consentimientos],
  );

  const fallbackStats = useMemo(
    () => ({
      total: totalRecords,
      completos: consentimientos.filter((item) => item.estado_firmas === 'completo').length,
      pendientes: consentimientos.filter((item) => item.estado_firmas === 'pendiente').length,
      incompletos: consentimientos.filter((item) => item.estado_firmas === 'incompleto').length,
    }),
    [consentimientos, totalRecords],
  );

  const displayStats = stats ?? fallbackStats;

  const monthOptions = useMemo(() => {
    const months = Array.from(new Set(consentimientos.map((item) => item.fecha.slice(0, 7)))).sort().reverse();

    return months.map((month) => {
      const [year, monthNumber] = month.split('-');
      const label = new Intl.DateTimeFormat('es-HN', { month: 'long', year: 'numeric' }).format(
        new Date(Number(year), Number(monthNumber) - 1, 1),
      );

      return { value: month, label };
    });
  }, [consentimientos]);

  const columns = useMemo<Column<ConsentimientoTableItem>[]>(
    () => [
      {
        key: 'fecha',
        label: 'Fecha',
        width: 120,
        render: (value) => (
          <span style={{ color: 'var(--foreground)', fontSize: 13 }}>{formatDate(value as string)}</span>
        ),
      },
      {
        key: 'paciente_nombre',
        label: 'Paciente',
        render: (_, row) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ color: 'var(--foreground)', fontSize: 13, fontWeight: 500 }}>
              {String(row.paciente_nombre)}
            </span>
            <span style={{ color: 'var(--muted-foreground)', fontSize: 11 }}>
              {formatIdentity(row.paciente.numero_identidad)}
            </span>
          </div>
        ),
      },
      {
        key: 'tratamiento',
        label: 'Tratamiento',
        render: (value) => <span style={{ color: 'var(--foreground)', fontSize: 13 }}>{String(value)}</span>,
      },
      {
        key: 'firmas',
        label: 'Firmas',
        render: (_, row) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted-foreground)' }}>
              {row.tiene_firma_paciente ? (
                <CheckCircle size={16} style={{ color: 'var(--arco-success)' }} />
              ) : (
                <XCircle size={16} style={{ color: 'var(--arco-warning)' }} />
              )}
              Pac.
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted-foreground)' }}>
              {row.tiene_firma_doctor ? (
                <CheckCircle size={16} style={{ color: 'var(--arco-success)' }} />
              ) : (
                <XCircle size={16} style={{ color: 'var(--arco-warning)' }} />
              )}
              Doc.
            </span>
          </div>
        ),
      },
      {
        key: 'estado_firmas',
        label: 'Estado',
        width: 140,
        render: (value) => getEstadoBadge(value as EstadoFirma),
      },
    ],
    [],
  );

  const filters = useMemo<FilterDef[]>(
    () => [
      {
        key: 'estado_firmas',
        placeholder: 'Estado',
        options: [
          { value: 'completo', label: 'Completo' },
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'incompleto', label: 'Incompleto' },
        ],
      },
      {
        key: 'mes',
        placeholder: 'Mes',
        options: monthOptions,
      },
    ],
    [monthOptions],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--foreground)' }}>
          Ver Consentimientos
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted-foreground)' }}>
          Gestión y seguimiento de consentimientos informados
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500, textTransform: 'uppercase' }}>Total</p>
          <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 600, color: 'var(--foreground)' }}>{displayStats.total}</p>
        </Card>
        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--arco-success)', fontWeight: 500, textTransform: 'uppercase' }}>Completos</p>
          <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 600, color: 'var(--arco-success)' }}>{displayStats.completos}</p>
        </Card>
        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--arco-warning)', fontWeight: 500, textTransform: 'uppercase' }}>Pendientes</p>
          <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 600, color: 'var(--arco-warning)' }}>{displayStats.pendientes}</p>
        </Card>
        <Card style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--arco-danger)', fontWeight: 500, textTransform: 'uppercase' }}>Incompletos</p>
          <p style={{ margin: '8px 0 0', fontSize: 18, fontWeight: 600, color: 'var(--arco-danger)' }}>{displayStats.incompletos}</p>
        </Card>
      </div>

      {displayStats.incompletos + displayStats.pendientes > 0 && (
        <Alert
          variant="warning"
          message={`Hay ${displayStats.incompletos + displayStats.pendientes} consentimientos que requieren firmas pendientes.`}
        />
      )}

      <DataTable<ConsentimientoTableItem>
        columns={columns}
        data={tableData}
        title="Consentimientos registrados"
        description="Busca por paciente, identidad o tratamiento y filtra por estado o mes."
        searchPlaceholder="Buscar consentimiento..."
        searchKeys={['paciente_nombre', 'numero_identidad', 'tratamiento_busqueda']}
        filters={filters}
        pageSize={10}
        isServerSide={Boolean(onTableParamsChange)}
        totalRecords={totalRecords}
        onServerParamsChange={onTableParamsChange}
        primaryAction={{ label: 'Crear Nuevo', icon: <Plus size={16} />, onClick: () => onCreateNew?.() }}
        secondaryActions={[
          {
            label: 'Mes actual',
            icon: <Calendar size={16} />,
            onClick: () => undefined,
          },
        ]}
        rowActions={(row) => [
          {
            icon: <Eye size={16} />,
            label: 'Ver detalle',
            onClick: () => onViewDetail?.(row.id_consulta),
          },
          {
            icon: <Download size={16} />,
            label: 'Imprimir',
            onClick: () => onPrint?.(row.id_consulta),
          },
        ]}
        getRowKey={(row) => String(row.id_consulta)}
        emptyMessage={loading ? 'Cargando consentimientos...' : 'No se encontraron consentimientos.'}
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16 }}
        footer={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted-foreground)' }}>
            <FileText size={16} />
            {totalRecords} consentimientos en total
          </span>
        }
      />
    </div>
  );
}

export default ListadoConsentimientos;
