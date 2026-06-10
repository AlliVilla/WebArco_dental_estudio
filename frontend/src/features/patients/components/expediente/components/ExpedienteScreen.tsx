/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { NuevaVisita } from './NewVisit';
import {
  Plus,
  ArrowLeft,
  Paperclip,
  CheckCircle,
  DollarSign,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { DataTable, Column } from '../../../../../components';
import { Alert, Card, Button, useTheme } from '../../../../../context';

import {expedientService} from '../services/expedientService';
import {calcularEdad} from '../services/miscelaneousService';
import {ExpedientePaciente} from '../types/index';

// ── Colors matching the Design System (using variables for theme compatibility) ──
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
};


const formatLastVisitDate = (dateStr?: string) => {
  if (!dateStr) return 'Sin visitas registradas';
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthName = months[monthIndex] || '';
    return `${day} de ${monthName} de ${year}`;
  }
  return dateStr;
};

const getAlertBadges = (patient: ExpedientePaciente) => {
  const badges: { text: string; color: string; border: string; bg: string }[] = [];

  const addBadge = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (lower === 'ninguna' || lower === 'ninguno' || lower === 'ninguno relevante') return;

    if (lower.includes('alergia') || lower.includes('alérgica') || lower.includes('alérgico')) {
      badges.push({
        text: trimmed,
        color: '#E11D48',
        border: '#FECDD3',
        bg: '#FFF1F2'
      });
    } else if (lower.includes('anestesia') || lower.includes('reacción') || lower.includes('reaccion')) {
      badges.push({
        text: trimmed,
        color: '#EA580C',
        border: '#FFEDD5',
        bg: '#FFF7ED'
      });
    } else {
      badges.push({
        text: trimmed,
        color: '#B45309',
        border: '#FDE68A',
        bg: '#FFFBEB'
      });
    }
  };

  if (patient.enfermedadBase) {
    patient.enfermedadBase.split(',').forEach(addBadge);
  }
  if (patient.alergias) {
    patient.alergias.split(',').forEach(addBadge);
  }

  return badges;
};

