import React from 'react';
import { Card } from '../../../context';
import { CierreHistorialItem, TipoCierre } from '../../billing/types';
import { formatCurrency } from '../../../utils/formatters';

interface CierresListaProps {
  cierres?: CierreHistorialItem[];
  titulo?: string;
  tipoPeriodo?: TipoCierre;
  fechaInicio?: string;
  fechaFin?: string;
}

const COLORS = {
  primary: '#0BC5DF',
  success: '#1D9E75',
  danger: '#E24B4A',
  text: '#203F49',
  muted: '#888F94',
  borderLight: '#E5E7EB',
};

export function CierresLista({
  cierres = [],
  titulo = 'Cierres de Caja',
  tipoPeriodo,
  fechaInicio,
  fechaFin,
}: CierresListaProps) {
  const isRangoValido = !!(fechaInicio && fechaFin);

  const cierresFiltrados = React.useMemo(() => {
    if (isRangoValido) {
      return cierres.filter((c) => {
        if (!c.fecha) return false;
        const cDateStr = c.fecha.split('T')[0];
        return c.tipo_cierre === 'Diario' && cDateStr >= fechaInicio && cDateStr <= fechaFin;
      });
    } else if (tipoPeriodo) {
      return cierres.filter((c) => c.tipo_cierre === tipoPeriodo);
    }
    return cierres;
  }, [cierres, isRangoValido, fechaInicio, fechaFin, tipoPeriodo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card>
        <h3 style={{ margin: 0, color: COLORS.text, fontSize: 16, fontWeight: 600 }}>
          {titulo}
        </h3>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: COLORS.muted }}>
          Cierres de caja diarios, semanales y mensuales.
        </p>

        {cierresFiltrados.length === 0 ? (
          <p style={{ marginTop: 16, fontSize: 13, color: COLORS.muted }}>
            {isRangoValido
              ? 'No hay cierres registrados en el rango de fechas seleccionado.'
              : 'No hay cierres registrados.'}
          </p>
        ) : (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cierresFiltrados.map((cierre) => (
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
                    {(() => {
                      if (!cierre.fecha) return '—';
                      const parts = cierre.fecha.split('T')[0].split('-');
                      if (parts.length !== 3) return cierre.fecha;
                      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                      return dateObj.toLocaleDateString('es-HN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                    })()}
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
