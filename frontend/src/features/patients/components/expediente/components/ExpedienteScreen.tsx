import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NuevaConsulta } from './NewConsultation';
import {
  Plus,
  ArrowLeft,
  Paperclip,
  CheckCircle,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Zap,
  X,
  FileText,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { DataTable, Column, StatsDrawer } from '../../../../../components';
import { Alert, Card, Button, Input } from '../../../../../context';

import {expedientService} from '../services/expedientService';
import {odontogramaService} from '../../odontograma/services/odontogramaService';
import {OdontogramScreen} from '../../odontograma/components/OdontogramaScreen';
import { GaleriaFotos } from './GaleriaFotos';
import {calcularEdad} from '../services/miscelaneousService';
import {ExpedientePaciente} from '../types/getAllPacientes';
import type {ConsultaHistorica} from '../types/getAllPacientes';
import api from '../../../../../services/api';
import { useResponsive } from '../../../../../hooks/useWindowWidth';
import { normalizeSearch } from '../../../../../utils/formatters';

const C = {
  primary: 'var(--arco-primary, #0BC5DF)',
  navy: 'var(--foreground, #203F49)',
  success: 'var(--arco-success, #1D9E75)',
  warning: 'var(--arco-warning, #EF9F27)',
  danger: 'var(--arco-danger, #E24B4A)',
  gray50: 'var(--background, #F8F9FA)',
  gray100: 'var(--arco-gray-100, #F1F3F4)',
  gray300: 'var(--border, #D3D7DA)',
  gray500: 'var(--muted-foreground, #888F94)',
  gray700: 'var(--arco-gray-700, #5F656A)',
  white: 'var(--card, #ffffff)',
  primaryBg: 'var(--accent, #E6F8FB)',
  primary008: 'rgba(11, 197, 223, 0.08)',
  primary015: 'rgba(11, 197, 223, 0.15)',
  primary025: 'rgba(11, 197, 223, 0.25)',
  primary04: 'rgba(11, 197, 223, 0.40)',
  primaryShadow: 'rgba(11, 197, 223, 0.16)',
};

const PAGE_SIZE = 10;

// ─── Card de paciente para móvil ──────────────────────────────────────────────
function PatientCard({ exp, onClick }: { exp: ExpedientePaciente; onClick: () => void }) {
  const hasPending = exp.consultas?.some((c) => !c.firma_paciente || !c.firma_doctor_snapshot);
  const nombre = [exp.primer_nombre, exp.segundo_nombre, exp.primer_apellido, exp.segundo_apellido].filter(Boolean).join(' ');
  const initials = `${exp.primer_nombre?.[0] ?? ''}${exp.primer_apellido?.[0] ?? ''}`.toUpperCase();
  return (
    <div onClick={onClick} style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.gray300}`, padding: 16, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.primary, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombre}</p>
            <p style={{ fontSize: 12, color: C.gray500, margin: '2px 0 0' }}>{exp.numero_identidad}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {hasPending ? (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: '#FFFBEB', color: '#D97706' }}>Pendiente</span>
          ) : (
            <CheckCircle size={16} color={C.success} />
          )}
          <ChevronRight size={16} color={C.gray500} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.gray500 }}>{(exp.consultas?.length ?? 0)} consulta{(exp.consultas?.length ?? 0) !== 1 ? 's' : ''} · {exp.telefono}</div>
    </div>
  );
}

function DrawerPatientList({ items, onSelectPatient }: { items: ExpedientePaciente[]; onSelectPatient: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () => !search ? items : items.filter((e) => {
      const nombre = [e.primer_nombre, e.segundo_nombre, e.primer_apellido, e.segundo_apellido].filter(Boolean).join(' ');
      return nombre.toLowerCase().includes(search.toLowerCase()) || e.numero_identidad.includes(search);
    }),
    [items, search],
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar paciente..."
        style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.gray300}`, borderRadius: 10, fontSize: 13, outline: 'none', color: C.navy, background: C.white, boxSizing: 'border-box' }}
      />
      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: C.gray500, fontSize: 13, margin: '24px 0' }}>No se encontraron pacientes.</p>
      ) : (
        filtered.map((exp) => (
          <PatientCard key={exp.id_persona} exp={exp} onClick={() => onSelectPatient(exp.id_persona)} />
        ))
      )}
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────────

