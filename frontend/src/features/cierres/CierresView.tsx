import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  LineChart,
  Lock,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Alert, Button, Card, Input, Select } from '../../context';
import { billingService } from '../billing';
import { CierreHistorialItem, TipoCierre } from '../billing/types';
import { formatCurrency } from '../../utils/formatters';

// Constantes de colores del sistema de diseño
const COLORS = {
  primary: '#0BC5DF',
  success: '#1D9E75',
  danger: '#E24B4A',
  text: '#203F49',
  muted: '#888F94',
  borderLight: '#E5E7EB',
};

// ---------- helpers ----------

function formatFechaRango(item: CierreHistorialItem): string {
  const fecha = new Date(item.fecha);
  const opciones: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  const fin = fecha.toLocaleDateString('es-HN', opciones);

  const inicio = new Date(fecha);
  switch (item.tipo_cierre) {
    case 'Semanal':
      inicio.setDate(inicio.getDate() - 6);
      break;
    case 'Quincenal':
      inicio.setDate(inicio.getDate() - 14);
      break;
    case 'Mensual':
      inicio.setMonth(inicio.getMonth() - 1);
      break;
    default:
      return fin;
  }

  return `${inicio.toLocaleDateString('es-HN', opciones)} – ${fin}`;
}

/** Devuelve el porcentaje comparativo de utilidad entre el cierre actual y el anterior (2 decimales).
 *  Positivo = mejoró, negativo = empeoró. Retorna 0 si no hay período anterior. */
function calcularComparativa(
  actual: CierreHistorialItem,
  anterior: CierreHistorialItem | undefined,
): number {
  if (!anterior || anterior.utilidad === 0) return 0;
  const pct = ((actual.utilidad - anterior.utilidad) / Math.abs(anterior.utilidad)) * 100;
  return parseFloat(pct.toFixed(2));
}

/** Convierte los montos absolutos en porcentajes de desglose de pago (máx. 2 decimales). */
function calcularDesglose(item: CierreHistorialItem): {
  efectivo: number;
  tarjeta: number;
  transfer: number;
} {
  const total = item.efectivo + item.tarjeta + item.transferencia;
  if (total === 0) return { efectivo: 0, tarjeta: 0, transfer: 0 };

  const pct = (v: number) => parseFloat(((v / total) * 100).toFixed(2));

  const efectivo = pct(item.efectivo);
  const tarjeta = pct(item.tarjeta);
  // El tercero se calcula por complemento para que siempre sumen exactamente 100.00
  const transfer = parseFloat((100 - efectivo - tarjeta).toFixed(2));

  return { efectivo, tarjeta, transfer };
}

// ---------- component ----------

