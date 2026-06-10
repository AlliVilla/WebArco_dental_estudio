import { useState, useMemo, useEffect, useCallback } from 'react';
import { Bell, Send, RotateCcw, Phone, Mail, MessageCircle, Clock, RefreshCw, Plus, X} from 'lucide-react';
import { DataTable, FormSection, FullWidthField } from '../../../components';
import { Avatar, Button, Input, Select } from '../../../context';
import { ReminderService } from '../services/ReminderService';
import { formatDate } from '../../../utils/formatters';
import type { RecordatorioRow, CanalRecordatorio, EstadoEnvio } from '../types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RecordatoriosScreenProps {}

// ─── Helpers locales ──────────────────────────────────────────────────────────

const CANAL_CONFIG: Record<CanalRecordatorio, { icon: React.ReactNode; color: string; bg: string }> = {
  WhatsApp: { icon: <MessageCircle size={13} />, color: '#1D9E75', bg: '#ECFDF5' },
  SMS:      { icon: <Phone size={13} />,         color: '#EF9F27', bg: '#FFF8EC' },
  Correo:   { icon: <Mail size={13} />,          color: '#0BC5DF', bg: '#E6F8FB' },
};

const ESTADO_CONFIG: Record<EstadoEnvio, { color: string; bg: string; dot: string }> = {
  Pendiente: { color: '#EF9F27', bg: '#FFF8EC',  dot: '#EF9F27' },
  Enviado:   { color: '#1D9E75', bg: '#ECFDF5',  dot: '#1D9E75' },
  Error:     { color: '#E24B4A', bg: '#FEF2F2',  dot: '#E24B4A' },
};

function getInitials(nombre: string) {
  const [a, b] = nombre.trim().split(' ');
  return ((a?.[0] ?? '') + (b?.[0] ?? '')).toUpperCase();
}

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

// ─── Formulario modal ─────────────────────────────────────────────────────────

interface NuevoRecordatorioFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface FormState {
  id_cita: string;
  canal: CanalRecordatorio | '';
}

const FORM_INITIAL: FormState = { id_cita: '', canal: '' };

function NuevoRecordatorioForm({ open, onClose, onCreated }: NuevoRecordatorioFormProps) {
  const [form, setForm] = useState<FormState>(FORM_INITIAL);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function validate(): boolean {
    const next: Partial<FormState> = {};
    if (!form.id_cita.trim()) next.id_cita = 'Requerido';
    if (!form.canal)          next.canal   = 'Requerido' as CanalRecordatorio;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      await ReminderService.send({
        id_cita: Number(form.id_cita),
                                 canal: form.canal as CanalRecordatorio,
      });
      setForm(FORM_INITIAL);
      setErrors({});
      onCreated();
      onClose();
    } catch {
      setErrors({ id_cita: 'Error al crear el recordatorio. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setForm(FORM_INITIAL);
    setErrors({});
    onClose();
  }

  return (
    <div
    style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)',
          zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}
    onClick={handleClose}
    >
    <div
    style={{
      background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480,
      boxShadow: '0px 10px 30px rgba(0,0,0,0.15)', zIndex: 51,
          display: 'flex', flexDirection: 'column', gap: 0,
    }}
    onClick={(e) => e.stopPropagation()}
    >
    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 24px', borderBottom: '1px solid #F1F3F4',
    }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10, background: '#E6F8FB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
    <Bell size={18} style={{ color: '#0BC5DF' }} />
    </div>
    <div>
    <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#203F49' }}>
    Nuevo recordatorio
    </p>
    <p style={{ margin: 0, fontSize: 12, color: '#888F94' }}>
    Enviar recordatorio de cita al paciente
    </p>
    </div>
    </div>
    <button
    onClick={handleClose}
    style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#888F94', display: 'flex', alignItems: 'center', padding: 4,
    }}
    >
    <X size={18} />
    </button>
    </div>

    {/* Body */}
    <div style={{ padding: '20px 24px' }}>
    <FormSection title="Datos del recordatorio" icon={<Bell size={18} />} columns={1}>
    <FullWidthField>
    <Input
    label="ID de cita"
    badge="required"
    placeholder="Ej. 1042"
    type="number"
    value={form.id_cita}
    onChange={(e) => setForm((p) => ({ ...p, id_cita: e.target.value }))}
    error={errors.id_cita}
    />
    </FullWidthField>
    <FullWidthField>
    <Select
    label="Canal de envío"
    badge="required"
    placeholder="Selecciona un canal"
    value={form.canal}
    onChange={(v) => setForm((p) => ({ ...p, canal: v as CanalRecordatorio }))}
    error={errors.canal}
    options={[
      { value: 'WhatsApp', label: '💬 WhatsApp' },
      { value: 'SMS',      label: '📱 SMS'      },
      { value: 'Correo',   label: '✉️ Correo'   },
    ]}
    />
    </FullWidthField>
    </FormSection>
    </div>

    {/* Footer */}
    <div style={{
      display: 'flex', gap: 10, justifyContent: 'flex-end',
      padding: '16px 24px', borderTop: '1px solid #F1F3F4',
    }}>
    <Button variant="secondary" onClick={handleClose}>
    Cancelar
    </Button>
    <Button variant="primary" onClick={handleSubmit} loading={loading}>
    Enviar recordatorio
    </Button>
    </div>
    </div>
    </div>
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
    fetchQueue();
  }, [fetchQueue]);

  // Auto-refresh cada 24 horas
  useEffect(() => {
    const interval = setInterval(fetchQueue, 24 * 60 * 60 * 1000);
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
          <Avatar initials={getInitials(row.paciente as string)} size={32} />
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
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
