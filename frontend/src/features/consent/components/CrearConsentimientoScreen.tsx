import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../context';
import { FormularioConsentimiento, ConsentimientoFormData } from './FormularioConsentimiento';
import { consentService } from '../services/consentService';

export function CrearConsentimientoScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (data: ConsentimientoFormData) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Obtener IDs reales del paciente y doctor desde el contexto o parámetros
      const response = await consentService.create({
        id_paciente: 1, // Placeholder - obtener del estado de la app
        id_doctor: 1,   // Placeholder - obtener del usuario logueado
        tipo_tratamiento: data.tipoTratamiento,
        fecha: data.fecha,
        diagnostico: data.diagnostico,
        firma_paciente: data.firmaPaciente,
        firma_doctor: data.firmaDoctor,
      });

      if (response.success) {
        // Navegar a la pantalla de detalles del nuevo consentimiento
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
    <div>
      {error && (
        <div style={{ marginBottom: 24 }}>
          <Card style={{ backgroundColor: '#FFE8EC', borderColor: '#E24B4A', padding: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#E24B4A' }}>Error: {error}</p>
          </Card>
        </div>
      )}

      <FormularioConsentimiento
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  );
}

export default CrearConsentimientoScreen;
