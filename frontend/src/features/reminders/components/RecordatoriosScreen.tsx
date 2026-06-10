import { useState, useMemo, useEffect, useCallback } from 'react';
import {  Send, RotateCcw, Clock, RefreshCw, Plus } from 'lucide-react';
import { DataTable } from '../../../components';
import { Avatar } from '../../../context';
import { ReminderService } from '../services/ReminderService';
import { formatDate, formatInitials } from '../../../utils/formatters';
import type { RecordatorioRow, CanalRecordatorio, EstadoEnvio } from '../types';
import { CANAL_CONFIG, ESTADO_CONFIG } from '../utils/badgeConfigs';
import { NuevoRecordatorioForm } from './NuevoRecordatorioForm';

const AUTO_REFRESH_INTERVAL = 24 * 60 * 60 * 1000

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RecordatoriosScreenProps {}

function formatHoraCita(iso: string) {
  return new Date(iso).toLocaleTimeString('es-HN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function estaEnProximas24h(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

// ─── Badge de canal ───────────────────────────────────────────────────────────

function CanalBadge({ canal }: { canal: CanalRecordatorio }) {
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

// ─── Badge de estado de envío ─────────────────────────────────────────────────

function EstadoEnvioBadge({ estado }: { estado: EstadoEnvio }) {
  const cfg = ESTADO_CONFIG[estado];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: 8,
      fontSize: 11, fontWeight: 600,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.dot, flexShrink: 0,
      }} />
      {estado}
    </span>
  );
}

// ─── Badge de urgencia ────────────────────────────────────────────────────────

function UrgenteBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: '#FEF2F2', color: '#E24B4A',
      padding: '2px 7px', borderRadius: 6,
      fontSize: 10, fontWeight: 600,
      letterSpacing: '0.3px',
    }}>
      <Clock size={10} /> 24 h
    </span>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export function RecordatoriosScreen(_props: RecordatoriosScreenProps) {
  const [rows, setRows] = useState<RecordatorioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    try {
      setError(null);
      const res = await ReminderService.getQueue();
      if (res.success) {
        // Ordenar: próximas 24 h primero, luego por hora de cita ascendente
        const sorted = [...res.data].sort((a, b) => {
          if (a.es_proximas_24h !== b.es_proximas_24h) return a.es_proximas_24h ? -1 : 1;
          return new Date(a.hora_cita).getTime() - new Date(b.hora_cita).getTime();
        });
        setRows(sorted);
        setLastSync(new Date());
      }
    } catch {
      setError('No se pudo cargar la lista de recordatorios.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    const id = 'reminders-spin-keyframe';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }, [fetchQueue]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Auto-refresh cada 24 horas
  useEffect(() => {
    const interval = setInterval(fetchQueue, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // ── Acciones de fila ────────────────────────────────────────────────────────
  async function handleSend(row: RecordatorioRow) {
    setActionLoadingId(row.id);
    try {
      await ReminderService.send({ id_cita: row.id_cita, canal: row.canal });
      setRows((prev) =>
        prev.map((r) => r.id === row.id ? { ...r, estado_envio: 'Enviado' } : r)
      );
    } catch {
      setRows((prev) =>
        prev.map((r) => r.id === row.id ? { ...r, estado_envio: 'Error' } : r)
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRetry(row: RecordatorioRow) {
    setActionLoadingId(row.id);
    try {
      await ReminderService.retry(row.id);
      setRows((prev) =>
        prev.map((r) => r.id === row.id ? { ...r, estado_envio: 'Enviado' } : r)
      );
    } catch {
      // Estado permanece en Error para reintento posterior
    } finally {
      setActionLoadingId(null);
    }
  }

  // ── Estadísticas rápidas ────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     rows.length,
    pendientes: rows.filter((r) => r.estado_envio === 'Pendiente').length,
    enviados:  rows.filter((r) => r.estado_envio === 'Enviado').length,
    errores:   rows.filter((r) => r.estado_envio === 'Error').length,
    urgentes:  rows.filter((r) => r.es_proximas_24h).length,
  }), [rows]);

  // ── Columnas ────────────────────────────────────────────────────────────────
  type Row = RecordatorioRow & Record<string, unknown>;

  const columns = useMemo(() => [
    {
      key: 'paciente',
      label: 'Paciente',
      width: '25%',
      render: (_: unknown, row: Row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={formatInitials(row.paciente as string)} size={32} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>
              {row.paciente as string}
            </span>
            {row.es_proximas_24h && <UrgenteBadge />}
          </div>
        </div>
      ),
    },
    {
      key: 'contacto',
      label: 'Contacto',
      width: '18%',
      render: (_: unknown, row: Row) => (
        <span style={{ fontSize: 13, color: '#5F656A' }}>{row.contacto as string}</span>
      ),
    },
    {
      key: 'canal',
      label: 'Canal',
      width: '12%',
      render: (_: unknown, row: Row) => <CanalBadge canal={row.canal as CanalRecordatorio} />,
    },
    {
      key: 'hora_cita',
      label: 'Hora de cita',
      width: '16%',
      render: (_: unknown, row: Row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>
            {formatHoraCita(row.hora_cita as string)}
          </span>
          <span style={{ fontSize: 11, color: '#888F94' }}>
            {formatDate(row.hora_cita as string)}
          </span>
        </div>
      ),
    },
    {
      key: 'estado_envio',
      label: 'Estado de envío',
      width: '14%',
      render: (_: unknown, row: Row) => <EstadoEnvioBadge estado={row.estado_envio as EstadoEnvio} />,
    },
  ], []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Pendientes', value: stats.pendientes, color: '#EF9F27', bg: '#FFF8EC' },
          { label: 'Enviados',   value: stats.enviados,   color: '#1D9E75', bg: '#ECFDF5' },
          { label: 'Con error',  value: stats.errores,    color: '#E24B4A', bg: '#FEF2F2' },
          { label: 'Próximas 24 h', value: stats.urgentes, color: '#0BC5DF', bg: '#E6F8FB' },
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

      {/* ── Info de última sincronización ── */}
      {lastSync && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#888F94' }}>
          <RefreshCw size={11} />
          Última actualización: {lastSync.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
          &nbsp;· Se actualiza automáticamente cada 24 horas
        </div>
      )}

      {/* ── Tabla ── */}
      <DataTable<Row>
        columns={columns}
        data={rows as Row[]}
        title="Cola de recordatorios"
        description="Citas con recordatorio pendiente de envío"
        searchable
        searchPlaceholder="Buscar paciente o contacto..."
        searchKeys={['paciente', 'contacto']}
        primaryAction={{
          label: 'Nuevo recordatorio',
          icon: <Plus size={16} />,
          onClick: () => setModalOpen(true),
        }}
        filters={[
          {
            key: 'estado_envio',
            placeholder: 'Estado de envío',
            options: [
              { value: 'Pendiente', label: 'Pendiente' },
              { value: 'Enviado',   label: 'Enviado' },
              { value: 'Error',     label: 'Error' },
            ],
          },
          {
            key: 'canal',
            placeholder: 'Canal',
            options: [
              { value: 'WhatsApp', label: 'WhatsApp' },
              { value: 'SMS',      label: 'SMS' },
              { value: 'Correo',   label: 'Correo' },
            ],
          },
        ]}
        secondaryActions={[
          {
            label: loading ? 'Actualizando...' : 'Actualizar',
            icon: <RefreshCw size={14} />,
            onClick: fetchQueue,
          },
        ]}
        rowActions={(row) => {
          const isLoading = actionLoadingId === row.id;
          if (row.estado_envio === 'Pendiente') {
            return [{
              icon: isLoading
                ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <Send size={16} />,
              label: 'Enviar recordatorio',
              onClick: (r) => handleSend(r as RecordatorioRow & Record<string, unknown>),
            }];
          }
          if (row.estado_envio === 'Error') {
            return [{
              icon: isLoading
                ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <RotateCcw size={16} />,
              label: 'Reintentar envío',
              onClick: (r) => handleRetry(r as RecordatorioRow & Record<string, unknown>),
              danger: false,
            }];
          }
          return [];
        }}
        getRowKey={(row) => String(row.id)}
        pageSize={15}
        emptyMessage={
          loading
            ? 'Cargando recordatorios...'
            : error
            ? error
            : 'No hay recordatorios pendientes.'
        }
      />

      {/* ── Modal nuevo recordatorio ── */}
      <NuevoRecordatorioForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchQueue}
      />


      {/* Spinner keyframe (solo necesario una vez en el DOM) */}
    </div>
  );
}