export function ExpedienteScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [viewState, setViewState] = useState<'list' | 'detail' | 'new-consulta' | 'odontograma-view' | 'galeria'>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ nombre: string; url: string } | null>(null);
  const [expedientes, setExpedientes] = useState<ExpedientePaciente[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedConsultationForOdontogram, setSelectedConsultationForOdontogram] = useState<{
    id_consulta: number,
    patient: ExpedientePaciente
  } | null>(null);
  const [selectedConsultationForRespuestas, setSelectedConsultationForRespuestas] = useState<ConsultaHistorica | null>(null);

  const [openDrawer, setOpenDrawer] = useState<'visitas' | 'completadas' | 'firmas' | null>(null);

  // Paginación client-side
  const [currentPage, setCurrentPage] = useState(1);

  const pagedExpedientes = useMemo(
    () => expedientes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [expedientes, currentPage],
  );

  const handleTableParamsChange = useCallback((params: { page: number }) => {
    setCurrentPage(params.page);
  }, []);

  const selectedPatientFromQuery = useMemo(() => {
    const queryPatientId = new URLSearchParams(location.search).get('patientId');
    const parsedId = Number(queryPatientId);
    return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
  }, [location.search]);

  const loadPatients = useCallback(async (page: number, search = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await expedientService.getAll({page, limit: 1000, search, includeConsulta: true});
      if (res.success) {
        setExpedientes(res.data.data);
      } else {
        setError(res.message);
        setExpedientes([]);
      }
    } catch {
      setError('Error al cargar los expedientes');
      setExpedientes([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPatients(1);
  }, [loadPatients]);

  useEffect(() => {
    if (!selectedPatientFromQuery || expedientes.length === 0) return;
    if (expedientes.some((p) => p.id_persona === selectedPatientFromQuery)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPatientId(selectedPatientFromQuery);
      setViewState('detail');
    }
  }, [expedientes, selectedPatientFromQuery]);
  
  const totalConsultas = useMemo(
    () => expedientes.reduce((acc, exp) => acc + (exp.consultas?.length ?? 0), 0),
    [expedientes],
  );

  const kpiCols = isMobile || isTablet ? '1fr 1fr' : 'repeat(3, 1fr)';
  const showCards = isMobile || isTablet;

  const [mobileSearch, setMobileSearch] = useState('');
  const filteredExps = useMemo(
    () => !mobileSearch ? expedientes : expedientes.filter((e) => {
      const nombre = [e.primer_nombre, e.segundo_nombre, e.primer_apellido, e.segundo_apellido].filter(Boolean).join(' ');
      return normalizeSearch(nombre).includes(normalizeSearch(mobileSearch)) || e.numero_identidad.includes(mobileSearch) || e.telefono.includes(mobileSearch);
    }),
    [expedientes, mobileSearch],
  );

  const completadas = useMemo(
    () =>
      expedientes.reduce(
        (acc, exp) => acc + (exp.consultas?.filter((c) => c.fecha_fin).length ?? 0),
        0,
      ),
    [expedientes],
  );

  const firmasDigitales = useMemo(
    () =>
      expedientes.reduce(
        (acc, exp) =>
          acc + (exp.consultas?.filter((c) => c.firma_paciente && c.firma_doctor_snapshot).length ?? 0),
        0,
      ),
    [expedientes],
  );

  const drawerConfigs = [
    { key: 'visitas' as const, title: 'Total Consultas', subtitle: 'Todas las consultas registradas', value: totalConsultas, color: '#0BC5DF', border: 'rgba(11,197,223,0.24)', items: expedientes.filter((e) => (e.consultas?.length ?? 0) > 0) },
    { key: 'completadas' as const, title: 'Completadas', subtitle: 'Consultas completadas', value: completadas, color: '#1D9E75', border: 'rgba(29,158,117,0.24)', items: expedientes.filter((e) => (e.consultas?.filter((c) => c.fecha_fin).length ?? 0) > 0) },
    { key: 'firmas' as const, title: 'Firmas Digitales', subtitle: 'Consultas con firma completa', value: firmasDigitales, color: '#EF9F27', border: 'rgba(239,159,39,0.24)', items: expedientes.filter((e) => e.consultas?.some((c) => c.firma_paciente && c.firma_doctor_snapshot)) },
  ];

  const activePatient = expedientes.find((e) => e.id_persona === selectedPatientId);

  const [expandedConsultas, setExpandedConsultas] = useState<Record<number, boolean>>({});
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  useEffect(() => {
    if (activePatient?.consultas.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedConsultas({ [activePatient.consultas[0].id_consulta]: true });
    } else {
      setExpandedConsultas({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId]);

  const toggleConsulta = (consultaId: number) => {
    setExpandedConsultas((prev) => ({ ...prev, [consultaId]: !prev[consultaId] }));
  };

  const handleSelectPatient = (id: number) => {
    setSelectedPatientId(id);
    setViewState('detail');
  };

  const handleBackToList = () => {
    setViewState('list');
    loadPatients(1);
  };

  const handleNewConsultaSave = () => {
    loadPatients(1);
    setViewState('detail');
  };

  const handleNewConsultaBack = () => {
    setViewState('detail');
  };

  const handleViewOdontogram = (consultaId: number) => {
    if (!activePatient) return;
    setSelectedConsultationForOdontogram({ id_consulta: consultaId, patient: activePatient });
    setViewState('odontograma-view');
  };

  const handleBackFromOdontogram = () => {
    setViewState('detail');
    setSelectedConsultationForOdontogram(null);
  };

  const categoriaLabel = (categoria: string): string => {
    const parts = categoria.split(' ');
    return parts.length > 1 ? parts.slice(1).join(' ') : categoria;
  };

  const columns: Column<ExpedientePaciente>[] = [
    {
      key: 'nombre',
      label: 'Paciente',
      render: (_, row) => (
        <span
          onClick={() => handleSelectPatient(row.id_persona)}
          style={{ fontWeight: 600, color: C.primary, cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectPatient(row.id_persona); }}
          aria-label={`Ver expediente de ${[row.primer_nombre, row.segundo_nombre, row.primer_apellido, row.segundo_apellido].filter(Boolean).join(' ')}`}
        >
          {[row.primer_nombre, row.segundo_nombre, row.primer_apellido, row.segundo_apellido].filter(Boolean).join(' ')}
        </span>
      ),
    },
    { key: 'numero_identidad', label: 'Identidad' },
    { key: 'telefono', label: 'Teléfono' },
    {
      key: 'ultimaConsulta',
      label: 'Última Consulta',
      render: (_, row) => {
        const ultimaConsulta = row.consultas?.[0];
        return (
          <span style={{ fontWeight: 600, color: C.navy }}>
            {ultimaConsulta?.fecha_fin
              ? new Date(ultimaConsulta.fecha_fin).toLocaleDateString('es-HN')
              : ultimaConsulta?.fecha_inicio
                ? new Date(ultimaConsulta.fecha_inicio).toLocaleDateString('es-HN')
                : 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'totalConsultas',
      label: 'Consultas',
      align: 'center',
      render: (_, row) => (
        <span style={{ fontWeight: 600, color: C.navy }}>
          {row.consultas?.length ?? 0}
        </span>
      ),
    },
    {
      key: 'firmas',
      label: 'Firmas',
      render: (_, row) => {
        const hasPending = row.consultas?.some((c) => !c.firma_paciente || !c.firma_doctor_snapshot);
        if (hasPending) {
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500,
              background: 'rgba(239, 159, 39, 0.12)', color: C.warning,
            }}>
              Pendientes
            </span>
          );
        }
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500,
            background: '#E8F7F2', color: C.success,
          }}>
            <CheckCircle size={10} /> Al día
          </span>
        );
      },
    },
  ];

  const getRowActions = (row: ExpedientePaciente) => [
    {
      icon: <ChevronRight size={16} />,
      label: 'Ver Expediente',
      onClick: () => handleSelectPatient(row.id_persona),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#F8F9FA', minHeight: 'calc(100vh - 110px)', boxSizing: 'border-box' }}>
      {error ? <Alert variant="error" message={error} onClose={() => setError('')} /> : null}

      {/* ══ VISTA 1: Listado ════════════════════════════════════════════════ */}
      {viewState === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
          {/* KPIs clicables */}
          <div style={{ display: 'grid', gridTemplateColumns: kpiCols, gap: isMobile ? 10 : 16 }}>
            {drawerConfigs.map((kpi) => (
              <button key={kpi.key} onClick={() => setOpenDrawer(kpi.key)}
                style={{ border: `1.5px solid ${kpi.border}`, borderRadius: 12, padding: isMobile ? '14px 16px' : '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', cursor: 'pointer', background: C.white, textAlign: 'left', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: kpi.color, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{kpi.title}</span>
                <span style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.navy, marginTop: 8, lineHeight: 1 }}>{kpi.value}</span>
              </button>
            ))}
          </div>

          {/* Vista móvil/tablet: cards */}
          {showCards ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={mobileSearch} onChange={(e) => setMobileSearch(e.target.value)}
                placeholder="Buscar por nombre, identidad o teléfono..."
                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.gray300}`, borderRadius: 10, fontSize: 13, outline: 'none', color: C.navy, background: C.white, boxSizing: 'border-box' }}
              />
              {filteredExps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: C.gray500, fontSize: 13, border: `1px dashed ${C.gray300}`, borderRadius: 8 }}>
                  {mobileSearch ? 'No se encontraron pacientes con ese criterio.' : 'No hay pacientes registrados.'}
                </div>
              ) : (
                filteredExps.map((exp) => (
                  <PatientCard key={exp.id_persona} exp={exp} onClick={() => handleSelectPatient(exp.id_persona)} />
                ))
              )}
            </div>
          ) : (
            <DataTable<ExpedientePaciente>
              title="Expedientes Clínicos"
              description={loading ? 'Cargando pacientes registrados...' : `Total de ${expedientes.length} pacientes registrados`}
              emptyMessage={loading ? 'Cargando pacientes...' : 'No hay pacientes para mostrar.'}
              columns={columns}
              data={pagedExpedientes}
              searchable={true}
              totalRecords={expedientes?.length ?? 0}
              pageSize={PAGE_SIZE}
              isServerSide
              onServerParamsChange={handleTableParamsChange}
              searchPlaceholder="Buscar por nombre o número de identidad o teléfono..."
              searchKeys={['primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'numero_identidad', 'telefono']}
              getRowKey={(row) => String(row.id_persona)}
              rowActions={getRowActions}
            />
          )}
        </div>
      )}

      {/* ══ VISTA 2: Detalle ════════════════════════════════════════════════ */}
      {viewState === 'detail' && activePatient && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <Button
              onClick={handleBackToList}
              variant="ghost"
              size="sm"
              style={{ color: C.gray500 }}
            >
              <ArrowLeft size={16} /> Volver a expedientes
            </Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" size="sm" onClick={() => setViewState('galeria')}>
                <ImageIcon size={16} /> Galería de Fotos
              </Button>
              <Button onClick={() => setViewState('new-consulta')} variant="primary" size="sm">
                <Plus size={16} /> Registrar Nueva Consulta
              </Button>
            </div>
          </div>

          {/* Perfil del paciente */}
          <Card style={{ padding: isMobile ? 16 : 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
            <div style={{ display: 'flex', gap: isMobile ? 12 : 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div
                aria-label="Iniciales del paciente"
                style={{
                  width: isMobile ? 52 : 72,
                  height: isMobile ? 52 : 72,
                  borderRadius: '50%',
                  background: C.primary,
                  color: C.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? 18 : 22,
                  fontWeight: 700,
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(11, 197, 223, 0.16)'
                }}
              >
                {`${activePatient.primer_nombre?.[0] || ''}${activePatient.primer_apellido?.[0] || ''}`.toUpperCase() || 'P'}
              </div>

              <div style={{ flex: 1, minWidth: isMobile ? 200 : 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 20, fontWeight: 700, color: C.navy }}>
                    {[activePatient.primer_nombre, activePatient.segundo_nombre, activePatient.primer_apellido, activePatient.segundo_apellido].filter(Boolean).join(' ')}
                  </h2>
                  <span style={{
                    background: C.primaryBg,
                    border: `1px solid ${C.primary}40`,
                    color: C.primary,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: 20,
                    letterSpacing: '0.5px',
                  }}>
                    # PAC-{String(activePatient.id_persona).padStart(6, '0')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: 13, color: C.gray700, marginTop: 8, alignItems: 'center' }}>
                  <span>{calcularEdad(activePatient.fecha_nacimiento)} años · {activePatient.sexo === 'F' ? 'Femenino' : 'Masculino'}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span>+504 {activePatient.telefono}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span>{activePatient.correo_electronico}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span>{activePatient.municipio?.departamento?.nombre ? `${activePatient.municipio.nombre}, ${activePatient.municipio.departamento.nombre}` : activePatient.municipio?.nombre || ''}</span>
                </div>

                <div style={{ fontSize: 13, color: C.gray700, marginTop: 8 }}>
                  Última consulta: {
                    activePatient.consultas?.[0]?.fecha_fin
                      ? new Date(activePatient.consultas[0].fecha_fin).toLocaleString('es-HN')
                      : activePatient.consultas?.[0]?.fecha_inicio
                        ? new Date(activePatient.consultas[0].fecha_inicio).toLocaleString('es-HN')
                        : 'N/A'
                  }
                </div>
              </div>
            </div>
          </Card>

          {/* Historial de consultas */}
          <div>
            <h3 style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: C.navy, marginBottom: 16 }}>Historial de Consultas</h3>

            {activePatient?.consultas.length === 0 ? (
              <div style={{ border: `2px dashed ${C.primary}`, borderRadius: 12, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, background: C.primary008 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.primary, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Sin Consultas Registradas
                </span>
                <span style={{ fontSize: 12, color: C.gray500, textAlign: 'center' }}>
                  El cliente no tiene ninguna consulta realizada
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activePatient.consultas.map((visit) => {
                  const isExpanded = !!expandedConsultas[visit.id_consulta];
                  return (
                    <div
                      key={visit.id_consulta}
                      style={{
                        background: C.white,
                        borderRadius: 12,
                        border: `1.5px solid ${
                          isExpanded
                            ? C.primary
                            : hoveredCardId === visit.id_consulta
                              ? C.primary04
                              : C.gray300
                        }`,
                        padding: isMobile ? '14px 16px' : '20px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
                        boxShadow: isExpanded ? '0 10px 20px -5px rgba(11, 197, 223, 0.08), 0 4px 6px -2px rgba(11, 197, 223, 0.04)' : hoveredCardId === visit.id_consulta ? '0 4px 12px rgba(0, 0, 0, 0.04)' : 'none',
                        transform: hoveredCardId === visit.id_consulta ? 'translateY(-2px)' : 'none',
                      }}
                      onMouseEnter={() => setHoveredCardId(visit.id_consulta)}
                      onMouseLeave={() => setHoveredCardId(null)}
                    >
                      <div
                        onClick={() => toggleConsulta(visit.id_consulta)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleConsulta(visit.id_consulta); }}
                        aria-label={isExpanded ? 'Colapsar detalles de la consulta' : 'Expandir detalles de la consulta'}
                        aria-expanded={isExpanded}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          userSelect: 'none',
                          paddingBottom: isExpanded ? 16 : 0,
                          borderBottom: isExpanded ? `1.5px solid ${C.gray100}` : '1.5px solid transparent',
                          transition: 'padding-bottom 0.25s, border-bottom-color 0.25s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            aria-label={isExpanded ? 'Consulta expandida' : 'Consulta colapsada'}
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: isExpanded ? C.primary : C.gray300,
                              transition: 'background 0.25s',
                              boxShadow: isExpanded ? '0 0 8px rgba(11, 197, 223, 0.6)' : 'none',
                            }}
                          />
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
                            {visit.fecha_fin
                              ? new Date(visit.fecha_fin).toLocaleDateString('es-HN')
                              : visit.fecha_inicio
                                ? new Date(visit.fecha_inicio).toLocaleDateString('es-HN')
                                : 'N/A'}
                          </span>
                          <span style={{ fontSize: 13, color: C.gray500 }}>
                            · Atendido por: <strong style={{ color: C.navy, fontWeight: 600 }}>{visit.doctor?.persona ? `${visit.doctor.persona.primer_nombre} ${visit.doctor.persona.primer_apellido}` : `#${visit.id_usuario}`}</strong>
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {visit.firma_paciente && visit.firma_doctor_snapshot ? (
                              <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: 12,
                                background: C.primaryBg,
                                color: C.primary,
                                border: `1px solid ${C.primary}33`,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}>
                                Firmado
                              </span>
                            ) : (
                              <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: 12,
                                background: '#FFFBEB',
                                color: '#D97706',
                                border: '1px solid rgba(217, 119, 6, 0.2)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}>
                                Firma Pendiente
                              </span>
                            )}
                          </div>
                          <div style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            color: isExpanded ? C.primary : C.gray500,
                            display: 'flex',
                            alignItems: 'center',
                          }}>
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </div>

                      <div
                          aria-hidden={!isExpanded}
                          style={{
                            maxHeight: isExpanded ? '3000px' : '0px',
                            opacity: isExpanded ? 1 : 0,
                            overflow: 'hidden',
                            transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                            paddingTop: isExpanded ? 16 : 0,
                          }}
                        >
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleViewOdontogram(visit.id_consulta)}
                              style={{ fontSize: 12 }}
                            >
                              <Zap size={14} /> Ver Odontograma de la Consulta
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setSelectedConsultationForRespuestas(visit)}
                              style={{
                                fontSize: 12,
                                background: 'linear-gradient(135deg, var(--arco-primary, #0BC5DF), #08a3b9)',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(11, 197, 223, 0.35)',
                              }}
                            >
                              <FileText size={14} /> Ver Formulario
                            </Button>

                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: 20,
                            background: C.gray50,
                            borderRadius: 10,
                            padding: 20,
                            border: `1px solid ${C.gray100}`,
                          }}>
                          <div>
                            <div style={{ fontSize: 11, color: C.gray500, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Motivo de consulta</div>
                            <div style={{ fontSize: 13.5, color: C.navy, marginTop: 6, fontWeight: 500, lineHeight: 1.5 }}>{visit.motivo}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: C.gray500, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Diagnóstico de evolución</div>
                            <div style={{ fontSize: 13.5, color: C.navy, marginTop: 6, lineHeight: 1.5 }}>{visit.diagnostico}</div>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: 11, color: C.gray500, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Notas clínicas</div>
                            <div style={{ fontSize: 13.5, color: C.gray700, marginTop: 6, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{visit.notas}</div>
                          </div>
                        </div>

                        {(visit.tratamientos?.length > 0 || visit.tratamiento) && (
                          <div style={{
                            background: C.white,
                            borderRadius: 10,
                            padding: 18,
                            border: `1.5px solid ${C.primary015}`,
                            boxShadow: '0 2px 8px rgba(11, 197, 223, 0.03)',
                          }}>
                            <div style={{
                              fontSize: 12,
                              color: C.primary,
                              fontWeight: 700,
                              marginBottom: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              <DollarSign size={14} /> Tratamientos realizados
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {visit.tratamientos?.map((t, idx) => {
                                const discount = Number(t.descuento || 0);
                                const finalPrice = Number(t.precio) - discount;
                                return (
                                  <div key={idx} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13,
                                    color: C.navy, paddingBottom: 8, borderBottom: `1px solid ${C.gray100}`,
                                  }}>
                                    <span style={{ fontWeight: 500 }}>{t.tratamiento.nombre}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      {discount > 0 ? (
                                        <>
                                          <span style={{ fontSize: 11, color: C.gray500, textDecoration: 'line-through' }}>
                                            L. {Number(t.precio).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                          </span>
                                          <span style={{ fontWeight: 600, color: C.success }}>
                                            L. {finalPrice.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                          </span>
                                          <span style={{ fontSize: 10, fontWeight: 700, color: C.danger, background: 'rgba(226, 75, 74, 0.1)', padding: '1px 6px', borderRadius: 4 }}>
                                            -L.{discount.toLocaleString('es-HN')}
                                          </span>
                                        </>
                                      ) : (
                                        <span style={{ fontWeight: 600, color: C.navy }}>
                                          L. {Number(t.precio).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                              {visit.tratamiento && (!visit.tratamientos || visit.tratamientos.length === 0) && (
                                <div style={{ fontSize: 12.5, color: C.gray700, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                                  {visit.tratamiento}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {visit.archivos?.length > 0 && (
                          <div>
                            <div style={{
                              fontSize: 11, color: C.gray500, fontWeight: 700,
                              textTransform: 'uppercase', letterSpacing: '0.8px',
                              marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                              Archivos y Radiografías Adjuntas
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {visit.archivos.map((archivo, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: C.white, border: `1.5px solid ${C.gray100}`,
                                    borderRadius: 8, padding: '8px 14px', fontSize: 12.5,
                                    color: C.navy, boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                    transition: 'border-color 0.2s', cursor: 'pointer',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primary; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.gray100; }}
                                  onClick={() => setSelectedImage({ nombre: archivo.nombre, url: archivo.url })}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedImage({ nombre: archivo.nombre, url: archivo.url }); }}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`Archivo adjunto: ${archivo.nombre}`}
                                >
                                  <Paperclip size={13} color={C.gray500} />
                                  <span style={{ fontWeight: 500 }}>{archivo.nombre}</span>
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, background: C.primaryBg,
                                    color: C.primary, padding: '2px 8px', borderRadius: 4,
                                    marginLeft: 4, textTransform: 'uppercase',
                                  }}>
                                    {categoriaLabel(archivo.categoria)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ VISTA 3: Nueva Consulta ════════════════════════════════════════════ */}
      {viewState === 'new-consulta' && activePatient && (
        <NuevaConsulta
          patient={activePatient}
          onBack={handleNewConsultaBack}
          onSave={handleNewConsultaSave}
        />
      )}

      {/* ══ VISTA 4: Ver Odontograma de Consulta ════════════════════════════════ */}
      {viewState === 'odontograma-view' && selectedConsultationForOdontogram && (
        <div style={{ background: '#F8F9FA', minHeight: 'calc(100vh - 110px)', boxSizing: 'border-box', padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 8px' }}>
            <Button onClick={handleBackFromOdontogram} variant="ghost" size="sm" style={{ color: C.gray500 }}>
              <ArrowLeft size={16} /> Volver al expediente
            </Button>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>
              Odontograma de la Consulta — {selectedConsultationForOdontogram.patient.primer_nombre} {selectedConsultationForOdontogram.patient.primer_apellido}
            </div>
            <div style={{ width: 120 }} />
          </div>
          <OdontogramScreen
            isEmbedded={true}
            isReadOnly={true}
            consultaId={selectedConsultationForOdontogram.id_consulta}
            patientId={selectedConsultationForOdontogram.patient.id_persona}
            patientName={`${selectedConsultationForOdontogram.patient.primer_nombre} ${selectedConsultationForOdontogram.patient.primer_apellido}`}
            patientIdentidad={selectedConsultationForOdontogram.patient.numero_identidad}
            initialDentition={calcularEdad(selectedConsultationForOdontogram.patient.fecha_nacimiento) < 12 ? 'child' : 'adult'}
            onCancelEmbedded={handleBackFromOdontogram}
          />
        </div>
      )}

      {/* ══ VISTA 5: Galería de Fotos ════════════════════════════════════════════ */}
      {viewState === 'galeria' && activePatient && (
        <GaleriaFotos
          pacienteId={activePatient.id_persona}
          pacienteNombre={[activePatient.primer_nombre, activePatient.primer_apellido].filter(Boolean).join(' ')}
          consultas={activePatient.consultas}
          onBack={() => setViewState('detail')}
        />
      )}


      {selectedImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }} onClick={() => setSelectedImage(null)}>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            style={{
              position: 'absolute', top: 16, right: 16,
              backgroundColor: 'rgba(255, 255, 255, 0.1)', border: 'none',
              borderRadius: 8, padding: '8px', color: 'white',
              fontSize: '24px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
          <h3 style={{ color: 'white', marginBottom: '16px', textAlign: 'center' }}>
            {selectedImage.nombre}
          </h3>
          <img
            src={`${api.defaults.baseURL}/upload/${encodeURIComponent(selectedImage.url)}`}
            alt={selectedImage.nombre}
            style={{
              maxWidth: '90%', maxHeight: '80%', objectFit: 'contain',
              borderRadius: 8
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`${api.defaults.baseURL}/upload/${encodeURIComponent(selectedImage.url)}`, '_blank');
            }}
            style={{
              marginTop: '16px', backgroundColor: C.primary, color: 'white',
              border: 'none', borderRadius: 8, padding: '8px 16px',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Abrir en nueva pestaña
          </button>
        </div>
      )}

      {/* Drawers de KPIs */}
      {drawerConfigs.map(({ key, title, subtitle, items }) => (
        <StatsDrawer
          key={key}
          open={openDrawer === key}
          onClose={() => setOpenDrawer(null)}
          title={title}
          subtitle={subtitle}
        >
          <DrawerPatientList items={items} onSelectPatient={(patientId) => { setOpenDrawer(null); handleSelectPatient(patientId); }} />
        </StatsDrawer>
      ))}

      {/* Respuestas Viewer Modal */}
      {selectedConsultationForRespuestas && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setSelectedConsultationForRespuestas(null)}>
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '20px 24px',
              background: 'linear-gradient(135deg, var(--arco-primary, #0BC5DF), #08a3b9)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  Formulario de la Consulta
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2, opacity: 0.9 }}>
                  {selectedConsultationForRespuestas.fecha_inicio
                    ? new Date(selectedConsultationForRespuestas.fecha_inicio).toLocaleDateString('es-HN')
                    : 'N/A'}
                </div>
              </div>
              <button
                onClick={() => setSelectedConsultationForRespuestas(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'white',
                  borderRadius: 8,
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedConsultationForRespuestas.respuestas?.length === 0 ? (
                <div style={{ textAlign: 'center', color: C.gray500, padding: '20px' }}>
                  No hay respuestas registradas para esta consulta.
                </div>
              ) : (
                selectedConsultationForRespuestas.respuestas?.map((respuesta, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: `1.5px solid ${C.gray100}`,
                      borderRadius: 10,
                      padding: '16px',
                      background: C.gray50,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 10 }}>
                      {respuesta.pregunta?.pregunta || `Pregunta #${respuesta.id_pregunta}`}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {respuesta.respuesta_boolean !== null && respuesta.respuesta_boolean !== undefined && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 12,
                          fontSize: 11,
                          fontWeight: 700,
                          background: respuesta.respuesta_boolean ? 'rgba(29, 158, 117, 0.1)' : 'rgba(226, 75, 74, 0.1)',
                          color: respuesta.respuesta_boolean ? C.success : C.danger,
                          width: 'fit-content'
                        }}>
                          {respuesta.respuesta_boolean ? 'Sí' : 'No'}
                        </div>
                      )}
                      {respuesta.explanation && (
                        <div style={{
                          fontSize: 12.5,
                          color: C.gray700,
                          lineHeight: 1.5,
                          background: C.white,
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1px solid ${C.gray100}`,
                        }}>
                          {respuesta.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${C.gray100}`,
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedConsultationForRespuestas(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}