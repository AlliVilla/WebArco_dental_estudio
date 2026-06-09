import React, { useState } from 'react';
import { AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Button, Card, Select, Input } from '../../../context';
import { FirmaCanvas } from './FirmaCanvas';

const TIPOS_TRATAMIENTO = [
  'Extracción dental',
  'Ortodoncia',
  'Implante dental',
  'Endodoncia (tratamiento de conducto)',
  'Blanqueamiento dental',
  'Cirugía oral',
  'Periodoncia',
  'Prótesis dental',
];

const DOCTORES = [
  'Dr. Carlos Méndez',
  'Dra. María González',
  'Dr. Juan Pérez',
  'Dra. Ana Martínez',
  'Dr. Roberto Silva',
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

export function FormularioConsentimiento({
  pacienteName = 'Ana María Rodríguez López',
  pacienteId = 'PAC-2024-00342',
  expediente = '',
  onSubmit,
  onCancel,
  loading = false,
}: FormularioConsentimientoProps) {
  const [formData, setFormData] = useState<ConsentimientoFormData>({
    tipoTratamiento: '',
    doctor: '',
    fecha: new Date().toISOString().split('T')[0],
    diagnostico: '',
    aceptaTerminos: false,
    firmaPaciente: '',
    firmaDoctor: '',
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleFirmaPaciente = (signatureData: string) => {
    setFormData({ ...formData, firmaPaciente: signatureData });
  };

  const handleFirmaDoctor = (signatureData: string) => {
    setFormData({ ...formData, firmaDoctor: signatureData });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Reset form
      setFormData({
        tipoTratamiento: '',
        doctor: '',
        fecha: new Date().toISOString().split('T')[0],
        diagnostico: '',
        aceptaTerminos: false,
        firmaPaciente: '',
        firmaDoctor: '',
      });
    }, 2000);
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, color: '#203F49', marginBottom: 8 }}>
          Consentimiento Informado
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#888F94' }}>
          Autorización para procedimientos dentales
        </p>
      </div>

      {/* Success message */}
      {showSuccess && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #1D9E75',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <CheckCircle size={20} style={{ color: '#1D9E75', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 14, color: '#1D9E75' }}>
            Consentimiento registrado exitosamente
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Patient Info */}
        <Card style={{ padding: 24 }}>
          <div style={{ backgroundColor: '#E6F8FB', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#203F49', marginBottom: 8 }}>
              Información del Paciente
            </h3>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#203F49' }}>{pacienteName}</p>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888F94' }}>
              ID: {pacienteId} {expediente && `| Expediente: ${expediente}`}
            </p>
          </div>

          {/* Form fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#203F49', display: 'block', marginBottom: 6 }}>
                Fecha <span style={{ color: '#E24B4A' }}>*</span>
              </label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: errors.fecha ? '2px solid #E24B4A' : '1px solid #D3D7DA',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              {errors.fecha && <p style={{ fontSize: 12, color: '#E24B4A', margin: '4px 0 0' }}>{errors.fecha}</p>}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#203F49', display: 'block', marginBottom: 6 }}>
                Tipo de Tratamiento <span style={{ color: '#E24B4A' }}>*</span>
              </label>
              <select
                name="tipoTratamiento"
                value={formData.tipoTratamiento}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: errors.tipoTratamiento ? '2px solid #E24B4A' : '1px solid #D3D7DA',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Seleccione tratamiento</option>
                {TIPOS_TRATAMIENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {errors.tipoTratamiento && (
                <p style={{ fontSize: 12, color: '#E24B4A', margin: '4px 0 0' }}>{errors.tipoTratamiento}</p>
              )}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#203F49', display: 'block', marginBottom: 6 }}>
                Doctor Responsable <span style={{ color: '#E24B4A' }}>*</span>
              </label>
              <select
                name="doctor"
                value={formData.doctor}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: errors.doctor ? '2px solid #E24B4A' : '1px solid #D3D7DA',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Seleccione doctor</option>
                {DOCTORES.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
              {errors.doctor && <p style={{ fontSize: 12, color: '#E24B4A', margin: '4px 0 0' }}>{errors.doctor}</p>}
            </div>
          </div>

          {/* Diagnostic field */}
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#203F49', display: 'block', marginBottom: 6 }}>
              Diagnóstico (Opcional)
            </label>
            <textarea
              name="diagnostico"
              value={formData.diagnostico}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #D3D7DA',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                minHeight: 80,
                resize: 'vertical',
              }}
              placeholder="Ingrese diagnóstico clínico (opcional)"
            />
          </div>
        </Card>

        {/* Legal text */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <FileText size={18} style={{ color: '#0BC5DF', flexShrink: 0 }} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#203F49' }}>
              Declaración de Consentimiento
            </h3>
          </div>

          <div
            style={{
              backgroundColor: '#F8F9FA',
              borderRadius: 8,
              padding: 16,
              maxHeight: 300,
              overflowY: 'auto',
              marginBottom: 16,
              fontSize: 13,
              color: '#203F49',
              lineHeight: 1.6,
            }}
          >
            <p>
              <strong>1. NATURALEZA DEL PROCEDIMIENTO:</strong> He sido informado(a) de manera clara y comprensible
              sobre la naturaleza del procedimiento dental que se me va a realizar, sus objetivos, beneficios esperados
              y las alternativas de tratamiento disponibles.
            </p>

            <p>
              <strong>2. RIESGOS Y COMPLICACIONES:</strong> Entiendo que todo procedimiento dental conlleva riesgos,
              incluyendo pero no limitado a: dolor postoperatorio, inflamación, sangrado, infección, reacciones
              alérgicas a medicamentos o materiales, daño a estructuras adyacentes, fracaso del tratamiento, y la
              necesidad de procedimientos adicionales. He tenido la oportunidad de hacer preguntas sobre estos riesgos.
            </p>

            <p>
              <strong>3. ANESTESIA:</strong> Autorizo la administración de anestesia local o sedación según sea
              necesario para el procedimiento. Comprendo los riesgos asociados con la anestesia, incluyendo reacciones
              adversas, toxicidad local, y complicaciones sistémicas.
            </p>

            <p>
              <strong>4. FOTOGRAFÍAS Y REGISTROS:</strong> Autorizo la toma de fotografías, radiografías, modelos
              dentales y otros registros diagnósticos necesarios para documentar mi caso y para fines educativos,
              manteniendo la confidencialidad de mi identidad.
            </p>

            <p>
              <strong>5. TRATAMIENTO DE EMERGENCIA:</strong> Autorizo al dentista a realizar procedimientos adicionales
              que sean necesarios durante el tratamiento si surgen complicaciones inesperadas y si mi condición médica
              lo requiere.
            </p>

            <p>
              <strong>6. RESPONSABILIDADES DEL PACIENTE:</strong> Me comprometo a seguir todas las instrucciones
              postoperatorias, asistir a las citas de control programadas, y mantener una adecuada higiene oral. Entiendo
              que el éxito del tratamiento depende en gran medida de mi cooperación.
            </p>

            <p>
              <strong>7. COSTO Y PAGOS:</strong> He sido informado(a) sobre el costo estimado del tratamiento y las
              opciones de pago disponibles. Entiendo que soy responsable del pago de los servicios prestados.
            </p>

            <p>
              <strong>8. PREGUNTAS Y DUDAS:</strong> He tenido la oportunidad de hacer todas las preguntas necesarias
              sobre el procedimiento propuesto y todas mis dudas han sido aclaradas satisfactoriamente.
            </p>

            <div
              style={{
                backgroundColor: '#E3F8FC',
                borderLeft: '4px solid #0BC5DF',
                padding: 12,
                marginTop: 16,
                borderRadius: 4,
              }}
            >
              <p style={{ margin: 0, fontSize: 13 }}>
                <strong>DECLARACIÓN:</strong> Certifico que he leído y comprendido este documento de consentimiento
                informado. He discutido el procedimiento propuesto con mi dentista y todas mis preguntas han sido
                respondidas. Doy mi consentimiento voluntario para el tratamiento dental descrito anteriormente.
              </p>
            </div>
          </div>

          {/* Terms checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <input
              type="checkbox"
              id="aceptaTerminos"
              name="aceptaTerminos"
              checked={formData.aceptaTerminos}
              onChange={handleChange}
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
                cursor: 'pointer',
                accentColor: '#0BC5DF',
              }}
            />
            <label htmlFor="aceptaTerminos" style={{ cursor: 'pointer', fontSize: 13, color: '#203F49' }}>
              He leído, comprendido y acepto todos los términos y condiciones del consentimiento informado. Autorizo al
              profesional de la salud a realizar el procedimiento dental descrito.
              <span style={{ color: '#E24B4A', marginLeft: 6 }}>*</span>
            </label>
          </div>
          {errors.aceptaTerminos && (
            <p style={{ fontSize: 12, color: '#E24B4A', margin: '8px 0 0 30px' }}>{errors.aceptaTerminos}</p>
          )}
        </Card>

        {/* Signatures */}
        <Card style={{ padding: 24 }}>
          <div
            style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #EF9F27',
              borderRadius: 8,
              padding: 12,
              marginBottom: 24,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <AlertCircle size={18} style={{ color: '#EF9F27', flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 12, color: '#203F49' }}>
              Las firmas digitales son <strong>obligatorias</strong> para validar el consentimiento. Use el mouse o
              pantalla táctil para firmar en los recuadros correspondientes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            <div>
              <FirmaCanvas
                label="Firma del Paciente"
                subtitle={pacienteName}
                onCapture={handleFirmaPaciente}
                isSigned={!!formData.firmaPaciente}
              />
              {errors.firmaPaciente && (
                <p style={{ fontSize: 12, color: '#E24B4A', margin: '8px 0 0' }}>{errors.firmaPaciente}</p>
              )}
            </div>

            <div>
              <FirmaCanvas
                label="Firma del Doctor"
                subtitle={formData.doctor || 'Doctor responsable'}
                onCapture={handleFirmaDoctor}
                isSigned={!!formData.firmaDoctor}
              />
              {errors.firmaDoctor && (
                <p style={{ fontSize: 12, color: '#E24B4A', margin: '8px 0 0' }}>{errors.firmaDoctor}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Submit buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Consentimiento'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default FormularioConsentimiento;
