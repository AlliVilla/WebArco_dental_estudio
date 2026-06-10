import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const responsiveStyle = `
.footer-grid {
  display: grid;
  grid-template-columns: 160px 1fr 1fr 1fr;
  gap: 32px;
  margin-bottom: 20px;
  align-items: start;
}
@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
`;

export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: '2px solid #0BC5DF',
      background: '#203F49',
      padding: '24px 24px 20px',
      marginTop: 'auto',
    }}>
    <style>{responsiveStyle}</style>
    <div className="footer-grid">

    {/* Logo placeholder */}
    <div style={{
      width: 120,
      height: 80,
      borderRadius: 10,
      border: '1.5px dashed #5F656A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
    <span style={{ fontSize: 10, color: '#5F656A', textAlign: 'center', lineHeight: '14px' }}>
    Logo<br />pendiente
    </span>
    </div>

    {/* Columna 1 — Identidad */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff' }}>
    ARCO Dental Studio
    </p>
    <p style={{ margin: 0, fontSize: 12, color: '#D3D7DA', lineHeight: '18px' }}>
    Clínica odontológica especializada en tratamientos
    estéticos y restaurativos para toda la familia.
    </p>
    </div>

    {/* Columna 2 — Contacto */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <p style={{
      margin: '0 0 4px', fontSize: 11, fontWeight: 600,
      color: '#0BC5DF', textTransform: 'uppercase', letterSpacing: '0.6px',
    }}>
    Contacto
    </p>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
    <MapPin size={13} style={{ color: '#0BC5DF', flexShrink: 0, marginTop: 1 }} />
    <span style={{ fontSize: 12, color: '#D3D7DA', lineHeight: '18px' }}>
    Col. Palmira, Blvd. Morazán,<br />Tegucigalpa, Honduras
    </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
    <Phone size={13} style={{ color: '#0BC5DF', flexShrink: 0 }} />
    <span style={{ fontSize: 12, color: '#D3D7DA' }}>+504 2235-0000</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
    <Phone size={13} style={{ color: '#0BC5DF', flexShrink: 0 }} />
    <span style={{ fontSize: 12, color: '#D3D7DA' }}>+504 9999-0000 (WhatsApp)</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
    <Mail size={13} style={{ color: '#0BC5DF', flexShrink: 0 }} />
    <span style={{ fontSize: 12, color: '#D3D7DA' }}>contacto@arcodental.hn</span>
    </div>
    </div>

    {/* Columna 3 — Horario */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <p style={{
      margin: '0 0 4px', fontSize: 11, fontWeight: 600,
      color: '#0BC5DF', textTransform: 'uppercase', letterSpacing: '0.6px',
    }}>
    Horario de atención
    </p>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
    <Clock size={13} style={{ color: '#0BC5DF', flexShrink: 0, marginTop: 1 }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {[
      { dias: 'Lunes – Viernes', horas: '8:00 AM – 6:00 PM' },
      { dias: 'Sábado',          horas: '8:00 AM – 1:00 PM' },
      { dias: 'Domingo',         horas: 'Cerrado' },
    ].map(({ dias, horas }) => (
      <div key={dias} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
      <span style={{ minWidth: 130, color: '#D3D7DA' }}>{dias}</span>
      <span style={{
        color: horas === 'Cerrado' ? '#E24B4A' : '#fff',
        fontWeight: horas === 'Cerrado' ? 400 : 500,
      }}>
      {horas}
      </span>
      </div>
    ))}
    </div>
    </div>
    </div>

    </div>

    {/* Línea de copyright */}
    <div style={{
      borderTop: '1px solid #2e5563',
      paddingTop: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
    <span style={{ fontSize: 11, color: '#888F94' }}>
    © {year} ARCO Dental Studio. Todos los derechos reservados.
    </span>
    <span style={{ fontSize: 11, color: '#5F656A' }}>
    WebArco v1.0
    </span>
    </div>
    </footer>
  );
}
