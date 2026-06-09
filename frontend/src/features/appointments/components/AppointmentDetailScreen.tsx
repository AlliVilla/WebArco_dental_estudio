import React, { useState } from 'react';
import { Calendar, Clock, User, FileText, History, Edit, Trash2, Check, ArrowLeft, List } from 'lucide-react';
import { Button, Select, Alert, Card, SectionBlock, FieldBadge, StatusBadge } from '../../../context';
import { useNavigate, useParams } from 'react-router-dom';

interface StatusChange {
  from: string;
  to: string;
  timestamp: string;
  changedBy: string;
}

interface AppointmentDetail {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  date: string;
  startTime: string;
  duration: number;
  appointmentType: 'normal' | 'especial';
  motivo: string;
  status: 'programada' | 'confirmada' | 'cancelada' | 'atendida' | 'ausente' | 'reprogramada';
  notes?: string;
  statusHistory: StatusChange[];
}

const mockAppointment: AppointmentDetail = {
  id: '1',
  patientName: 'María González',
  patientPhone: '9876-5432',
  doctorName: 'Dra. Karla Arita',
  date: '2026-06-05',
  startTime: '09:00',
  duration: 1,
  appointmentType: 'normal',
  motivo: 'Limpieza dental y revisión general',
  status: 'confirmada',
  notes: 'Paciente prefiere anestesia local adicional',
  statusHistory: [
    {
      from: '',
      to: 'programada',
      timestamp: '2026-06-01T10:30:00',
      changedBy: 'Dr. Carlos Méndez',
    },
    {
      from: 'programada',
      to: 'confirmada',
      timestamp: '2026-06-02T14:15:00',
      changedBy: 'Dra. Karla Arita',
    },
  ],
};

