import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Spinner } from '../../../components';
import { Alert, useTheme } from '../../../context';
import { consentService } from '../services/consentService';
import type { ConsentimientoListItem } from '../types';
import { ListadoConsentimientos } from './ListadoConsentimientos';

export interface ConsentimientosScreenProps {}

export function ConsentimientosScreen(_props: ConsentimientosScreenProps) {
  useTheme();

  const [consentimientos, setConsentimientos] = useState<ConsentimientoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConsentimientos = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await consentService.getAll({ page: 1, limit: 50 });

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
    window.print();
    console.info(`Imprimiendo consentimiento ${id}`);
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
    return <Alert variant="error" message={`Error: ${error}`} />;
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
