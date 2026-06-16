import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button, Select, Input, Card, Alert, SectionBlock, FieldBadge, Combobox } from '../../../context';
import { FormSection, FullWidthField } from '../../../components';
import { DatePickerCalendar } from '../../../components/DatePickerCalendar';
import { PatientSearchInput } from './PatientSearchInput';
import { appointmentService } from '../services/appointmentService';
import { treatmentService, especialidadService } from '../../treatments/services/treatmentService';
import { privilegeService } from '../../patients/components/expediente/services/privilegeService';
import type { Treatment, Especialidad } from '../../treatments/types';
import type { CreateAppointmentInput } from '../types';
import { TIPO_CITA_OPTIONS, CALENDAR_START_HOUR, CALENDAR_END_HOUR } from '../constants';

export function AppointmentFormScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState<{ value: string; label: string }[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);

  const [formData, setFormData] = useState<Partial<CreateAppointmentInput>>({
    id_persona: 0,
    id_usuario: 0,
    fecha_inicio: '',
    tipo_cita: '',
    motivo: '',
    notas: '',
    estado: 'programada',
  });

  const [timeStr, setTimeStr] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [initialPatient, setInitialPatient] = useState<{ nombre: string; identidad: string } | null>(null);

  useEffect(() => {
    privilegeService.getAllDoctores().then((res) => {
      if (res.success && res.data) {
        // Normalizamos la lista de doctores y adaptamos el mapeo al formato de privilegeService
        const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
        const mapped = list.map((d: any) => ({
          value: String(d.id_usuario),
          label: `${d.sexo === "M" ? "Dr." : "Dra."} ${d.primer_nombre} ${d.primer_apellido}`.trim(),
        }));
        setDoctors(mapped);
      }
    });

    treatmentService.getAll({ activo: 'true' }).then((res) => {
      const data = res.data?.data ?? res.data ?? [];
      setTreatments(Array.isArray(data) ? data : []);
    });

    especialidadService.getAll().then((res) => {
      const data = res.data?.data ?? res.data ?? [];
      setEspecialidades(Array.isArray(data) ? data : []);
    });
  }, []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await appointmentService.getById(Number(id));
        if (!cancelled && res.success && res.data) {
          const apt = res.data;
          setFormData({
            id_persona: apt.id_persona,
            id_usuario: apt.id_usuario,
            fecha_inicio: apt.fecha_inicio.split('T')[0],
            tipo_cita: apt.tipo_cita || '',
            motivo: apt.motivo || '',
            notas: apt.notas || '',
            estado: apt.estado,
          });
          setTimeStr(apt.fecha_inicio.substring(11, 16));
          if (apt.persona) {
            setInitialPatient({
              nombre: `${apt.persona.primer_nombre} ${apt.persona.primer_apellido}`,
              identidad: apt.persona.numero_identidad,
            });
          }
        } else if (!cancelled) {
          setError(res.message || 'Error al cargar la cita');
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Error al cargar la cita');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.id_persona) errors.id_persona = 'Seleccione un paciente';
    if (!formData.id_usuario) errors.id_usuario = 'Seleccione un doctor asignado';
    if (!formData.fecha_inicio) errors.fecha_inicio = 'Seleccione una fecha';
    else {
      const date = new Date(formData.fecha_inicio + 'T00:00:00');
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        errors.fecha_inicio = 'Solo se pueden agendar citas de lunes a viernes';
      }
    }
    if (!timeStr) errors.timeStr = 'Ingrese la hora de la cita';
    else {
      const [hours] = timeStr.split(':').map(Number);
      if (hours < CALENDAR_START_HOUR || hours >= CALENDAR_END_HOUR) {
        errors.timeStr = `La hora debe estar entre ${CALENDAR_START_HOUR}:00 y ${CALENDAR_END_HOUR}:00`;
      }
    }
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
      const text = (formData.motivo || '').trim();
      const match = treatments.find(
        (t) => t.nombre.toLowerCase() === text.toLowerCase(),
      );
      let motivo = text;

      if (!match && text && especialidades.length > 0) {
        const res = await treatmentService.create({
          idEspecialidad: especialidades[0].id,
          nombre: text,
          descripcion: '',
          precio: 0,
        });
        const created = res.data?.data ?? res.data;
        if (created) {
          motivo = created.nombre;
          setTreatments((prev) => [...prev, created]);
        }
      }

      const fechaInicio = `${formData.fecha_inicio}T${timeStr}:00`;
      const startDate = new Date(fechaInicio);
      const durationHours = formData.tipo_cita === 'Especialidad' ? 2 : 1;
      const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
      const pad2 = (n: number) => n.toString().padStart(2, '0');
      const fechaFin = `${endDate.getFullYear()}-${pad2(endDate.getMonth() + 1)}-${pad2(endDate.getDate())}T${pad2(endDate.getHours())}:${pad2(endDate.getMinutes())}:00`;

      const payload: CreateAppointmentInput = {
        id_persona: formData.id_persona!,
        id_usuario: formData.id_usuario!,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        tipo_cita: formData.tipo_cita,
        motivo,
        notas: formData.notas || undefined,
        estado: formData.estado,
      };

      if (isEditing) {
        await appointmentService.update(Number(id), payload);
      } else {
        await appointmentService.create(payload);
      }
      navigate('/agenda');
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error al guardar la cita.');
    } finally {
      setSaving(false);
    }
  };

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
                onChange={(patientId) => {
                  setFormData({ ...formData, id_persona: patientId });
                  setInitialPatient(null);
                  if (formErrors.id_persona) setFormErrors({ ...formErrors, id_persona: '' });
                }}
                error={formErrors.id_persona}
                initialPatient={initialPatient}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Doctor asignado</label>
                  <FieldBadge type="required" />
                </div>
                <Select
                  options={doctors}
                  value={String(formData.id_usuario || '')}
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
                min={`${String(CALENDAR_START_HOUR).padStart(2, '0')}:00`}
                max={`${String(CALENDAR_END_HOUR).padStart(2, '0')}:00`}
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
                  placeholder="Seleccione un tipo de cita"
                  options={TIPO_CITA_OPTIONS}
                  value={formData.tipo_cita || ''}
                  onChange={(val) => {
                    setFormData({ ...formData, tipo_cita: val });
                    if (formErrors.tipo_cita) setFormErrors({ ...formErrors, tipo_cita: '' });
                  }}
                  error={formErrors.tipo_cita}
                />
              </div>

              <Combobox
                label="Motivo o tratamiento a realizar"
                badge="required"
                placeholder="Seleccionar o escribir nuevo tratamiento"
                value={formData.motivo || ''}
                onChange={(val) => {
                  setFormData({ ...formData, motivo: val });
                  if (formErrors.motivo) setFormErrors({ ...formErrors, motivo: '' });
                }}
                options={treatments.map((t) => ({ value: String(t.id), label: t.nombre }))}
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
