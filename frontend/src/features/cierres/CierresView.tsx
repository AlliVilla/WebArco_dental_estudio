import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  Wallet,
  CreditCard,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
  Download,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  LineChart
} from 'lucide-react';
import { Alert, Button, Card, Input, Select } from '../../context';

// Constants for UI colors matching the design system
const COLORS = {
  primary: '#0BC5DF', // Teal
  success: '#1D9E75', // Green
  danger: '#E24B4A', // Red
  text: '#203F49', // Dark Blue/Gray
  muted: '#888F94', // Light Gray
  borderLight: '#E5E7EB', // Lighter Gray for borders
};

export function CierresView() {
  const [activeTab, setActiveTab] = useState<'diario' | 'periodico'>('diario');
  const [fechaCierre, setFechaCierre] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Mock data as requested by the UI design layout
  const summaryData = {
    totalIngresos: 12450.0,
    ingresosEfectivo: 4200.0,
    ingresosTarjeta: 5800.0,
    ingresosTransferencia: 2450.0,
    totalEgresos: 3200.0,
    utilidadNeta: 9250.0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const periodicSummary = {
    ingresos: 87450.00,
    egresos: 22100.00,
    utilidad: 65350.00,
    comparativa: 12.5
  };

  const periodicData = [
    {
      id: 1,
      periodo: 'Semanal',
      fecha: '27/05/2026 - 02/06/2026',
      ingresos: 87450.00,
      egresos: 22100.00,
      utilidad: 65350.00,
      desglose: { efectivo: 35, tarjeta: 45, transfer: 20 },
      comparativa: 12.5,
    },
    {
      id: 2,
      periodo: 'Semanal',
      fecha: '20/05/2026 - 26/05/2026',
      ingresos: 78200.00,
      egresos: 19800.00,
      utilidad: 58400.00,
      desglose: { efectivo: 38, tarjeta: 42, transfer: 20 },
      comparativa: -5.2,
    }
  ];

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
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setActiveTab('diario')}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 600,
            border: `1px solid ${
              activeTab === 'diario' ? COLORS.primary : COLORS.borderLight
            }`,
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
            border: `1px solid ${
              activeTab === 'periodico' ? COLORS.primary : COLORS.borderLight
            }`,
            background: activeTab === 'periodico' ? COLORS.primary : '#fff',
            color: activeTab === 'periodico' ? '#fff' : COLORS.muted,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Cierres Semanales / Quincenales / Mensuales
        </button>
      </div>

      {/* Alerts */}
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

      {/* Main Content Area */}
      {activeTab === 'diario' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Form Section */}
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
                  style={{
                    marginLeft: 8,
                    borderRadius: 8,
                    padding: '4px 12px',
                  }}
                  onClick={() =>
                    setFechaCierre(new Date().toISOString().split('T')[0])
                  }
                >
                  <Calendar size={14} style={{ marginRight: 4 }} />
                  Hoy
                </Button>
              }
            />
          </div>

          {/* Summary Section */}
          <div>
            <h3
              style={{
                margin: '0 0 16px 0',
                color: COLORS.text,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Resumen del día
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 16,
              }}
            >
              {/* Total Ingresos */}
              <div
                style={{
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
                    Total ingresos del día
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>
                    {formatCurrency(summaryData.totalIngresos)}
                  </div>
                </div>
                <div
                  style={{
                    background: '#E6F8FB',
                    padding: 12,
                    borderRadius: 8,
                    display: 'flex',
                  }}
                >
                  <DollarSign size={24} color={COLORS.primary} />
                </div>
              </div>

              {/* Ingresos en efectivo */}
              <div
                style={{
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
                    Ingresos en efectivo
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success }}>
                    {formatCurrency(summaryData.ingresosEfectivo)}
                  </div>
                </div>
                <div
                  style={{
                    background: '#ECFDF5',
                    padding: 12,
                    borderRadius: 8,
                    display: 'flex',
                  }}
                >
                  <Wallet size={24} color={COLORS.success} />
                </div>
              </div>

              {/* Ingresos por tarjeta */}
              <div
                style={{
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
                    Ingresos por tarjeta
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>
                    {formatCurrency(summaryData.ingresosTarjeta)}
                  </div>
                </div>
                <div
                  style={{
                    background: '#E6F8FB',
                    padding: 12,
                    borderRadius: 8,
                    display: 'flex',
                  }}
                >
                  <CreditCard size={24} color={COLORS.primary} />
                </div>
              </div>

              {/* Ingresos por transferencia */}
              <div
                style={{
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
                    Ingresos por transferencia
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>
                    {formatCurrency(summaryData.ingresosTransferencia)}
                  </div>
                </div>
                <div
                  style={{
                    background: '#E6F8FB',
                    padding: 12,
                    borderRadius: 8,
                    display: 'flex',
                  }}
                >
                  <ArrowRightLeft size={24} color={COLORS.primary} />
                </div>
              </div>

              {/* Total Egresos */}
              <div
                style={{
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
                    Total egresos del día
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.danger }}>
                    {formatCurrency(summaryData.totalEgresos)}
                  </div>
                </div>
                <div
                  style={{
                    background: '#FEF2F2',
                    padding: 12,
                    borderRadius: 8,
                    display: 'flex',
                  }}
                >
                  <TrendingDown size={24} color={COLORS.danger} />
                </div>
              </div>

              {/* Utilidad neta */}
              <div
                style={{
                  border: `1px solid ${COLORS.borderLight}`,
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>
                    Utilidad neta del día
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success }}>
                    {formatCurrency(summaryData.utilidadNeta)}
                  </div>
                </div>
                <div
                  style={{
                    background: '#ECFDF5',
                    padding: 12,
                    borderRadius: 8,
                    display: 'flex',
                  }}
                >
                  <TrendingUp size={24} color={COLORS.success} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button variant="secondary">
              <Download size={16} />
              Exportar cierre
            </Button>
            <Button variant="primary">
              <Lock size={16} />
              Cerrar día
            </Button>
          </div>
        </Card>
      )}

      {/* Periodico content */}
      {activeTab === 'periodico' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Form Section */}
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
              <Select
                label="Tipo de periodo"
                badge="required"
                options={[
                  { value: 'semanal', label: 'Semanal' },
                  { value: 'quincenal', label: 'Quincenal' },
                  { value: 'mensual', label: 'Mensual' },
                ]}
                value="semanal"
                onChange={() => {}}
              />
              <Input
                type="date"
                label="Fecha inicio"
                badge="required"
              />
              <Input
                type="date"
                label="Fecha fin"
                badge="required"
              />
            </div>
          </Card>

          {/* Consolidado del periodo section */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16, fontWeight: 600 }}>
              Consolidado del período
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {/* Ingresos totales */}
              <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                <div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Ingresos totales del periodo</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(periodicSummary.ingresos)}</div>
                </div>
                <div style={{ background: '#E6F8FB', padding: 12, borderRadius: 8, display: 'flex' }}>
                  <DollarSign size={24} color={COLORS.primary} />
                </div>
              </div>

              {/* Egresos totales */}
              <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                <div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Egresos totales del periodo</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.danger }}>{formatCurrency(periodicSummary.egresos)}</div>
                </div>
                <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 8, display: 'flex' }}>
                  <TrendingDown size={24} color={COLORS.danger} />
                </div>
              </div>

              {/* Utilidad neta */}
              <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                <div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Utilidad neta</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success }}>{formatCurrency(periodicSummary.utilidad)}</div>
                </div>
                <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 8, display: 'flex' }}>
                  <TrendingUp size={24} color={COLORS.success} />
                </div>
              </div>

              {/* Comparativo */}
              <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                <div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Comparativo vs periodo anterior</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success }}>+{periodicSummary.comparativa}%</div>
                </div>
                <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 8, display: 'flex' }}>
                  <TrendingUp size={24} color={COLORS.success} />
                </div>
              </div>
            </div>
          </div>

          {/* Historial Table */}
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
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: COLORS.muted, borderBottom: `1px solid ${COLORS.borderLight}` }}>Período</th>
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: COLORS.muted, borderBottom: `1px solid ${COLORS.borderLight}` }}>Rango de fechas</th>
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: COLORS.muted, borderBottom: `1px solid ${COLORS.borderLight}` }}>Ingresos</th>
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: COLORS.muted, borderBottom: `1px solid ${COLORS.borderLight}` }}>Egresos</th>
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: COLORS.muted, borderBottom: `1px solid ${COLORS.borderLight}` }}>Utilidad</th>
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: COLORS.muted, borderBottom: `1px solid ${COLORS.borderLight}` }}>Desglose métodos de pago</th>
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: COLORS.muted, borderBottom: `1px solid ${COLORS.borderLight}` }}>Comparativa</th>
                    <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: COLORS.muted, borderBottom: `1px solid ${COLORS.borderLight}` }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {periodicData.map((row, index) => (
                    <tr key={row.id} style={{ borderBottom: index < periodicData.length - 1 ? `1px solid ${COLORS.borderLight}` : 'none' }}>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{row.periodo}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.text }}>{row.fecha}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.primary, fontWeight: 600 }}>{formatCurrency(row.ingresos)}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.danger, fontWeight: 600 }}>{formatCurrency(row.egresos)}</td>
                      <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.success, fontWeight: 600 }}>{formatCurrency(row.utilidad)}</td>
                      <td style={{ padding: '16px 20px', fontSize: 12, color: COLORS.text }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span>Efectivo: {row.desglose.efectivo}%</span>
                          <span>Tarjeta: {row.desglose.tarjeta}%</span>
                          <span>Transfer: {row.desglose.transfer}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: 4, 
                          padding: '4px 8px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: row.comparativa > 0 ? '#ECFDF5' : '#FEF2F2',
                          color: row.comparativa > 0 ? COLORS.success : COLORS.danger
                        }}>
                          {row.comparativa > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {row.comparativa > 0 ? '+' : ''}{row.comparativa}%
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <button style={{ background: 'none', border: 'none', color: COLORS.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Action Buttons */}
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