const statusOptions = [
  { value: 'programada', label: 'Programada' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'atendida', label: 'Atendida' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'reprogramada', label: 'Reprogramada' },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function AppointmentDetailScreen() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [appointment, setAppointment] = useState<AppointmentDetail>(mockAppointment);
  const [newStatus, setNewStatus] = useState(appointment.status);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const hasStatusChanged = newStatus !== appointment.status;

  const handleSaveStatusChange = () => {
    if (!hasStatusChanged) return;

    if (newStatus === 'cancelada' && !showCancelWarning) {
      setShowCancelWarning(true);
      return;
    }

    const newChange: StatusChange = {
      from: appointment.status,
      to: newStatus,
      timestamp: new Date().toISOString(),
      changedBy: 'Dra. Karla Arita',
    };

    setAppointment((prev) => ({
      ...prev,
      status: newStatus as any,
      statusHistory: [...prev.statusHistory, newChange],
    }));

    setSuccessMessage('Estado actualizado correctamente.');
    setInfoMessage('El estado fue actualizado. El historial refleja el cambio con fecha y hora.');
    setShowCancelWarning(false);

    setTimeout(() => {
      setSuccessMessage('');
      setInfoMessage('');
    }, 5000);
  };

  const handleDelete = () => {
    console.log('Cita eliminada:', appointment.id);
    navigate('/agenda');
  };

  const endTime = (() => {
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + appointment.duration * 60;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/agenda')}>
          <ArrowLeft size={16} />
          Volver a Agenda
        </Button>
      </div>

      {successMessage && <Alert variant="success" message={successMessage} onClose={() => setSuccessMessage('')} />}
      {infoMessage && <Alert variant="info" message={infoMessage} onClose={() => setInfoMessage('')} />}
      {showCancelWarning && (
        <Alert
          variant="warning"
          message="¿Estás seguro de marcar esta cita como Cancelada? Esta acción quedará registrada."
        />
      )}

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Calendar size={20} style={{ color: '#0BC5DF' }} />
            <h3 style={{ margin: 0, color: '#203F49' }}>Detalle de Cita</h3>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/agenda/${id}/history`)}>
              <List size={14} />
              Ver historial del paciente
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/agenda/${id}/edit`)}>
              <Edit size={14} />
              Editar cita
            </Button>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={14} />
              Eliminar
            </Button>
          </div>
        </div>

        <SectionBlock title="Información de la cita" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Paciente</label>
                  <FieldBadge type="required" />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: '1px solid #D3D7DA', borderRadius: 8,
                  background: '#F8F9FA', padding: '10px 12px',
                }}>
                  <User size={15} style={{ color: '#888F94', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#203F49' }}>
                      {appointment.patientName}
                    </div>
                    <div style={{ fontSize: 12, color: '#888F94', marginTop: 2 }}>
                      Tel: {appointment.patientPhone}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Doctor asignado</label>
                  <FieldBadge type="required" />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: '1px solid #D3D7DA', borderRadius: 8,
                  background: '#F8F9FA', padding: '10px 12px',
                }}>
                  <User size={15} style={{ color: '#888F94', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#203F49' }}>
                    {appointment.doctorName}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Fecha</label>
                  <FieldBadge type="required" />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: '1px solid #D3D7DA', borderRadius: 8,
                  background: '#F8F9FA', padding: '10px 12px',
                }}>
                  <Calendar size={15} style={{ color: '#888F94', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#203F49' }}>
                    {formatDate(appointment.date)}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Hora</label>
                  <FieldBadge type="required" />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: '1px solid #D3D7DA', borderRadius: 8,
                  background: '#F8F9FA', padding: '10px 12px',
                }}>
                  <Clock size={15} style={{ color: '#888F94', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#203F49' }}>
                    {appointment.startTime} - {endTime}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Tipo de cita</label>
                  <FieldBadge type="required" />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  border: '1px solid #D3D7DA', borderRadius: 8,
                  background: '#F8F9FA', padding: '10px 12px',
                }}>
                  <FileText size={15} style={{ color: '#888F94', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: '#203F49' }}>
                    {appointment.appointmentType === 'normal' ? 'Normal (1 hora)' : 'Especial (2 horas)'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Estado actual</label>
                  <FieldBadge type="required" />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: '1px solid #D3D7DA', borderRadius: 8,
                  background: '#F8F9FA', padding: '10px 12px',
                }}>
                  <StatusBadge status={appointment.status} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Motivo / Tratamiento</label>
                <FieldBadge type="required" />
              </div>
              <div style={{
                border: '1px solid #D3D7DA', borderRadius: 8,
                background: '#F8F9FA', padding: '10px 12px',
              }}>
                <span style={{ fontSize: 14, color: '#203F49', whiteSpace: 'pre-wrap' }}>
                  {appointment.motivo}
                </span>
              </div>
            </div>

            {appointment.notes && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Notas adicionales</label>
                  <FieldBadge type="optional" />
                </div>
                <div style={{
                  border: '1px solid #D3D7DA', borderRadius: 8,
                  background: '#F8F9FA', padding: '10px 12px',
                }}>
                  <span style={{ fontSize: 14, color: '#888F94', whiteSpace: 'pre-wrap' }}>
                    {appointment.notes}
                  </span>
                </div>
              </div>
            )}
          </div>
        </SectionBlock>

        <SectionBlock title="Cambiar estado" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Select
              label="Selector para cambiar estado"
              badge="required"
              options={statusOptions}
              value={newStatus}
              onChange={(v) => setNewStatus(v as any)}
            />

            {hasStatusChanged && (
              <div style={{
                background: '#FFFBEB', border: '1px solid #EF9F27',
                borderRadius: 8, padding: 12, display: 'flex',
                alignItems: 'center', gap: 8,
              }}>
                <History size={15} style={{ color: '#EF9F27', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#EF9F27' }}>
                  Cambio pendiente: <strong>{appointment.status}</strong> → <strong>{newStatus}</strong>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                variant="primary"
                onClick={handleSaveStatusChange}
                disabled={!hasStatusChanged}
              >
                <Check size={16} />
                Guardar cambio de estado
              </Button>
              {showCancelWarning && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setNewStatus(appointment.status);
                    setShowCancelWarning(false);
                  }}
                >
                  Cancelar cambio
                </Button>
              )}
            </div>
          </div>
        </SectionBlock>

        <SectionBlock title="Historial de cambios de estado">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Historial de cambios</label>
            <FieldBadge type="optional" />
          </div>

          {appointment.statusHistory.length === 0 ? (
            <div style={{
              padding: 16, textAlign: 'center',
              color: '#888F94', fontSize: 13,
            }}>
              No hay cambios de estado registrados
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {appointment.statusHistory.map((change, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#fff', border: '1px solid #D3D7DA',
                    borderRadius: 8, padding: 12,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#E6F8FB', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <History size={14} style={{ color: '#0BC5DF' }} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#203F49', marginBottom: 4 }}>
                      {change.from ? (
                        <>
                          Estado cambiado de <StatusBadge status={change.from as any} /> a <StatusBadge status={change.to as any} />
                        </>
                      ) : (
                        <>
                          Cita creada con estado <StatusBadge status={change.to as any} />
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#888F94' }}>
                      {formatTimestamp(change.timestamp)} · Por {change.changedBy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionBlock>
      </Card>

      {showDeleteConfirm && (
        <div
          onClick={() => setShowDeleteConfirm(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 12, padding: 24,
              maxWidth: 450, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#FEF2F2', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Trash2 size={20} style={{ color: '#E24B4A' }} />
              </div>
              <h3 style={{ margin: 0, color: '#203F49' }}>Eliminar Cita</h3>
            </div>

            <p style={{ margin: 0, marginBottom: 20, fontSize: 14, color: '#5F656A', lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.
              Se eliminará permanentemente la cita de <strong>{appointment.patientName}</strong> programada
              para el {formatDate(appointment.date)} a las {appointment.startTime}.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="danger" fullWidth onClick={handleDelete}>
                <Trash2 size={16} />
                Eliminar cita
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
