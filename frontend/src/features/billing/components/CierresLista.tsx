import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { DataTable } from '../../../components';
import { Card, Button } from '../../../context';
import { api } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatters';

export function CierresLista() {
  const [cierres, setCierres] = useState<any[]>([]);

  useEffect(() => {
    const fetchCierres = async () => {
      try {
        const res = await api.get('/cierre');
        setCierres(res.data || []);
      } catch (error) {
        console.error("Error fetching cierres:", error);
      }
    };
    fetchCierres();
  }, []);

  const generarCierreCaja = async () => {
    try {
      const res = await api.post('/cierre', {});
      alert(res.message || 'Cierre generado exitosamente');
      // Refresh list
      const fetchRes = await api.get('/cierre');
      setCierres(fetchRes.data || []);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al generar el cierre');
    }
  };

  const columns = [
    {
      key: 'fecha',
      label: 'Fecha',
      render: (val: any) => new Date(val).toLocaleDateString(),
    },
    {
      key: 'ingresos',
      label: 'Ingresos',
      render: (val: any) => <span style={{ color: '#1D9E75', fontWeight: 600 }}>{formatCurrency(Number(val))}</span>,
    },
    {
      key: 'egresos',
      label: 'Egresos',
      render: (val: any) => <span style={{ color: '#E24B4A', fontWeight: 600 }}>{formatCurrency(Number(val))}</span>,
    },
    {
      key: 'saldo',
      label: 'Saldo',
      render: (val: any) => <span style={{ color: '#0BC5DF', fontWeight: 600 }}>{formatCurrency(Number(val))}</span>,
    },
    {
      key: 'usuario',
      label: 'Generado por',
      render: (_val: any, record: any) => {
        const p = record.usuario?.persona;
        return p ? `${p.primer_nombre} ${p.primer_apellido}` : record.usuario?.username;
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#203F49', fontSize: 24, fontWeight: 700 }}>
          Cierres de Caja
        </h2>
        <Button variant="primary" onClick={generarCierreCaja}>
          <Lock size={16} style={{ marginRight: 8 }} />
          Generar Cierre de Caja
        </Button>
      </div>

      <Card>
        <DataTable
          title="Historial de Cierres"
          description="Historial de cortes de caja almacenados"
          columns={columns}
          data={cierres}
          searchable={false}
          getRowKey={(row) => row.id_cierre}
          emptyMessage="No hay cierres registrados."
        />
      </Card>
    </div>
  );
}
