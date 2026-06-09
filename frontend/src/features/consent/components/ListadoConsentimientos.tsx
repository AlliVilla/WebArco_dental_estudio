import React, { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle, XCircle, AlertCircle, Calendar, Download } from 'lucide-react';
import { Button, Card } from '../../../context';
import { ConsentimientoListItem } from '../types';

export interface ListadoConsentimientosProps {
  consentimientos: ConsentimientoListItem[];
  onPrint?: (id: number) => void;
  onViewDetail?: (id: number) => void;
  onCreateNew?: () => void;
  loading?: boolean;
}

export function ListadoConsentimientos({
  consentimientos,
  onPrint,
  onViewDetail,
  onCreateNew,
  loading = false,
}: ListadoConsentimientosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [filterMes, setFilterMes] = useState<string>('');

  const doctoresUnicos = useMemo(
    () => Array.from(new Set(consentimientos.map((c) => c.doctor.username))),
    [consentimientos]
  );

  const filteredConsentimientos = useMemo(() => {
    return consentimientos.filter((consent) => {
      const pacienteCompleto = `${consent.paciente.primer_nombre} ${consent.paciente.segundo_nombre || ''} ${consent.paciente.primer_apellido} ${consent.paciente.segundo_apellido || ''}`.toLowerCase();

      const matchesSearch =
        pacienteCompleto.includes(searchTerm.toLowerCase()) ||
        consent.paciente.numero_identidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consent.tratamiento.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesEstado = true;
      if (filterEstado !== 'todos') {
        matchesEstado = consent.estado_firmas === filterEstado;
      }

      let matchesMes = true;
      if (filterMes) {
        const consentMes = consent.fecha.substring(0, 7);
        matchesMes = consentMes === filterMes;
      }

      return matchesSearch && matchesEstado && matchesMes;
    });
  }, [consentimientos, searchTerm, filterEstado, filterMes]);

  const stats = useMemo(
    () => ({
      total: consentimientos.length,
      completos: consentimientos.filter((c) => c.estado_firmas === 'completo').length,
      pendientes: consentimientos.filter((c) => c.estado_firmas === 'pendiente').length,
      incompletos: consentimientos.filter((c) => c.estado_firmas === 'incompleto').length,
    }),
    [consentimientos]
  );

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'completo':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: '#ECFDF5',
              color: '#1D9E75',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 20,
            }}
          >
            <CheckCircle size={14} />
            Completo
          </span>
        );
      case 'pendiente':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: '#FFFBEB',
              color: '#EF9F27',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 20,
            }}
          >
            <AlertCircle size={14} />
            Pendiente
          </span>
        );
      case 'incompleto':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: '#FFE8EC',
              color: '#E24B4A',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 20,
            }}
          >
            <XCircle size={14} />
            Incompleto
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: '#203F49', marginBottom: 8 }}>
            Ver Consentimientos
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#888F94' }}>
            Gestión y seguimiento de consentimientos informados
          </p>
        </div>
        <Button onClick={onCreateNew} variant="primary" disabled={loading}>
          + Crear Nuevo
        </Button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Card style={{ padding: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#888F94', marginBottom: 8, fontWeight: 600 }}>TOTAL</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#203F49' }}>{stats.total}</p>
        </Card>
        <Card style={{ padding: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#1D9E75', marginBottom: 8, fontWeight: 600 }}>COMPLETOS</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1D9E75' }}>{stats.completos}</p>
        </Card>
        <Card style={{ padding: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#EF9F27', marginBottom: 8, fontWeight: 600 }}>PENDIENTES</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#EF9F27' }}>{stats.pendientes}</p>
        </Card>
        <Card style={{ padding: 16 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#E24B4A', marginBottom: 8, fontWeight: 600 }}>INCOMPLETOS</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#E24B4A' }}>{stats.incompletos}</p>
        </Card>
      </div>

      {/* Alert for incomplete */}
      {stats.incompletos + stats.pendientes > 0 && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #EF9F27',
            borderRadius: 8,
            padding: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <AlertCircle size={20} style={{ color: '#EF9F27', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#203F49' }}>Acción requerida</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#203F49' }}>
              Hay {stats.incompletos + stats.pendientes} consentimientos que requieren firmas pendientes.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Filter size={18} style={{ color: '#0BC5DF' }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#203F49' }}>Filtros</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {/* Search */}
          <div>
            <label style={{ fontSize: 12, color: '#888F94', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Buscar
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 10,
                  color: '#888F94',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Paciente, ID, tratamiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: 36,
                  paddingRight: 12,
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderRadius: 8,
                  border: '1px solid #D3D7DA',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Estado filter */}
          <div>
            <label style={{ fontSize: 12, color: '#888F94', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Estado
            </label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #D3D7DA',
                fontSize: 13,
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="todos">Todos</option>
              <option value="completo">Completo</option>
              <option value="pendiente">Pendiente</option>
              <option value="incompleto">Incompleto</option>
            </select>
          </div>

          {/* Month filter */}
          <div>
            <label style={{ fontSize: 12, color: '#888F94', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Calendar size={14} />
              Filtrar por mes
            </label>
            <input
              type="month"
              value={filterMes}
              onChange={(e) => setFilterMes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #D3D7DA',
                fontSize: 13,
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Results count */}
      <p style={{ margin: 0, fontSize: 13, color: '#888F94' }}>
        Mostrando {filteredConsentimientos.length} de {consentimientos.length} consentimientos
      </p>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#F8F9FA', borderBottom: '1px solid #D3D7DA' }}>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#203F49',
                  }}
                >
                  Fecha
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#203F49',
                  }}
                >
                  Paciente
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#203F49',
                  }}
                >
                  Tratamiento
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#203F49',
                  }}
                >
                  Firmas
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#203F49',
                  }}
                >
                  Estado
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#203F49',
                  }}
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredConsentimientos.map((consent, idx) => (
                <tr
                  key={consent.id_consulta}
                  style={{
                    borderBottom: '1px solid #F1F3F4',
                    backgroundColor: idx % 2 === 0 ? '#fff' : '#F8F9FA',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F1F3F4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#F8F9FA';
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    {new Date(consent.fecha).toLocaleDateString('es-ES')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ margin: 0, fontWeight: 500, color: '#203F49' }}>
                      {consent.paciente.primer_nombre} {consent.paciente.primer_apellido}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888F94' }}>
                      {consent.paciente.numero_identidad}
                    </p>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{consent.tratamiento}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {consent.tiene_firma_paciente ? (
                          <CheckCircle size={14} style={{ color: '#1D9E75' }} />
                        ) : (
                          <XCircle size={14} style={{ color: '#EF9F27' }} />
                        )}
                        <span style={{ fontSize: 11, color: '#888F94' }}>Pac.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {consent.tiene_firma_doctor ? (
                          <CheckCircle size={14} style={{ color: '#1D9E75' }} />
                        ) : (
                          <XCircle size={14} style={{ color: '#EF9F27' }} />
                        )}
                        <span style={{ fontSize: 11, color: '#888F94' }}>Doc.</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>{getEstadoBadge(consent.estado_firmas)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPrint?.(consent.id_consulta)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Download size={14} />
                      Imprimir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredConsentimientos.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#888F94' }}>
              No se encontraron consentimientos con los filtros aplicados.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ListadoConsentimientos;
