import { useState } from 'react';
import {
  Card, Button, Input, PasswordInput, Select,
  Toggle, Avatar, Alert, FieldBadge, StatusBadge
} from './UIKit';

export function DesignSystemScreen() {
  const [toggle1, setToggle1] = useState(true);
  const [toggle2, setToggle2] = useState(false);
  const [selectVal, setSelectVal] = useState('');

  const colors = [
    { name: 'Primary', hex: '#0BC5DF', dark: false },
    { name: 'Primary Dark', hex: '#0899B0', dark: false },
    { name: 'Primary Light', hex: '#E6F8FB', dark: true },
    { name: 'Navy', hex: '#203F49', dark: false },
    { name: 'Success', hex: '#1D9E75', dark: false },
    { name: 'Warning', hex: '#EF9F27', dark: false },
    { name: 'Danger', hex: '#E24B4A', dark: false },
    { name: 'Gray 50', hex: '#F8F9FA', dark: true },
    { name: 'Gray 100', hex: '#F1F3F4', dark: true },
    { name: 'Gray 300', hex: '#D3D7DA', dark: true },
    { name: 'Gray 500', hex: '#888F94', dark: false },
    { name: 'Gray 700', hex: '#5F656A', dark: false },
    { name: 'Gray 900', hex: '#203F49', dark: false },
  ];

  const typeSamples = [
    { label: 'H1 — Heading 1', size: 24, weight: 600 },
    { label: 'H2 — Heading 2', size: 18, weight: 600 },
    { label: 'H3 — Heading 3', size: 16, weight: 500 },
    { label: 'Body — 14px Regular', size: 14, weight: 400 },
    { label: 'Label — 12px Medium', size: 12, weight: 500 },
    { label: 'Caption — 11px Regular', size: 11, weight: 400 },
  ];

  const statuses = ['programada', 'confirmada', 'cancelada', 'atendida', 'ausente', 'reprogramada'] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Typography */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49', marginBottom: 16 }}>Tipografía — Inter</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {typeSamples.map((t) => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'baseline', gap: 16, paddingBottom: 12, borderBottom: '0.5px solid #F1F3F4' }}>
              <span style={{ fontSize: 11, color: '#888F94', width: 180, flexShrink: 0 }}>{t.label}</span>
              <span style={{ fontSize: t.size, fontWeight: t.weight, color: '#203F49' }}>
                DentaSystem — ARCO Dental Studio
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Color palette */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49', marginBottom: 16 }}>Paleta de colores — ARCO Dental Studio</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
          {colors.map((c) => (
            <div key={c.name}>
              <div style={{
                height: 56, borderRadius: 8, background: c.hex,
                border: '0.5px solid #D3D7DA', marginBottom: 6,
                display: 'flex', alignItems: 'flex-end', padding: '6px 8px',
              }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: c.dark ? '#5F656A' : '#fff', letterSpacing: '0.04em' }}>
                  {c.hex}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#5F656A', fontWeight: 500 }}>{c.name}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Buttons */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49', marginBottom: 16 }}>Botones</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#888F94', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Variantes</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button variant="primary">Primario</Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" disabled>Desactivado</Button>
              <Button variant="primary" loading>Cargando</Button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888F94', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tamaños</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Button variant="primary" size="sm">Pequeño</Button>
              <Button variant="primary" size="md">Mediano</Button>
              <Button variant="primary" size="lg">Grande</Button>
              <Button variant="primary" size="lg" fullWidth>Ancho completo</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Form elements */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49', marginBottom: 16 }}>Campos de formulario</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Input label="Estado normal" badge="required" placeholder="Escribe aquí..." />
          <Input label="Con error" badge="required" placeholder="Escribe aquí..." error="Este campo es requerido" defaultValue="dato inválido" />
          <Input label="Desactivado" badge="optional" placeholder="No disponible" disabled />
          <Input label="Con ayuda" badge="conditional" placeholder="Solo si aplica" hint="Solo requerido para pacientes menores de edad" />
          <PasswordInput label="Contraseña" badge="required" placeholder="Mínimo 8 caracteres" />
          <Select
            label="Seleccionar tratamiento"
            badge="required"
            placeholder="Elige una opción..."
            value={selectVal}
            onChange={setSelectVal}
            options={[
              { value: 'limpieza', label: 'Limpieza dental' },
              { value: 'extraccion', label: 'Extracción' },
              { value: 'endodoncia', label: 'Endodoncia' },
              { value: 'ortodoncia', label: 'Ortodoncia' },
            ]}
          />
        </div>

        {/* Toggles */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '0.5px solid #F1F3F4' }}>
          <div style={{ fontSize: 11, color: '#888F94', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Toggles</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <Toggle checked={toggle1} onChange={setToggle1} label="Notificaciones activas" />
            <Toggle checked={toggle2} onChange={setToggle2} label="Recordatorios por SMS" />
          </div>
        </div>
      </Card>

      {/* Badges */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49', marginBottom: 16 }}>Badges</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#888F94', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Badges de campo</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <FieldBadge type="required" />
              <FieldBadge type="optional" />
              <FieldBadge type="conditional" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888F94', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estados de cita</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {statuses.map((s) => <StatusBadge key={s} status={s} />)}
            </div>
          </div>
        </div>
      </Card>

      {/* Alerts */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49', marginBottom: 16 }}>Alertas y notificaciones</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Alert variant="info" message="La cita de María González ha sido confirmada para las 09:00 hrs." />
          <Alert variant="success" message="Historia clínica actualizada correctamente. Los cambios han sido guardados." />
          <Alert variant="warning" message="Quedan 2 unidades de anestesia lidocaína 2%. Se recomienda reabastecer." />
          <Alert variant="error" message="Error al guardar el odontograma. Verifica tu conexión e intenta de nuevo." />
        </div>
      </Card>

      {/* Avatars */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49', marginBottom: 16 }}>Avatares</div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Avatar initials="KA" size={48} color="#0BC5DF" />
          <Avatar initials="MG" size={40} color="#1D9E75" />
          <Avatar initials="CV" size={36} color="#EF9F27" />
          <Avatar initials="AT" size={32} color="#E24B4A" />
          <Avatar initials="RD" size={28} color="#888F94" />
        </div>
      </Card>

      {/* Signature Canvas */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49', marginBottom: 4 }}>Canvas de firma</div>
        <div style={{ fontSize: 11, color: '#888F94', marginBottom: 16 }}>Zona para firma digital del paciente</div>
        <div style={{
          border: '1.5px dashed #D3D7DA', borderRadius: 8,
          height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F8F9FA', flexDirection: 'column', gap: 8,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 17l4-4 4 4 7-7" stroke="#D3D7DA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 12, color: '#888F94' }}>Firma aquí / Sign here</span>
          <span style={{ fontSize: 10, color: '#D3D7DA' }}>[FIRMA DEL PACIENTE]</span>
        </div>
      </Card>

      {/* Editable content zone placeholder */}
      <div style={{
        border: '2px dashed #0BC5DF', borderRadius: 12, padding: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 8, background: 'rgba(11,197,223,0.03)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0BC5DF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          [ZONA DE CONTENIDO EDITABLE]
        </span>
        <span style={{ fontSize: 12, color: '#888F94', textAlign: 'center' }}>
          Coloca aquí los componentes específicos de cada pantalla
        </span>
      </div>
    </div>
  );
}
