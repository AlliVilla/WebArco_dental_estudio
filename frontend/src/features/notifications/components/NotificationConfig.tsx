import React, { useState } from 'react';
import { Save, Clock, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotificationStore } from '../hooks/useNotifications';

const OPCIONES_MINUTOS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' },
  { value: 240, label: '4 horas' },
];

export const NotificationConfig: React.FC = () => {
  const { config, saveConfig, isSavingConfig } = useNotificationStore();
  const [minutos, setMinutos] = useState(config.minutos_anticipacion);
  const [emailActivo, setEmailActivo] = useState(config.email_notificaciones);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    setMinutos(config.minutos_anticipacion);
    setEmailActivo(config.email_notificaciones);
  }, [config]);

  const handleSave = async () => {
    await saveConfig({ minutos_anticipacion: minutos, email_notificaciones: emailActivo });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div
      style={{
        padding: '16px 20px',
        borderTop: '1px solid #E8EAEC',
        background: '#FAFBFC',
      }}
    >
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 12,
          fontWeight: 600,
          color: '#5F656A',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        ⚙ Configuración de Notificaciones
      </p>

      {/* Tiempo de anticipación */}
      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: '#203F49',
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          <Clock size={14} style={{ color: '#0BC5DF' }} />
          Avisarme con anticipación de:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {OPCIONES_MINUTOS.map((op) => (
            <button
              key={op.value}
              onClick={() => setMinutos(op.value)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: `1.5px solid ${minutos === op.value ? '#0BC5DF' : '#D3D7DA'}`,
                background: minutos === op.value ? '#E6F8FB' : '#fff',
                color: minutos === op.value ? '#0BC5DF' : '#5F656A',
                fontSize: 12,
                fontWeight: minutos === op.value ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle email */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: '#203F49',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Mail size={14} style={{ color: '#0BC5DF' }} />
          Recibir notificaciones por email
        </label>
        <button
          onClick={() => setEmailActivo(!emailActivo)}
          style={{
            width: 40,
            height: 22,
            borderRadius: 11,
            background: emailActivo ? '#0BC5DF' : '#D3D7DA',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
          aria-label={emailActivo ? 'Desactivar emails' : 'Activar emails'}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: emailActivo ? 21 : 3,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>

      {/* Botón guardar */}
      <button
        onClick={handleSave}
        disabled={isSavingConfig}
        style={{
          width: '100%',
          padding: '9px 0',
          background: saved ? '#1D9E75' : 'linear-gradient(135deg,#0BC5DF,#203F49)',
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: isSavingConfig ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'background 0.2s',
        }}
      >
        <Save size={14} />
        {isSavingConfig ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar configuración'}
      </button>
    </div>
  );
};