export function CierresView() {
  const [activeTab, setActiveTab] = useState<'diario' | 'periodico'>('diario');
  const [fechaCierre, setFechaCierre] = useState(new Date().toISOString().split('T')[0]);
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoCierre>('Semanal');

  // Datos del backend
  const [historial, setHistorial] = useState<CierreHistorialItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [creandoCierre, setCreandoCierre] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ---------- fetch al montar ----------
  const cargarHistorial = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await billingService.getCierreHistorial();
      if (respuesta.success && respuesta.data) {
        setHistorial(respuesta.data);
      } else {
        setError(respuesta.message ?? 'Error al cargar el historial de cierres.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  const handleCerrarDia = async () => {
    setCreandoCierre(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await billingService.createCierre('Diario');
      if (res.success) {
        setSuccessMsg(res.message ?? 'Cierre de caja generado exitosamente');
        await cargarHistorial();
      } else {
        setError(res.message ?? 'Error al crear el cierre');
      }
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Error al conectar con el servidor.');
    } finally {
      setCreandoCierre(false);
    }
  };

  // ---------- datos derivados para el tab Diario ----------
  const cierreDiarioHoy: CierreHistorialItem | undefined = historial.find((c) => {
    const fecha = new Date(c.fecha);
    const hoy = new Date(fechaCierre);
    return (
      c.tipo_cierre === 'Diario' &&
      fecha.getFullYear() === hoy.getFullYear() &&
      fecha.getMonth() === hoy.getMonth() &&
      fecha.getDate() === hoy.getDate()
    );
  });

  const summaryData = cierreDiarioHoy
    ? {
        totalIngresos: cierreDiarioHoy.ingresos,
        ingresosEfectivo: cierreDiarioHoy.efectivo,
        ingresosTarjeta: cierreDiarioHoy.tarjeta,
        ingresosTransferencia: cierreDiarioHoy.transferencia,
        totalEgresos: cierreDiarioHoy.egresos,
        utilidadNeta: cierreDiarioHoy.utilidad,
      }
    : {
        totalIngresos: 0,
        ingresosEfectivo: 0,
        ingresosTarjeta: 0,
        ingresosTransferencia: 0,
        totalEgresos: 0,
        utilidadNeta: 0,
      };

  // ---------- datos derivados para el tab Periódico ----------
  const cierresFiltrados = historial.filter((c) => c.tipo_cierre === tipoPeriodo);

  const periodicSummary = cierresFiltrados.length > 0
    ? {
        ingresos: cierresFiltrados[0].ingresos,
        egresos: cierresFiltrados[0].egresos,
        utilidad: cierresFiltrados[0].utilidad,
        comparativa: calcularComparativa(cierresFiltrados[0], cierresFiltrados[1]),
      }
    : { ingresos: 0, egresos: 0, utilidad: 0, comparativa: 0 };

  const filasTabla = cierresFiltrados.map((item, idx) => ({
    ...item,
    comparativa: calcularComparativa(item, cierresFiltrados[idx + 1]),
    desglose: calcularDesglose(item),
    periodo: item.tipo_cierre,
    fecha: formatFechaRango(item),
  }));

  // ---------- render ----------
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        height: '100%',
        minHeight: 0,
        overflowY: 'auto',
      }}
    >
      {/* Banner de error o éxito global */}
      {error && <Alert variant="error" message={error} />}
      {successMsg && <Alert variant="success" message={successMsg} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setActiveTab('diario')}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 600,
            border: `1px solid ${activeTab === 'diario' ? COLORS.primary : COLORS.borderLight}`,
            background: activeTab === 'diario' ? COLORS.primary : '#fff',
            color: activeTab === 'diario' ? '#fff' : COLORS.muted,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Cierre Diario
        </button>
        <button
          onClick={() => setActiveTab('periodico')}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 600,
            border: `1px solid ${activeTab === 'periodico' ? COLORS.primary : COLORS.borderLight}`,
            background: activeTab === 'periodico' ? COLORS.primary : '#fff',
            color: activeTab === 'periodico' ? '#fff' : COLORS.muted,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Cierres Semanales / Quincenales / Mensuales
        </button>
      </div>

      {/* Alertas informativas */}
      {activeTab === 'diario' ? (
        <>
          <Alert
            variant="info"
            message="Los cierres diarios se calculan automáticamente en base a los ingresos y egresos registrados"
          />
          <Alert
            variant="warning"
            message="El cierre de día es una acción definitiva y requiere permisos de Administrador o Contador"
          />
        </>
      ) : (
        <Alert
          variant="info"
          message="Los cierres consolidados muestran el resumen financiero del periodo seleccionado y desglose por método de pago"
        />
      )}

      {/* ══════════════════════════════ TAB DIARIO ══════════════════════════════ */}
      {activeTab === 'diario' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Selector de fecha */}
          <div style={{ maxWidth: 400 }}>
            <Input
              type="date"
              label="Fecha del cierre"
              badge="required"
              value={fechaCierre}
              onChange={(e) => setFechaCierre(e.target.value)}
              rightElement={
                <Button
                  variant="secondary"
                  size="sm"
                  style={{ borderRadius: 8, padding: '4px 12px' }}
                  onClick={() => setFechaCierre(new Date().toISOString().split('T')[0])}
                >
                  <Calendar size={14} style={{ marginRight: 4 }} />
                  Hoy
                </Button>
              }
            />
          </div>

          {/* Estado de carga */}
          {cargando && (
            <p style={{ color: COLORS.muted, fontSize: 14 }}>Cargando datos del cierre…</p>
          )}

          {/* Cards de resumen */}
          {!cargando && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16, fontWeight: 600 }}>
                Resumen del día
              </h3>

              {!cierreDiarioHoy && (
                <p style={{ color: COLORS.muted, fontSize: 13, marginBottom: 16 }}>
                  No hay un cierre registrado para esta fecha. Los valores muestran cero.
                </p>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 16,
                }}
              >
                {/* Total Ingresos */}
                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Total ingresos del día</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(summaryData.totalIngresos)}</div>
                  </div>
                  <div style={{ background: '#E6F8FB', padding: 12, borderRadius: 8, display: 'flex' }}>
                    <DollarSign size={24} color={COLORS.primary} />
                  </div>
                </div>

                {/* Efectivo */}
                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Ingresos en efectivo</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success }}>{formatCurrency(summaryData.ingresosEfectivo)}</div>
                  </div>
                  <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 8, display: 'flex' }}>
                    <Wallet size={24} color={COLORS.success} />
                  </div>
                </div>

                {/* Tarjeta */}
                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Ingresos por tarjeta</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(summaryData.ingresosTarjeta)}</div>
                  </div>
                  <div style={{ background: '#E6F8FB', padding: 12, borderRadius: 8, display: 'flex' }}>
                    <CreditCard size={24} color={COLORS.primary} />
                  </div>
                </div>

                {/* Transferencia */}
                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Ingresos por transferencia</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(summaryData.ingresosTransferencia)}</div>
                  </div>
                  <div style={{ background: '#E6F8FB', padding: 12, borderRadius: 8, display: 'flex' }}>
                    <ArrowRightLeft size={24} color={COLORS.primary} />
                  </div>
                </div>

                {/* Egresos */}
                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Total egresos del día</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.danger }}>{formatCurrency(summaryData.totalEgresos)}</div>
                  </div>
                  <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 8, display: 'flex' }}>
                    <TrendingDown size={24} color={COLORS.danger} />
                  </div>
                </div>

                {/* Utilidad */}
                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Utilidad neta del día</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success }}>{formatCurrency(summaryData.utilidadNeta)}</div>
                  </div>
                  <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 8, display: 'flex' }}>
                    <TrendingUp size={24} color={COLORS.success} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button variant="secondary">
              <Download size={16} />
              Exportar cierre
            </Button>
            <Button variant="primary" onClick={handleCerrarDia} disabled={creandoCierre}>
              <Lock size={16} />
              {creandoCierre ? 'Cerrando...' : 'Cerrar día'}
            </Button>
          </div>
        </Card>
      )}

      {/* ══════════════════════════ TAB PERIÓDICO ═══════════════════════════════ */}
      {activeTab === 'periodico' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Filtros */}
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
              <Select
                label="Tipo de periodo"
                badge="required"
                options={[
                  { value: 'Semanal', label: 'Semanal' },
                  { value: 'Quincenal', label: 'Quincenal' },
                  { value: 'Mensual', label: 'Mensual' },
                ]}
                value={tipoPeriodo}
                onChange={(v) => setTipoPeriodo(v as TipoCierre)}
              />
            </div>
          </Card>

          {/* Estado de carga */}
          {cargando && (
            <p style={{ color: COLORS.muted, fontSize: 14 }}>Cargando historial de cierres…</p>
          )}

          {!cargando && (
            <>
              {/* Cards de consolidado */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16, fontWeight: 600 }}>
                  Consolidado del período
                </h3>

                {cierresFiltrados.length === 0 && (
                  <p style={{ color: COLORS.muted, fontSize: 13, marginBottom: 16 }}>
                    No hay cierres {tipoPeriodo.toLowerCase()}es registrados aún.
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  {/* Ingresos */}
                  <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Ingresos totales del periodo</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(periodicSummary.ingresos)}</div>
                    </div>
                    <div style={{ background: '#E6F8FB', padding: 12, borderRadius: 8, display: 'flex' }}>
                      <DollarSign size={24} color={COLORS.primary} />
                    </div>
                  </div>

                  {/* Egresos */}
                  <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Egresos totales del periodo</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.danger }}>{formatCurrency(periodicSummary.egresos)}</div>
                    </div>
                    <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 8, display: 'flex' }}>
                      <TrendingDown size={24} color={COLORS.danger} />
                    </div>
                  </div>

                  {/* Utilidad */}
                  <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Utilidad neta</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success }}>{formatCurrency(periodicSummary.utilidad)}</div>
                    </div>
                    <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 8, display: 'flex' }}>
                      <TrendingUp size={24} color={COLORS.success} />
                    </div>
                  </div>

                  {/* Comparativa */}
                  <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Comparativo vs periodo anterior</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: periodicSummary.comparativa >= 0 ? COLORS.success : COLORS.danger }}>
                        {periodicSummary.comparativa > 0 ? '+' : ''}{periodicSummary.comparativa.toFixed(2)}%
                      </div>
                    </div>
                    <div style={{ background: periodicSummary.comparativa >= 0 ? '#ECFDF5' : '#FEF2F2', padding: 12, borderRadius: 8, display: 'flex' }}>
                      {periodicSummary.comparativa >= 0
                        ? <TrendingUp size={24} color={COLORS.success} />
                        : <TrendingDown size={24} color={COLORS.danger} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de historial */}
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${COLORS.borderLight}` }}>
                  <h3 style={{ margin: 0, color: COLORS.text, fontSize: 16, fontWeight: 600 }}>
                    Historial de cierres
                  </h3>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                    <thead style={{ background: '#F8F9FA' }}>
                      <tr>
                        {['Período', 'Rango de fechas', 'Ingresos', 'Egresos', 'Utilidad', 'Desglose métodos de pago', 'Comparativa', 'Responsable'].map((col) => (
                          <th
                            key={col}
                            style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: COLORS.muted, borderBottom: `1px solid ${COLORS.borderLight}` }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filasTabla.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '32px 20px', textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>
                            No hay cierres registrados para el período seleccionado.
                          </td>
                        </tr>
                      ) : (
                        filasTabla.map((fila, idx) => {
                          const borde = idx < filasTabla.length - 1 ? { borderBottom: `1px solid ${COLORS.borderLight}` } : {};
                          const nombreResponsable = fila.usuario
                            ? fila.usuario.persona
                              ? `${fila.usuario.persona.primer_nombre} ${fila.usuario.persona.primer_apellido}`
                              : fila.usuario.username
                            : '—';

                          return (
                            <tr key={fila.id_cierre}>
                              <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.text, fontWeight: 500, ...borde }}>{fila.periodo}</td>
                              <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.text, ...borde }}>{fila.fecha}</td>
                              <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.primary, fontWeight: 600, ...borde }}>{formatCurrency(fila.ingresos)}</td>
                              <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.danger, fontWeight: 600, ...borde }}>{formatCurrency(fila.egresos)}</td>
                              <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.success, fontWeight: 600, ...borde }}>{formatCurrency(fila.utilidad)}</td>
                              <td style={{ padding: '16px 20px', fontSize: 12, color: COLORS.text, ...borde }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <span>Efectivo:&nbsp;&nbsp;{fila.desglose.efectivo.toFixed(2)}%</span>
                                  <span>Tarjeta:&nbsp;&nbsp;&nbsp;{fila.desglose.tarjeta.toFixed(2)}%</span>
                                  <span>Transfer:&nbsp;&nbsp;{fila.desglose.transfer.toFixed(2)}%</span>
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px', ...borde }}>
                                <div style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '4px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                  background: fila.comparativa >= 0 ? '#ECFDF5' : '#FEF2F2',
                                  color: fila.comparativa >= 0 ? COLORS.success : COLORS.danger,
                                }}>
                                  {fila.comparativa >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                  {fila.comparativa > 0 ? '+' : ''}{fila.comparativa.toFixed(2)}%
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.text, ...borde }}>
                                {nombreResponsable}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="secondary">
              <Download size={16} />
              Exportar consolidado
            </Button>
            <Button variant="secondary">
              <LineChart size={16} />
              Ver comparativo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
