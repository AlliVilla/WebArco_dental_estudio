import React, { useState } from 'react';
import { Shield, Plus, Search, CheckCircle2, AlertTriangle, Download, PenTool, Clock } from 'lucide-react';
import { Card, Button, Input } from '../../../context';

interface LocalConsent {
  id: number;
  paciente: string;
  expediente: string;
  tipo: string;
  fecha: string;
  estado: string;
  doctor: string;
  testigo: string;
  firma: string | null;
}

// Mock initial data for Consents
const initialConsents: LocalConsent[] = [
  {
    id: 1,
    paciente: 'Ana López Martínez',
    expediente: '2024-00142',
    tipo: 'Consentimiento para Tratamiento Endodóntico',
    fecha: '2026-06-08',
    estado: 'FIRMADO',
    doctor: 'Dr. Marco Salinas',
    testigo: 'Carmen López (Madre)',
    firma: 'digital_signature_ana_120349.png'
  },
  {
    id: 2,
    paciente: 'Carlos Vega Salgado',
    expediente: '2024-00085',
    tipo: 'Consentimiento para Extracción Dental',
    fecha: '2026-06-07',
    estado: 'FIRMADO',
    doctor: 'Dr. Karla Arita',
    testigo: 'N/A',
    firma: 'digital_signature_carlos_098124.png'
  },
  {
    id: 3,
    paciente: 'María José González Flores',
    expediente: '2023-00512',
    tipo: 'Consentimiento para Cirugía de Implante Dental',
    fecha: '2026-06-08',
    estado: 'PENDIENTE_FIRMA',
    doctor: 'Dr. Karla Arita',
    testigo: 'N/A',
    firma: null
  }
];

const CONSENT_TEMPLATES = [
  { tipo: 'Consentimiento para Extracción Dental', desc: 'Autorización para remoción de piezas dentarias, riesgos asociados de inflamación y anestesia.' },
  { tipo: 'Consentimiento para Tratamiento Endodóntico', desc: 'Autorización para tratamiento de conductos, posible decoloración y necesidad de corona post-tratamiento.' },
  { tipo: 'Consentimiento para Cirugía de Implante Dental', desc: 'Autorización para colocación de poste de titanio y rehabilitación de corona sobre implante.' },
  { tipo: 'Consentimiento para Tratamiento de Ortodoncia', desc: 'Autorización para colocación de brackets, higiene rigurosa y controles mensuales obligatorios.' }
];

