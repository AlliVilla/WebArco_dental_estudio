import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, User, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button, Select, Input, Card, Alert, SectionBlock, FieldBadge } from '../../../context';
import { FormSection, FullWidthField } from '../../../components';
import { DatePickerCalendar } from '../../../components/DatePickerCalendar';
import { PatientSearchInput } from './PatientSearchInput';
import { appointmentService } from '../services/appointmentService';
import { CreateAppointmentInput, EstadoCita } from '../types';

export function AppointmentFormScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState<{ value: string | number, label: string }[]>([]);

  const [formData, setFormData] = useState<Partial<CreateAppointmentInput>>({
    id_persona: 0,
    id_usuario: 0,
    fecha_inicio: '',
    fecha_fin: '',
    tipo_cita: '',
    motivo: '',
    notas: '',
    estado: 'programada',
  });

  // Basic form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const docList = [
          { value: 1, label: 'Dra. Karla Arita' },
          { value: 2, label: 'Dr. Carlos Méndez' },
          { value: 3, label: 'Dra. Ana Sánchez' },
        ];
        setDoctors(docList);
        
        if (!isEditing && !formData.id_usuario) {
          setFormData(prev => ({ ...prev, id_usuario: 1 }));
        }

        if (isEditing) {
          // Fake wait
          await new Promise(r => setTimeout(r, 400));
          setFormData({
            id_persona: 1,
            id_usuario: 1,
            fecha_inicio: '2026-06-03',
            fecha_fin: '',
            tipo_cita: 'Consulta general',
            motivo: 'Revisión periódica',
            notas: 'Paciente no tolera anestesia',
            estado: 'programada',
          });
          setTimeStr('09:00');
        }
      } catch (err: any) {
        setError('Error al cargar datos. ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, isEditing]);

  const [timeStr, setTimeStr] = useState('');

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.id_persona) errors.id_persona = 'Seleccione un paciente';
    if (!formData.id_usuario) errors.id_usuario = 'Seleccione un doctor asignado';
    if (!formData.fecha_inicio) errors.fecha_inicio = 'Seleccione una fecha';
    if (!timeStr) errors.timeStr = 'Ingrese la hora de la cita';
    if (!formData.tipo_cita) errors.tipo_cita = 'Seleccione el tipo de cita';
    if (!formData.motivo) errors.motivo = 'Especifique el motivo';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setError('Por favor, complete todos los campos requeridos correctamente.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Fake save delay
      await new Promise(r => setTimeout(r, 600));
      navigate('/agenda');
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar la cita.');
    } finally {
      setSaving(false);
    }
  };

  const tipoCitaOptions = [
    { value: 'Consulta general', label: 'Consulta general (1 hora)' },
    { value: 'Especialidad', label: 'Especialidad (2 horas)' },
  ];

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Cargando datos...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Volver
        </Button>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E6F8FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={20} style={{ color: '#0BC5DF' }} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#203F49', fontSize: 18, fontWeight: 600 }}>
              {isEditing ? 'Editar Cita' : 'Programar Nueva Cita'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888F94' }}>
              Complete la información necesaria para registrar la cita en la agenda.
            </p>
          </div>
        </div>

        {error && <div style={{ marginBottom: 24 }}><Alert variant="error" message={error} onClose={() => setError('')} /></div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <SectionBlock title="Participantes">
            <FormSection>
              <PatientSearchInput
                value={formData.id_persona}
                onChange={(id) => {
                  setFormData({ ...formData, id_persona: id });
                  if (formErrors.id_persona) setFormErrors({ ...formErrors, id_persona: '' });
                }}
                error={formErrors.id_persona}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Doctor asignado</label>
                  <FieldBadge type="required" />
                </div>
                <Select
                  options={doctors}
                  value={formData.id_usuario || ''}
                  onChange={(val) => {
                    setFormData({ ...formData, id_usuario: Number(val) });
                    if (formErrors.id_usuario) setFormErrors({ ...formErrors, id_usuario: '' });
                  }}
                  error={formErrors.id_usuario}
                />
              </div>
            </FormSection>
          </SectionBlock>

          <SectionBlock title="Programación">
            <FormSection>
              <DatePickerCalendar
                label="Fecha de la cita"
                badge="required"
                value={formData.fecha_inicio}
                onChange={(date) => {
                  setFormData({ ...formData, fecha_inicio: date });
                  if (formErrors.fecha_inicio) setFormErrors({ ...formErrors, fecha_inicio: '' });
                }}
                error={formErrors.fecha_inicio}
              />

              <Input
                label="Hora"
                type="time"
                badge="required"
                value={timeStr}
                onChange={(e) => {
                  setTimeStr(e.target.value);
                  if (formErrors.timeStr) setFormErrors({ ...formErrors, timeStr: '' });
                }}
                error={formErrors.timeStr}
              />
            </FormSection>
          </SectionBlock>

          <SectionBlock title="Detalles de la Cita">
            <FormSection>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Tipo de cita</label>
                  <FieldBadge type="required" />
                </div>
                <Select
                  options={tipoCitaOptions}
                  value={formData.tipo_cita || ''}
                  onChange={(val) => {
                    setFormData({ ...formData, tipo_cita: String(val) });
                    if (formErrors.tipo_cita) setFormErrors({ ...formErrors, tipo_cita: '' });
                  }}
                  error={formErrors.tipo_cita}
                />
              </div>

              <Input
                label="Motivo o tratamiento a realizar"
                badge="required"
                placeholder="Ej. Limpieza general, extracción..."
                value={formData.motivo}
                onChange={(e) => {
                  setFormData({ ...formData, motivo: e.target.value });
                  if (formErrors.motivo) setFormErrors({ ...formErrors, motivo: '' });
                }}
                error={formErrors.motivo}
              />
            </FormSection>

            <FullWidthField style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Notas adicionales</label>
                  <FieldBadge type="optional" />
                </div>
                <textarea
                  value={formData.notas || ''}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Información adicional sobre la cita o paciente..."
                  style={{
                    width: '100%',
                    minHeight: 80,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #D3D7DA',
                    outline: 'none',
                    fontSize: 14,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    color: '#203F49',
                  }}
                />
              </div>
            </FullWidthField>
          </SectionBlock>

          <div style={{
            marginTop: 16,
            paddingTop: 24,
            borderTop: '1px solid #EAECEE',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}>
            <Button variant="secondary" type="button" onClick={() => navigate(-1)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              <CheckCircle2 size={16} />
              {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Programar Cita')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
