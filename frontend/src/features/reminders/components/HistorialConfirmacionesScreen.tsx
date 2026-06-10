import { useState, useMemo, useCallback, useEffect } from 'react';
import { History, Download, RefreshCw, MessageCircle, Mail, Phone } from 'lucide-react';
import { DataTable } from '../../../components/DataTable';
import { Button } from '../../../context';
import { ReminderService } from '../services/ReminderService';
import { formatDate } from '../../../utils/formatters';
import type { HistorialConfirmacionRow, CanalRecordatorio, RespuestaPaciente } from '../types';

// --- Tipos --------------------------------------------------------------------

export interface HistorialConfirmacionesScreenProps {}

// --- Configuración de badges --------------------------------------------------

const RESPUESTA_CONFIG: Record<RespuestaPaciente, { color: string; bg: string; dot: string; label: string }> = {
    Confirmó:      { color: '#1D9E75', bg: '#ECFDF5', dot: '#1D9E75', label: 'Confirmó'      },
    Canceló:       { color: '#E24B4A', bg: '#FEF2F2', dot: '#E24B4A', label: 'Canceló'       },
    'Sin respuesta': { color: '#888F94', bg: '#F1F3F4', dot: '#D3D7DA', label: 'Sin respuesta' },
};

const CANAL_CONFIG: Record<CanalRecordatorio, { icon: React.ReactNode; color: string; bg: string }> = {
    WhatsApp: { icon: <MessageCircle size={13} />, color: '#1D9E75', bg: '#ECFDF5' },
    SMS:      { icon: <Phone size={13} />,         color: '#EF9F27', bg: '#FFF8EC' },
    Correo:   { icon: <Mail size={13} />,          color: '#0BC5DF', bg: '#E6F8FB' },
};

const MOCK_HISTORIAL: HistorialConfirmacionRow[] = [
    {
        id: 1,
        paciente: 'Juan Pérez',
        fecha_envio: '2026-06-08T08:00:00',
        fecha_respuesta: '2026-06-08T08:15:00',
        respuesta: 'Confirmó',
        canal: 'WhatsApp',
    },
    {
        id: 2,
        paciente: 'María López',
        fecha_envio: '2026-06-08T09:00:00',
        fecha_respuesta: '2026-06-08T09:45:00',
        respuesta: 'Canceló',
        canal: 'SMS',
    },
    {
        id: 3,
        paciente: 'Carlos Hernández',
        fecha_envio: '2026-06-08T10:00:00',
        fecha_respuesta: null,
        respuesta: 'Sin respuesta',
        canal: 'Correo',
    },
    {
        id: 4,
        paciente: 'Ana Martínez',
        fecha_envio: '2026-06-08T11:00:00',
        fecha_respuesta: '2026-06-08T11:08:00',
        respuesta: 'Confirmó',
        canal: 'WhatsApp',
    },
    {
        id: 5,
        paciente: 'Luis Gómez',
        fecha_envio: '2026-06-08T12:00:00',
        fecha_respuesta: null,
        respuesta: 'Sin respuesta',
        canal: 'SMS',
    },
];

// --- Helpers ---------------------------------------------------------------------------

function formatFechaHora(iso: string | null) {
    if (!iso) return '—';
    return `${formatDate(iso)} · ${new Date(iso).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}`;
}

function getInitials(nombre: string) {
    const [a, b] = nombre.trim().split(' ');
    return ((a?.[0] ?? '') + (b?.[0] ?? '')).toUpperCase();
}

// --- Badge de respuesta -------------------------------------------------------

function RespuestaBadge({ respuesta }: { respuesta: RespuestaPaciente }) {
    const cfg = RESPUESTA_CONFIG[respuesta];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: cfg.bg, color: cfg.color,
            padding: '3px 10px', borderRadius: 8,
            fontSize: 11, fontWeight: 600,
        }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
        {cfg.label}
        </span>
    );
}

// --- Badge de canal (opcional) ------------------------------------------------

function CanalBadge({ canal }: { canal: CanalRecordatorio | null }) {
    if (!canal) {
        return <span style={{ fontSize: 12, color: '#D3D7DA' }}>—</span>;
    }
    const cfg = CANAL_CONFIG[canal];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: cfg.bg, color: cfg.color,
            padding: '3px 8px', borderRadius: 8,
            fontSize: 11, fontWeight: 600,
        }}>
        {cfg.icon} {canal}
        </span>
    );
}

// --- Pantalla principal -------------------------------------------------------

