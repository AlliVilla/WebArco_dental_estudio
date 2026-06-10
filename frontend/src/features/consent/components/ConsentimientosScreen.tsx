import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Alert, useTheme } from '../../../context';
import { consentService } from '../services/consentService';
import type { ConsentimientoListItem, ConsentimientoStats, EstadoFirma, QueryConsentimientoParams } from '../types';
import { ListadoConsentimientos, type ConsentimientosTableParams } from './ListadoConsentimientos';

export interface ConsentimientosScreenProps {}

const PAGE_SIZE = 10;

function mapTableParamsToQuery(params: ConsentimientosTableParams): QueryConsentimientoParams {
  const query: QueryConsentimientoParams = {
    page: params.page,
    limit: PAGE_SIZE,
  };

  if (params.search.trim()) {
    query.paciente = params.search.trim();
  }

  const estado = params.filters.estado_firmas;
  if (estado) {
    query.estado = estado as EstadoFirma;
  }

  const mes = params.filters.mes;
  if (mes) {
    const [anio, mesNumero] = mes.split('-');
    query.anio = Number(anio);
    query.mes = Number(mesNumero);
  }

  return query;
}

export function ConsentimientosScreen(_props: ConsentimientosScreenProps) {
  useTheme();

  const [consentimientos, setConsentimientos] = useState<ConsentimientoListItem[]>([]);
  const [stats, setStats] = useState<ConsentimientoStats | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleTableParamsChange = useCallback(async (params: ConsentimientosTableParams) => {
    try {
      setLoading(true);
      setError(null);

      const [listResponse, statsResponse] = await Promise.all([
        consentService.getAll(mapTableParamsToQuery(params)),
        consentService.getStats(),
      ]);

      if (listResponse.success && listResponse.data) {
        setConsentimientos(listResponse.data.data);
        setTotalRecords(listResponse.data.total);
      } else {
        setError(listResponse.message || 'Error al cargar consentimientos');
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return <Alert variant="error" message={`Error: ${error}`} />;
  }

  return (
    <ListadoConsentimientos
      consentimientos={consentimientos}
      stats={stats}
      totalRecords={totalRecords}
      onPrint={handlePrint}
      onViewDetail={handleViewDetail}
      onCreateNew={handleCreateNew}
      onTableParamsChange={handleTableParamsChange}
      loading={loading}
    />
  );
}

export default ConsentimientosScreen;
