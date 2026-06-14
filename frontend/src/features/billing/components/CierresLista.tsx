import React from 'react';
import { Card } from '../../../context';
import { CierreHistorialItem } from '../../billing/types';
import { formatCurrency } from '../../../utils/formatters';

interface CierresListaProps {
  cierres?: CierreHistorialItem[];
  titulo?: string;
}

const COLORS = {
  primary: '#0BC5DF',
  success: '#1D9E75',
  danger: '#E24B4A',
  text: '#203F49',
  muted: '#888F94',
  borderLight: '#E5E7EB',
};

export function CierresLista({ cierres = [], titulo = 'Cierres de Caja' }: CierresListaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card>
        <h3 style={{ margin: 0, color: COLORS.text, fontSize: 16, fontWeight: 600 }}>
          {titulo}
        </h3>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: COLORS.muted }}>
          Cierres de caja diarios, semanales y mensuales.
        </p>

        {cierres.length === 0 ? (
          <p style={{ marginTop: 16, fontSize: 13, color: COLORS.muted }}>
            No hay cierres registrados.
          </p>
        ) : (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cierres.map((cierre) => (
              <div
                key={cierre.id_cierre}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: 10,
                  background: '#FAFAFA',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>
                    {cierre.tipo_cierre}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
                    {new Date(cierre.fecha).toLocaleDateString('es-HN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.success }}>
                    {formatCurrency(cierre.utilidad)}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
                    Ing: {formatCurrency(cierre.ingresos)} · Egr: {formatCurrency(cierre.egresos)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