export function HistorialConfirmacionesScreen(_props: HistorialConfirmacionesScreenProps) {
    const [rows, setRows] = useState<HistorialConfirmacionRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // -- Carga de datos -----------------------------------------------------------------
    const fetchHistorial = useCallback(async () => {
        //  -- CARGAR DATOS MOCK_HISTORIAL ---------------------
        setLoading(true);

        await new Promise((resolve) => setTimeout(resolve, 500));

        setRows(MOCK_HISTORIAL);
        setLoading(false);
    }, []);

    useEffect(() => { fetchHistorial(); }, [fetchHistorial]);

    // -- Estadísticas -------------------------------------------------------------------
    const stats = useMemo(() => ({
        total:         rows.length,
        confirmados:   rows.filter((r) => r.respuesta === 'Confirmó').length,
                                 cancelados:    rows.filter((r) => r.respuesta === 'Canceló').length,
                                 sin_respuesta: rows.filter((r) => r.respuesta === 'Sin respuesta').length,
    }), [rows]);

    const tasaConfirmacion = stats.total > 0
    ? Math.round((stats.confirmados / stats.total) * 100)
    : 0;

    // -- Columnas -----------------------------------------------------------------------
    type Row = HistorialConfirmacionRow & Record<string, unknown>;

    const columns = useMemo(() => [
        {
            key: 'paciente',
            label: 'Paciente',
            width: '22%',
            render: (_: unknown, row: Row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#E6F8FB', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, color: '#0BC5DF',
                }}>
                {getInitials(row.paciente as string)}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>
                {row.paciente as string}
                </span>
                </div>
            ),
        },
        {
            key: 'fecha_envio',
            label: 'Fecha / hora de envío',
            width: '20%',
            render: (_: unknown, row: Row) => (
                <span style={{ fontSize: 13, color: '#5F656A' }}>
                {formatFechaHora(row.fecha_envio as string)}
                </span>
            ),
        },
        {
            key: 'fecha_respuesta',
            label: 'Fecha / hora de respuesta',
            width: '20%',
            render: (_: unknown, row: Row) => (
                <span style={{ fontSize: 13, color: row.fecha_respuesta ? '#5F656A' : '#D3D7DA' }}>
                {formatFechaHora(row.fecha_respuesta as string | null)}
                </span>
            ),
        },
        {
            key: 'respuesta',
            label: 'Respuesta del paciente',
            width: '18%',
            render: (_: unknown, row: Row) => (
                <RespuestaBadge respuesta={row.respuesta as RespuestaPaciente} />
            ),
        },
        {
            key: 'canal',
            label: 'Canal utilizado',
            width: '14%',
            render: (_: unknown, row: Row) => (
                <CanalBadge canal={row.canal as CanalRecordatorio | null} />
            ),
        },
    ], []);

    // -- Render -------------------------------------------------------------------------
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* -- KPIs -- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
            { label: 'Total registros',  value: stats.total,         color: '#0BC5DF', bg: '#E6F8FB' },
            { label: 'Confirmaciones',   value: stats.confirmados,   color: '#1D9E75', bg: '#ECFDF5' },
            { label: 'Cancelaciones',    value: stats.cancelados,    color: '#E24B4A', bg: '#FEF2F2' },
            { label: 'Sin respuesta',    value: stats.sin_respuesta, color: '#888F94', bg: '#F1F3F4' },
        ].map((kpi) => (
            <div key={kpi.label} style={{
                background: '#fff', border: '1px solid #D3D7DA', borderRadius: 12,
                padding: '14px 18px',
            }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            {kpi.label}
            </p>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 600, color: kpi.color }}>
            {kpi.value}
            </p>
            </div>
        ))}
        </div>

        {/* -- Barra de tasa de confirmación -- */}
        <div style={{
            background: '#fff', border: '1px solid #D3D7DA', borderRadius: 12,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <History size={15} style={{ color: '#0BC5DF' }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>
        Tasa de confirmación
        </span>
        </div>
        <div style={{ flex: 1, background: '#F1F3F4', borderRadius: 99, height: 8 }}>
        <div style={{
            width: `${tasaConfirmacion}%`, height: '100%',
            background: '#1D9E75', borderRadius: 99,
            transition: 'width 0.5s ease',
        }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#203F49', minWidth: 38, textAlign: 'right' }}>
        {tasaConfirmacion}%
        </span>
        </div>

        {/* -- Tabla -- */}
        <DataTable<Row>
        columns={columns}
        data={rows as Row[]}
        title="Historial de confirmaciones"
        description="Registro de todos los recordatorios enviados y sus respuestas"
        searchable
        searchPlaceholder="Buscar paciente..."
        searchKeys={['paciente']}
        filters={[
            {
                key: 'respuesta',
                placeholder: 'Respuesta',
                options: [
                    { value: 'Confirmó',      label: 'Confirmó'       },
                    { value: 'Canceló',       label: 'Canceló'        },
                    { value: 'Sin respuesta', label: 'Sin respuesta'  },
                ],
            },
            {
                key: 'canal',
                placeholder: 'Canal',
                options: [
                    { value: 'WhatsApp', label: 'WhatsApp' },
                    { value: 'SMS',      label: 'SMS'      },
                    { value: 'Correo',   label: 'Correo'   },
                ],
            },
        ]}
        secondaryActions={[
            {
                label: loading ? 'Cargando...' : 'Actualizar',
                icon: <RefreshCw size={14} />,
                onClick: fetchHistorial,
            },
            {
                label: 'Exportar CSV',
                icon: <Download size={14} />,
                onClick: () => ReminderService.exportCsv(),
            },
        ]}
        getRowKey={(row) => String(row.id)}
        pageSize={15}
        emptyMessage={
            loading ? 'Cargando historial...'
            : error  ? error
            : 'No hay registros en el historial.'
        }
        />
        </div>
    );
}
