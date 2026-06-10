import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Alert, useTheme } from '../../../context';
import { consentService } from '../services/consentService';
import { FormularioConsentimiento, type ConsentimientoFormData } from './FormularioConsentimiento';

export interface CrearConsentimientoScreenProps {}

export function CrearConsentimientoScreen(_props: CrearConsentimientoScreenProps) {
  useTheme();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (data: ConsentimientoFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await consentService.create({
        id_paciente: 1,
        id_doctor: 1,
        tipo_tratamiento: data.tipoTratamiento,
        fecha: data.fecha,
        diagnostico: data.diagnostico,
        firma_paciente: data.firmaPaciente,
        firma_doctor: data.firmaDoctor,
      });

      if (response.success) {
        navigate('/consent', { replace: true });
      } else {
        setError(response.message || 'Error al registrar consentimiento');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/consent');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {error && <Alert variant="error" message={`Error: ${error}`} />}
      <FormularioConsentimiento onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
    </div>
  );
}

export default CrearConsentimientoScreen;
