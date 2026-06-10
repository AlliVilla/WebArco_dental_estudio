import React, { useState } from 'react';
import { CheckCircle, FileText, Stethoscope, UserRound } from 'lucide-react';

import { FormSection, FullWidthField } from '../../../components';
import { Alert, Button, Card, Input, Select, useTheme } from '../../../context';
import { FirmaCanvas } from './FirmaCanvas';

const TIPOS_TRATAMIENTO = [
  { value: 'Extracción dental', label: 'Extracción dental' },
  { value: 'Ortodoncia', label: 'Ortodoncia' },
  { value: 'Implante dental', label: 'Implante dental' },
  { value: 'Endodoncia (tratamiento de conducto)', label: 'Endodoncia (tratamiento de conducto)' },
  { value: 'Blanqueamiento dental', label: 'Blanqueamiento dental' },
  { value: 'Cirugía oral', label: 'Cirugía oral' },
  { value: 'Periodoncia', label: 'Periodoncia' },
  { value: 'Prótesis dental', label: 'Prótesis dental' },
];

const DOCTORES = [
  { value: 'Dr. Carlos Méndez', label: 'Dr. Carlos Méndez' },
  { value: 'Dra. María González', label: 'Dra. María González' },
  { value: 'Dr. Juan Pérez', label: 'Dr. Juan Pérez' },
  { value: 'Dra. Ana Martínez', label: 'Dra. Ana Martínez' },
  { value: 'Dr. Roberto Silva', label: 'Dr. Roberto Silva' },
];

export interface FormularioConsentimientoProps {
  pacienteName?: string;
  pacienteId?: string;
  expediente?: string;
  onSubmit?: (data: ConsentimientoFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export interface ConsentimientoFormData {
  tipoTratamiento: string;
  doctor: string;
  fecha: string;
  diagnostico: string;
  aceptaTerminos: boolean;
  firmaPaciente: string;
  firmaDoctor: string;
}

const initialFormData = (): ConsentimientoFormData => ({
  tipoTratamiento: '',
  doctor: '',
  fecha: new Date().toISOString().split('T')[0],
  diagnostico: '',
  aceptaTerminos: false,
  firmaPaciente: '',
  firmaDoctor: '',
});

export function FormularioConsentimiento({
  pacienteName = 'Ana María Rodríguez López',
  pacienteId = 'PAC-2024-00342',
  expediente = '',
  onSubmit,
  onCancel,
  loading = false,
}: FormularioConsentimientoProps) {
  useTheme();

  const [formData, setFormData] = useState<ConsentimientoFormData>(initialFormData);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = <K extends keyof ConsentimientoFormData>(field: K, value: ConsentimientoFormData[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tipoTratamiento) newErrors.tipoTratamiento = 'Seleccione tipo de tratamiento';
    if (!formData.doctor) newErrors.doctor = 'Seleccione doctor responsable';
    if (!formData.fecha) newErrors.fecha = 'La fecha es requerida';
    if (!formData.aceptaTerminos) newErrors.aceptaTerminos = 'Debe aceptar los términos';
    if (!formData.firmaPaciente) newErrors.firmaPaciente = 'Se requiere firma del paciente';
    if (!formData.firmaDoctor) newErrors.firmaDoctor = 'Se requiere firma del doctor';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    onSubmit?.(formData);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      setFormData(initialFormData());
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--foreground)' }}>
          Consentimiento Informado
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted-foreground, var(--arco-gray-500))' }}>
          Autorización para procedimientos dentales
        </p>
      </div>

      {showSuccess && <Alert variant="success" message="Consentimiento registrado exitosamente" />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <FormSection icon={<UserRound size={18} />} title="Información del paciente" columns={2}>
          <FullWidthField>
            <Card style={{ background: 'var(--arco-primary-light)', border: '1px solid var(--border)', padding: 16 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: 'var(--arco-navy)' }}>{pacienteName}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--arco-gray-700)' }}>
                ID: {pacienteId} {expediente ? `| Expediente: ${expediente}` : ''}
              </p>
            </Card>
          </FullWidthField>

          <Input
            type="date"
            label="Fecha"
            badge="required"
            value={formData.fecha}
            onChange={(event) => updateField('fecha', event.target.value)}
            error={errors.fecha}
          />

          <Select
            label="Tipo de tratamiento"
            badge="required"
            placeholder="Seleccione tratamiento"
            value={formData.tipoTratamiento}
            onChange={(value) => updateField('tipoTratamiento', value)}
            options={TIPOS_TRATAMIENTO}
            error={errors.tipoTratamiento}
          />

          <Select
            label="Doctor responsable"
            badge="required"
            placeholder="Seleccione doctor"
            value={formData.doctor}
            onChange={(value) => updateField('doctor', value)}
            options={DOCTORES}
            error={errors.doctor}
          />

          <FullWidthField>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>Diagnóstico</span>
              <textarea
                value={formData.diagnostico}
                onChange={(event) => updateField('diagnostico', event.target.value)}
                placeholder="Ingrese diagnóstico clínico (opcional)"
                style={{
                  width: '100%',
                  minHeight: 88,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </label>
          </FullWidthField>
        </FormSection>

        <FormSection icon={<FileText size={18} />} title="Texto legal" columns={1}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: 'var(--arco-gray-50)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 16,
                maxHeight: 260,
                overflowY: 'auto',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--arco-navy)' }}>
                Consentimiento para tratamiento dental
              </h3>
              <p style={{ margin: '12px 0 0', fontSize: 13, lineHeight: 1.6, color: 'var(--arco-gray-700)' }}>
                Declaro que he recibido información clara y suficiente sobre el tratamiento dental indicado,
                sus beneficios, riesgos, alternativas, posibles molestias y cuidados posteriores. Autorizo al
                equipo clínico de WebArco Dental Studio a realizar el procedimiento descrito y confirmo que he
                tenido oportunidad de realizar preguntas antes de firmar este consentimiento.
              </p>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.aceptaTerminos}
                onChange={(event) => updateField('aceptaTerminos', event.target.checked)}
                style={{ marginTop: 2, accentColor: 'var(--arco-primary)' }}
              />
              <span style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.5 }}>
                He leído y acepto los términos del consentimiento informado.
              </span>
            </label>
            {errors.aceptaTerminos && (
              <span style={{ fontSize: 11, color: 'var(--arco-danger)' }}>{errors.aceptaTerminos}</span>
            )}
          </div>
        </FormSection>

        <FormSection icon={<Stethoscope size={18} />} title="Firmas" columns={2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <FirmaCanvas
              label="Firma del paciente"
              subtitle="Firme dentro del recuadro para registrar la autorización."
              onCapture={(signature) => updateField('firmaPaciente', signature)}
              isSigned={Boolean(formData.firmaPaciente)}
              disabled={loading}
            />
            {errors.firmaPaciente && <span style={{ fontSize: 11, color: 'var(--arco-danger)' }}>{errors.firmaPaciente}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <FirmaCanvas
              label="Firma del doctor"
              subtitle="Firma del responsable clínico del procedimiento."
              onCapture={(signature) => updateField('firmaDoctor', signature)}
              isSigned={Boolean(formData.firmaDoctor)}
              disabled={loading}
            />
            {errors.firmaDoctor && <span style={{ fontSize: 11, color: 'var(--arco-danger)' }}>{errors.firmaDoctor}</span>}
          </div>
        </FormSection>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            <CheckCircle size={16} />
            Registrar consentimiento
          </Button>
        </div>
      </form>
    </div>
  );
}

export default FormularioConsentimiento;