export function ExpedienteScreen() {
  useTheme();
  const [viewState, setViewState] = useState<'list' | 'detail' | 'new-visit'>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [expedientes, setExpedientes] = useState<ExpedientePaciente[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  

  const loadPatients = useCallback(async (page: number, search = "") => {
    setLoading(true);
    const res = await expedientService.getAll({page,search,includeConsulta: true});
    console.log(res);
    if(res.success){
      setExpedientes(res.data.data);
    }else {
      setError(res.message);
    }
    setLoading(false);
  },[]);

  useEffect(() =>{
    loadPatients(1);
  },[]);
  
  const totalVisitas = useMemo(() => {
    return expedientes.reduce(
      (acc, exp) => acc + (exp.totalVisitas ?? 0),
      0
    );
  }, [expedientes]);

  const completadas = useMemo(() => {
    return expedientes.reduce(
      (acc, exp) => acc + (exp.consultas?.length ?? 0),
      0
    );
  }, [expedientes]);

  const firmasDigitales = useMemo(() => {
    return expedientes.reduce(
      (acc, exp) =>
        acc +
        (exp.consultas?.filter(
          (c) => c.firma_paciente && c.firma_doctor_snapshot
        ).length ?? 0),
      0
    );
  }, [expedientes]);

  // Find currently active patient object
  const activePatient = expedientes.find(e => e.id_persona === selectedPatientId);

  const [expandedVisits, setExpandedVisits] = useState<Record<number, boolean>>({});
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  useEffect(() => {
    if (activePatient && activePatient.consultas.length > 0) {
      // Expand the most recent visit by default
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpandedVisits({ [activePatient.consultas[0].id_consulta]: true });
    } else {
      setExpandedVisits({});
    }
  }, [selectedPatientId, activePatient]);

  const toggleVisit = (visitId: number) => {
    setExpandedVisits(prev => ({
      ...prev,
      [visitId]: !prev[visitId]
    }));
  };

  const handleSelectPatient = (id: number) => {
    setSelectedPatientId(id);
    setViewState('detail');
  };

  const handleNewVisitSave = () => {
    setViewState('detail');
  };

  const handleNewVisitBack = () => {
    setViewState('detail');
  };

  const columns: Column<ExpedientePaciente>[] = [
    {
      key: 'nombre',
      label: 'Paciente',
      render: (_, row) => (
        <span
          onClick={() => handleSelectPatient(row.id_persona)}
          style={{ fontWeight: 600, color: 'var(--arco-primary, #0BC5DF)', cursor: 'pointer' }}
        >
          {[row.primer_nombre,row.segundo_nombre,row.primer_apellido,row.segundo_apellido].filter(Boolean).join(' ')}
        </span>
      ),
    },
    {
      key: 'numero_identidad',
      label: 'Identidad',
    },
    {
      key: 'telefono',
      label: 'Teléfono',
    },
    {
      key: 'ultimaVisita',
      label: 'Última Visita',
      render: (_, row) => {
        const ultimaConsulta = row.consultas?.[0];

        return (
          <span style={{ fontWeight: 600, color: 'var(--foreground, #203F49)' }}>
            {ultimaConsulta?.fecha_fin ?? 'N/A'}
          </span>
        );
      }
    },
    {
      key: 'totalVisitas',
      label: 'Visitas',
      align: 'center',
      render: (_, row) => (
        <span style={{ fontWeight: 600, color: 'var(--foreground, #203F49)' }}>
          {row.consultas.length}
        </span>
      ),
    },
    {
      key: 'firmas',
      label: 'Firmas',
      render: (_, row) => {
        const hasPending = row.consultas.some(c => !c.firma_paciente || !c.firma_doctor_snapshot);
        if (hasPending) {
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500,
              background: 'rgba(239, 159, 39, 0.12)', color: 'var(--arco-warning, #EF9F27)'
            }}>
              Pendientes
            </span>
          );
        }
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500,
            background: '#E8F7F2', color: 'var(--arco-success, #1D9E75)'
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

  return (
    <div style={{ background: '#F8F9FA', minHeight: 'calc(100vh - 110px)', boxSizing: 'border-box' }}>
      {error ? <Alert variant="error" message={error} onClose={() => setError("")} /> : null}
      {/* ══════════════════════════════════════════════════════════════════
          VISTA 1: Listado de Expedientes Clínicos
      ══════════════════════════════════════════════════════════════════ */}
      {viewState === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tarjetas de Estadísticas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {/* Total Visitas */}
            <Card style={{
              border: '1.5px solid rgba(11, 197, 223, 0.24)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--arco-primary, #0BC5DF)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Total Visitas
              </span>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--foreground, #203F49)', marginTop: 8, lineHeight: 1 }}>
                {totalVisitas}
              </span>
            </Card>

            {/* Completadas */}
            <Card style={{
              border: '1.5px solid rgba(29, 158, 117, 0.24)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--arco-success, #1D9E75)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Completadas
              </span>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--foreground, #203F49)', marginTop: 8, lineHeight: 1 }}>
                {completadas}
              </span>
            </Card>

            {/* Firmas Digitales */}
            <Card style={{
              border: '1.5px solid rgba(239, 159, 39, 0.24)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--arco-warning, #EF9F27)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Firmas Digitales
              </span>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--foreground, #203F49)', marginTop: 8, lineHeight: 1 }}>
                {firmasDigitales}
              </span>
            </Card>
          </div>

          <DataTable<ExpedientePaciente>
            title="Expedientes Clínicos"
            description={
              loading
                ? "Cargando pacientes registrados..."
                  : `Total de ${expedientes.length} pacientes registrados`
            }
             emptyMessage={loading ? "Cargando pacientes..." : "No hay pacientes para mostrar."}  
            columns={columns}
            data={expedientes}
            searchable={true}
            searchPlaceholder="Buscar por nombre o número de identidad..."
            searchKeys={['nombre', 'numero_identidad']}
            getRowKey={(row) => String(row.id_persona)}
            rowActions={getRowActions}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VISTA 2: Detalle de Expediente del Paciente
      ══════════════════════════════════════════════════════════════════ */}
      {viewState === 'detail' && activePatient && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <Button
              onClick={() => setViewState('list')}
              variant="ghost"
              size="sm"
              style={{ color: C.gray500 }}
            >
              <ArrowLeft size={16} /> Volver a expedientes
            </Button>
            <Button
              onClick={() => setViewState('new-visit')}
              variant="primary"
              size="sm"
            >
              <Plus size={16} /> Registrar Nueva Visita
            </Button>
          </div>

          {/* Patient Profile Section */}
          <Card style={{
            padding: 24,
            borderRadius: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar Circle */}
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#0BC5DF',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 700,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(11, 197, 223, 0.16)'
              }}>
                {`${activePatient.primer_nombre?.[0] || ''}${activePatient.primer_apellido?.[0] || ''}`.toUpperCase() || 'P'}
              </div>

              {/* Profile Info details */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#203F49' }}>
                    {[activePatient.primer_nombre,activePatient.segundo_nombre,activePatient.primer_apellido,activePatient.segundo_apellido].filter(Boolean).join(' ')}
                  </h2>
                  <span style={{
                    background: '#E6F8FB',
                    border: '1px solid rgba(11, 197, 223, 0.4)',
                    color: '#0BC5DF',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: 20,
                    letterSpacing: '0.5px'
                  }}>
                    # PAC-{String(activePatient.id_persona).padStart(6, '0')}
                  </span>
                </div>

                {/* Subtitle details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: 13, color: '#5F656A', marginTop: 8, alignItems: 'center' }}>
                  <span>{calcularEdad(activePatient.fecha_nacimiento)} años · {activePatient.sexo === 'F' ? 'Femenino' : 'Masculino'}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span>+504 {activePatient.telefono}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span>{activePatient.correo_electronico}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span>{activePatient.municipio.nombre}, {activePatient.municipio.departamento.nombre}</span>
                </div>

                {/* Last visit */}
                <div style={{ fontSize: 13, color: '#5F656A', marginTop: 8 }}>
                  Última visita: {formatLastVisitDate(activePatient.ultimaVisita)}
                </div>

                {/* Active medical alerts */}
                {getAlertBadges(activePatient).length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#EF9F27', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Alertas Médicas Activas
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {getAlertBadges(activePatient).map((badge, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '4px 12px',
                            borderRadius: 20,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <span style={{ fontSize: 8 }}>●</span> {badge.text}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Yellow Warning Banner */}
            {getAlertBadges(activePatient).length > 0 && (
              <div style={{
                background: '#FFFDF0',
                border: '1.5px solid #FCD34D',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#78350F' }}>
                  <span>⚠️</span>
                  <span>Este paciente tiene alertas médicas activas. Revisa alergias y enfermedades antes de iniciar cualquier tratamiento.</span>
                </div>
                {activePatient.antecedentes && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#78350F', paddingLeft: 20 }}>
                    <span style={{ fontSize: 10, marginTop: 2 }}>▲</span>
                    <span>{activePatient.antecedentes}</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Visits Timeline */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.navy, marginBottom: 16 }}>Historial de Visitas y Consultas</h3>
            
            {activePatient.consultas.length === 0 ? (
              <div style={{ border: '2px dashed rgb(11, 197, 223)', borderRadius: 12, padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, background: 'rgba(11, 197, 223, 0.03)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgb(11, 197, 223)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Sin Visitas Registradas
                </span>
                <span style={{ fontSize: 12, color: 'rgb(136, 143, 148)', textAlign: 'center' }}>
                  El cliente no tiene ninguna visita realizada
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activePatient.consultas.map((visit) => {
                  const isExpanded = !!expandedVisits[visit.id_consulta];
                  const totalCosto = visit.tratamiento.reduce((sum, t) => sum + t.costo, 0);
                  return (
                    <div
                      key={visit.id_consulta}
                      style={{
                        background: C.white,
                        borderRadius: 12,
                        border: `1.5px solid ${
                          isExpanded
                            ? '#0BC5DF'
                            : hoveredCardId === visit.id_consulta
                              ? 'rgba(11, 197, 223, 0.4)'
                              : C.gray300
                        }`,
                        padding: '20px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
                        boxShadow: isExpanded
                          ? '0 10px 20px -5px rgba(11, 197, 223, 0.08), 0 4px 6px -2px rgba(11, 197, 223, 0.04)'
                          : hoveredCardId === visit.id_consulta
                            ? '0 4px 12px rgba(0, 0, 0, 0.04)'
                            : 'none',
                        transform: hoveredCardId === visit.id_consulta ? 'translateY(-2px)' : 'none',
                      }}
                      onMouseEnter={() => setHoveredCardId(visit.id_consulta)}
                      onMouseLeave={() => setHoveredCardId(null)}
                    >
                      {/* Accordion Clickable Header */}
                      <div
                        onClick={() => toggleVisit(visit.id_consulta)}
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
                          {/* Pulsing or active green/blue dot indicator */}
                          <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: isExpanded ? '#0BC5DF' : '#D3D7DA',
                            transition: 'background 0.25s',
                            boxShadow: isExpanded ? '0 0 8px #0BC5DF' : 'none'
                          }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>{visit.fecha_inicio} - {visit.fecha_fin}</span>
                          <span style={{ fontSize: 13, color: C.gray500 }}>
                            · Atendido por: <strong style={{ color: C.navy, fontWeight: 600 }}>{visit.id_usuario}</strong>
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
                                background: '#E6F8FB',
                                color: '#0BC5DF',
                                border: '1px solid rgba(11, 197, 223, 0.2)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
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
                                letterSpacing: '0.5px'
                              }}>
                                Firma Pendiente
                              </span>
                            )}
                          </div>
                          <div style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            color: isExpanded ? '#0BC5DF' : C.gray500,
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </div>

                      {/* Accordion Expandable Content */}
                      <div style={{
                        maxHeight: isExpanded ? '1200px' : '0px',
                        opacity: isExpanded ? 1 : 0,
                        overflow: 'hidden',
                        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out, padding-top 0.4s ease-in-out',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                        paddingTop: isExpanded ? 16 : 0,
                      }}>
                        {/* Middle details */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: 20,
                          background: '#F8F9FA',
                          borderRadius: 10,
                          padding: 20,
                          border: `1px solid ${C.gray100}`
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.gray500, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                              <span>🩺</span> Motivo de consulta
                            </div>
                            <div style={{ fontSize: 13.5, color: C.navy, marginTop: 6, fontWeight: 500, lineHeight: 1.5 }}>
                              {visit.motivo}
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.gray500, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                              <span>📝</span> Diagnóstico de evolución
                            </div>
                            <div style={{ fontSize: 13.5, color: C.navy, marginTop: 6, lineHeight: 1.5 }}>
                              {visit.diagnostico}
                            </div>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.gray500, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                              <span>📋</span> Notas clínicas
                            </div>
                            <div style={{ fontSize: 13.5, color: C.gray700, marginTop: 6, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                              {visit.notas}
                            </div>
                          </div>
                        </div>

                        {/* Treatments performed in this visit */}
                        {visit.tratamientos.length > 0 && (
                          <div style={{
                            background: '#ffffff',
                            borderRadius: 10,
                            padding: 18,
                            border: '1.5px solid rgba(11, 197, 223, 0.15)',
                            boxShadow: '0 2px 8px rgba(11, 197, 223, 0.03)'
                          }}>
                            <div style={{
                              fontSize: 12,
                              color: '#0BC5DF',
                              fontWeight: 700,
                              marginBottom: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}>
                              <DollarSign size={14} /> Tratamientos y Cobros realizados
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {visit.tratamientos.map((t, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: 13,
                                    color: C.navy,
                                    paddingBottom: 8,
                                    borderBottom: `1px solid ${C.gray100}`
                                  }}
                                >
                                  <span style={{ fontWeight: 500 }}>{t.nombre}</span>
                                  <span style={{ fontWeight: 600, color: C.navy }}>
                                    L. {t.costo.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              ))}
                              {/* Total Row */}
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  color: C.navy,
                                  paddingTop: 6,
                                  marginTop: 4
                                }}
                              >
                                <span>Total de la visita</span>
                                <span style={{ color: '#0BC5DF', fontSize: 14.5 }}>
                                  L. {totalCosto.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Multimedia attachments */}
                        {visit.archivos.length > 0 && (
                          <div>
                            <div style={{
                              fontSize: 11,
                              color: C.gray500,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.8px',
                              marginBottom: 10,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}>
                              <span>📎</span> Archivos y Radiografías Adjuntas
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {visit.archivos.map((archivo, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: '#ffffff',
                                    border: `1.5px solid ${C.gray100}`,
                                    borderRadius: 8,
                                    padding: '8px 14px',
                                    fontSize: 12.5,
                                    color: C.navy,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                    transition: 'border-color 0.2s',
                                    cursor: 'pointer'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.borderColor = '#0BC5DF'}
                                  onMouseLeave={e => e.currentTarget.style.borderColor = C.gray100}
                                >
                                  <Paperclip size={13} color={C.gray500} />
                                  <span style={{ fontWeight: 500 }}>{archivo.nombre}</span>
                                  <span style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    background: '#E6F8FB',
                                    color: '#0BC5DF',
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    marginLeft: 4,
                                    textTransform: 'uppercase'
                                  }}>
                                    {archivo.categoria.split(' ')[1] || archivo.categoria}
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

      {/* ══════════════════════════════════════════════════════════════════
          VISTA 3: Formulario de Registro de Nueva Visita
      ══════════════════════════════════════════════════════════════════ */}
      {viewState === 'new-visit' && activePatient && (
        <NuevaVisita
          patient={activePatient}
          onBack={handleNewVisitBack}
          onSave={handleNewVisitSave}
        />
      )}
    </div>
  );
}
