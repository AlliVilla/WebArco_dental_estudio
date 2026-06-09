import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../../../components';
import { Card } from '../../../context';
import { ListadoConsentimientos } from './ListadoConsentimientos';
import { consentService } from '../services/consentService';
import { ConsentimientoListItem } from '../types';

export function ConsentimientosScreen() {
  const [consentimientos, setConsentimientos] = useState<ConsentimientoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConsentimientos = async () => {
      try {
        setLoading(true);
        const response = await consentService.getAll({
          page: 1,
          limit: 50,
        });

        if (response.success && response.data) {
          setConsentimientos(response.data.data);
        } else {
          setError(response.message || 'Error al cargar consentimientos');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchConsentimientos();
  }, []);

  const handlePrint = (id: number) => {
    // TODO: Implementar descarga de PDF
    alert(`Descargando consentimiento ${id}...`);
  };

  const handleViewDetail = (id: number) => {
    navigate(`/consent/detail/${id}`);
  };

  const handleCreateNew = () => {
    navigate('/consent/nuevo');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card style={{ backgroundColor: '#FFE8EC', borderColor: '#E24B4A', padding: 16 }}>
          <p style={{ margin: 0, fontSize: 14, color: '#E24B4A' }}>Error: {error}</p>
        </Card>
      </div>
    );
  }

  return (
    <ListadoConsentimientos
      consentimientos={consentimientos}
      onPrint={handlePrint}
      onViewDetail={handleViewDetail}
      onCreateNew={handleCreateNew}
      loading={loading}
    />
  );
}

export default ConsentimientosScreen;
