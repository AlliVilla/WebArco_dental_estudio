import React from 'react';
import { Card } from '../../../context';

export function CierresLista() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card>
        <h3
          style={{
            margin: 0,
            color: '#203F49',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Cierres de Caja
        </h3>
        <p
          style={{ margin: '8px 0 0', fontSize: 13, color: '#888F94' }}
        >
          Cierres de caja diarios, semanales y mensuales.
        </p>
      </Card>
    </div>
  );
}