export function ConsentScreen() {
  const [consents, setConsents] = useState(initialConsents);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeConsentDetail, setActiveConsentDetail] = useState<number | null>(1);

  // Form states
  const [pacienteName, setPacienteName] = useState('María José González Flores');
  const [expediente, setExpediente] = useState('2023-00512');
  const [tipo, setTipo] = useState(CONSENT_TEMPLATES[0].tipo);
  const [doctor, setDoctor] = useState('Dr. Karla Arita');
  const [testigo, setTestigo] = useState('');

  const filteredConsents = consents.filter((c: LocalConsent) => {
    const pName = c.paciente.toLowerCase();
    const cType = c.tipo.toLowerCase();
    const query = searchQuery.toLowerCase();
    return pName.includes(query) || cType.includes(query);
  });

  const selectedConsent = consents.find((c: LocalConsent) => c.id === activeConsentDetail) || consents[0];

  const handleCreateConsent = (e: React.FormEvent) => {
    e.preventDefault();
    const newConsent = {
      id: Math.max(...consents.map((c: LocalConsent) => c.id), 0) + 1,
      paciente: pacienteName,
      expediente,
      tipo,
      fecha: new Date().toISOString().split('T')[0],
      estado: 'PENDIENTE_FIRMA',
      doctor,
      testigo: testigo || 'N/A',
      firma: null
    };

    setConsents([newConsent, ...consents]);
    setActiveConsentDetail(newConsent.id);
    setIsAdding(false);
    setTestigo('');
  };

  const handleSignConsent = (id: number) => {
    setConsents(consents.map((c: LocalConsent) => {
      if (c.id === id) {
        return {
          ...c,
          estado: 'FIRMADO',
          firma: `digital_signature_captured_${Date.now()}.png`
        };
      }
      return c;
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: '#203F49', fontWeight: 600 }}>Consentimientos Informados</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888F94' }}>
            Gestiona y firma digitalmente los términos de tratamiento y responsabilidades médicas.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} variant="primary">
          <Plus size={16} /> Crear Consentimiento
        </Button>
      </div>

      {/* Main content grid */}
      <div className="consent-layout">
        {/* Left column: List of documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ padding: 12 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, color: '#888F94' }} />
              <input
                type="text"
                placeholder="Buscar por paciente o tipo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 8,
                  border: '1px solid #D3D7DA',
                  outline: 'none',
                  fontSize: 13,
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </Card>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #EAECEE', background: '#F8F9FA' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#888F94' }}>DOCUMENTOS ({filteredConsents.length})</span>
            </div>
            <div style={{ maxHeight: 460, overflowY: 'auto' }}>
              {filteredConsents.map((c: LocalConsent) => {
                const isSelected = activeConsentDetail === c.id;
                const isSigned = c.estado === 'FIRMADO';
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConsentDetail(c.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #F1F3F4',
                      cursor: 'pointer',
                      background: isSelected ? '#E6F8FB' : '#fff',
                      borderLeft: isSelected ? '4px solid #0BC5DF' : '4px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8F9FA'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#203F49', maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.tipo}
                      </span>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: isSigned ? '#ECFDF5' : '#FFFBEB',
                        color: isSigned ? '#1D9E75' : '#EF9F27'
                      }}>
                        {isSigned ? 'Firmado' : 'Pendiente'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#888F94', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pac: {c.paciente}</span>
                      <span>{c.fecha}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right column: Document viewer and details */}
        {selectedConsent && (
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Doc Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #EAECEE', paddingBottom: 14 }}>
              <div>
                <span style={{ fontSize: 11, color: '#0BC5DF', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  CONTRATO DE CONSENTIMIENTO CLÍNICO #{selectedConsent.id}
                </span>
                <h3 style={{ margin: 0, color: '#203F49', fontSize: 16, fontWeight: 600 }}>{selectedConsent.tipo}</h3>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => alert('Próximamente: Descargar PDF firmado oficialmente.')}
              >
                <Download size={13} /> Exportar PDF
              </Button>
            </div>

            {/* General details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#F8F9FA', borderRadius: 8, padding: 12, fontSize: 12 }}>
              <div>
                <span style={{ color: '#888F94', display: 'block' }}>Paciente</span>
                <span style={{ fontWeight: 600, color: '#203F49', marginTop: 2, display: 'block' }}>
                  {selectedConsent.paciente} (Exp. {selectedConsent.expediente})
                </span>
              </div>
              <div>
                <span style={{ color: '#888F94', display: 'block' }}>Doctor Responsable</span>
                <span style={{ fontWeight: 600, color: '#203F49', marginTop: 2, display: 'block' }}>{selectedConsent.doctor}</span>
              </div>
              <div>
                <span style={{ color: '#888F94', display: 'block' }}>Fecha de Emisión</span>
                <span style={{ fontWeight: 600, color: '#203F49', marginTop: 2, display: 'block' }}>{selectedConsent.fecha}</span>
              </div>
              <div>
                <span style={{ color: '#888F94', display: 'block' }}>Testigo Acompañante</span>
                <span style={{ fontWeight: 600, color: '#203F49', marginTop: 2, display: 'block' }}>{selectedConsent.testigo}</span>
              </div>
            </div>

            {/* Document Content Mock */}
            <div style={{
              flex: 1,
              border: '1px solid #D3D7DA',
              borderRadius: 8,
              padding: 16,
              background: '#FFF',
              fontFamily: 'serif',
              fontSize: 13,
              color: '#3C4043',
              lineHeight: 1.6,
              maxHeight: 220,
              overflowY: 'auto'
            }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', textAlign: 'center' }}>DECLARACIÓN DE CONSENTIMIENTO INFORMADO</p>
              <p style={{ margin: 0 }}>
                Yo, <strong>{selectedConsent.paciente}</strong>, manifiesto que he sido debidamente informado(a) por el(la) odontólogo(a) responsable sobre las condiciones clínicas que motivan la realización del procedimiento de <strong>{selectedConsent.tipo.replace('Consentimiento para ', '')}</strong>, los beneficios esperados, las alternativas viables de tratamiento, y los riesgos inherentes de inflamación, infección, sensibilidad dental temporaria o reacciones adversas a anestésicos. Comprendo plenamente las recomendaciones postoperatorias y me comprometo a cumplirlas a cabalidad en resguardo de mi salud bucodental.
              </p>
            </div>

            {/* Sign status and capturing */}
            <div style={{
              borderTop: '1px solid #EAECEE',
              paddingTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedConsent.estado === 'FIRMADO' ? (
                  <>
                    <CheckCircle2 size={18} style={{ color: '#1D9E75' }} />
                    <span style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600 }}>Firma capturada y encriptada digitalmente</span>
                  </>
                ) : (
                  <>
                    <Clock size={18} style={{ color: '#EF9F27' }} />
                    <span style={{ fontSize: 13, color: '#EF9F27', fontWeight: 600 }}>Pendiente de firma del paciente</span>
                  </>
                )}
              </div>

              {selectedConsent.estado !== 'FIRMADO' ? (
                <Button variant="primary" style={{ background: '#EF9F27', borderColor: '#EF9F27' }} onClick={() => handleSignConsent(selectedConsent.id)}>
                  <PenTool size={14} /> Firmar en Tableta/Pantalla
                </Button>
              ) : (
                <div style={{ border: '1px dashed #1D9E75', borderRadius: 6, padding: '4px 12px', background: '#F0FDF4', fontSize: 11, color: '#17805E', fontWeight: 600 }}>
                  HASH: 9A3D821F24E67C92
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      <style>{`
        .consent-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 20px;
        }
        @media (max-width: 860px) {
          .consent-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Modal - Create Consent Document */}
      {isAdding && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(32, 63, 73, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 500,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EAECEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={18} style={{ color: '#0BC5DF' }} />
                <h3 style={{ margin: 0, color: '#203F49', fontSize: 15, fontWeight: 600 }}>Generar Consentimiento</h3>
              </div>
              <button onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888F94', fontSize: 18 }}>
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateConsent} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Paciente Destinatario</label>
                <select
                  value={pacienteName}
                  onChange={e => {
                    setPacienteName(e.target.value);
                    if (e.target.value.includes('Ana')) setExpediente('2024-00142');
                    else if (e.target.value.includes('Carlos')) setExpediente('2024-00085');
                    else if (e.target.value.includes('María')) setExpediente('2023-00512');
                    else setExpediente('2025-00012');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #D3D7DA',
                    outline: 'none',
                    fontSize: 14,
                    background: '#fff',
                    color: '#203F49'
                  }}
                >
                  <option value="María José González Flores">María José González Flores (Exp. 2023-00512)</option>
                  <option value="Ana López Martínez">Ana López Martínez (Exp. 2024-00142)</option>
                  <option value="Carlos Vega Salgado">Carlos Vega Salgado (Exp. 2024-00085)</option>
                  <option value="Roberto José Díaz Alvarado">Roberto José Díaz Alvarado (Exp. 2025-00012)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Plantilla de Consentimiento</label>
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #D3D7DA',
                    outline: 'none',
                    fontSize: 14,
                    background: '#fff',
                    color: '#203F49'
                  }}
                >
                  {CONSENT_TEMPLATES.map(temp => (
                    <option key={temp.tipo} value={temp.tipo}>{temp.tipo}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Doctor Responsable</label>
                <select
                  value={doctor}
                  onChange={e => setDoctor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #D3D7DA',
                    outline: 'none',
                    fontSize: 14,
                    background: '#fff',
                    color: '#203F49'
                  }}
                >
                  <option value="Dr. Karla Arita">Dr. Karla Arita (Odontóloga General)</option>
                  <option value="Dr. Marco Salinas">Dr. Marco Salinas (Endodoncista)</option>
                </select>
              </div>

              <Input
                label="Testigo Acompañante"
                badge="optional"
                placeholder="Nombre completo del testigo (opcional)"
                value={testigo}
                onChange={e => setTestigo(e.target.value)}
              />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#FFFBEB', borderRadius: 8, padding: 10, border: '1px solid #FDE68A', fontSize: 11, color: '#C47F00' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Al guardar este documento se generará un formulario digital listo para ser firmado por el paciente en recepción.</span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <Button variant="secondary" type="button" onClick={() => setIsAdding(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  Generar Documento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
