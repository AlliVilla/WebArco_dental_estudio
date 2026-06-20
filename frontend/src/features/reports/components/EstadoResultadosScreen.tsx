import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Download,
  DollarSign,
  FileSpreadsheet,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Alert, Button, Card } from '../../../context';
import { useResponsive } from '../../../hooks/useWindowWidth';
import { exportToExcel } from '../../../utils/exportToExcel';
import { formatCurrency } from '../../../utils/formatters';
import finanzasService from '../services/estadoResultado.service';
import type { EstadoResultadoMes, EstadoResultadoResponse } from '../types/estadoResultado';

type PeriodoPreset = 'mes-actual' | 'mes-anterior' | 'anio-actual' | 'personalizado';

type TableRowKind = 'normal' | 'subtotal' | 'green' | 'cyan' | 'orange' | 'final';

const colors = {
  primary: '#0BC5DF',
  primarySoft: '#E6F8FB',
  navy: '#203F49',
  muted: '#888F94',
  border: '#D3D7DA',
  surface: '#FFFFFF',
  success: '#1D9E75',
  successSoft: '#ECFDF5',
  warning: '#EF9F27',
  warningSoft: '#FFFBEB',
  danger: '#E24B4A',
  dangerSoft: '#FEF2F2',
  gray: '#F8F9FA',
};

const selectStyle: CSSProperties = {
  width: '100%',
  height: 42,
  border: `1px solid ${colors.border}`,
  borderRadius: 9,
  background: colors.gray,
  color: colors.navy,
  fontSize: 13,
  padding: '0 12px',
  outline: 'none',
};

const inputStyle: CSSProperties = {
  width: '100%',
  height: 42,
  border: `1px solid ${colors.border}`,
  borderRadius: 9,
  background: colors.gray,
  color: colors.navy,
  fontSize: 13,
  padding: '0 12px',
  outline: 'none',
};

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthRange(offset = 0) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + offset + 1, 0);
  return { desde: toDateInput(start), hasta: toDateInput(end) };
}

function yearRange() {
  const today = new Date();
  return {
    desde: toDateInput(new Date(today.getFullYear(), 0, 1)),
    hasta: toDateInput(new Date(today.getFullYear(), 11, 31)),
  };
}

function getPresetRange(preset: PeriodoPreset) {
  if (preset === 'mes-anterior') return monthRange(-1);
  if (preset === 'anio-actual') return yearRange();
  return monthRange(0);
}

function money(value?: number) {
  return formatCurrency(Number(value || 0));
}

function pct(value?: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function negative(value?: number) {
  return `(${money(value)})`;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <tr>
      <td colSpan={2} style={{ padding: '16px 0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ height: 1, background: colors.border, flex: 1 }} />
          <span style={{ color: colors.muted, fontSize: 10, fontWeight: 800, letterSpacing: 1.8, textTransform: 'uppercase' }}>
            {children}
          </span>
          <div style={{ height: 1, background: colors.border, flex: 1 }} />
        </div>
      </td>
    </tr>
  );
}

function TableRow({ label, value, negativeValue, kind = 'normal' }: { label: string; value: number; negativeValue?: boolean; kind?: TableRowKind }) {
  const isFilled = kind !== 'normal';
  const backgroundMap: Record<TableRowKind, string> = {
    normal: '#FFFFFF',
    subtotal: colors.gray,
    green: colors.success,
    cyan: colors.primary,
    orange: colors.warning,
    final: colors.success,
  };
  const color = isFilled ? '#FFFFFF' : colors.navy;
  const valueColor = isFilled ? '#FFFFFF' : negativeValue ? colors.danger : colors.success;

  return (
    <tr style={{ background: backgroundMap[kind] }}>
      <td style={{ padding: '13px 16px', color, fontSize: 13, fontWeight: isFilled ? 800 : 500, borderTop: kind === 'normal' ? `1px solid ${colors.border}` : 'none' }}>
        {label}
      </td>
      <td style={{ padding: '13px 16px', color: valueColor, fontSize: 13, fontWeight: 800, textAlign: 'right', borderTop: kind === 'normal' ? `1px solid ${colors.border}` : 'none' }}>
        {negativeValue ? negative(value) : money(value)}
      </td>
    </tr>
  );
}

function MetricCard({ title, subtitle, value, accent, icon: Icon }: { title: string; subtitle: string; value: string; accent: string; icon: LucideIcon }) {
  return (
    <Card style={{ padding: 18, minHeight: 104, display: 'flex', justifyContent: 'space-between', gap: 14 }}>
      <div>
        <p style={{ margin: 0, color: colors.muted, fontSize: 12, fontWeight: 600 }}>{title}</p>
        <h3 style={{ margin: '10px 0 4px', color: accent, fontSize: 24, lineHeight: 1, fontWeight: 800 }}>{value}</h3>
        <p style={{ margin: 0, color: colors.muted, fontSize: 11 }}>{subtitle}</p>
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}12`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} />
      </div>
    </Card>
  );
}

function SimpleBarChart({ meses }: { meses: EstadoResultadoMes[] }) {
  const max = Math.max(1, ...meses.flatMap((m) => [m.ingresos, m.gastos]));

  return (
    <Card style={{ padding: 18 }}>
      <h3 style={{ margin: 0, color: colors.navy, fontSize: 15, fontWeight: 800, borderLeft: `4px solid ${colors.primary}`, paddingLeft: 10 }}>
        Ingresos vs Gastos por mes
      </h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 190, padding: '18px 6px 0', borderBottom: `1px dashed ${colors.border}` }}>
        {meses.map((mes) => (
          <div key={mes.mes} style={{ flex: 1, minWidth: 36, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 145 }}>
              <div title={`Ingresos: ${money(mes.ingresos)}`} style={{ width: 14, height: `${Math.max(4, (mes.ingresos / max) * 140)}px`, background: colors.success, borderRadius: '6px 6px 0 0' }} />
              <div title={`Gastos: ${money(mes.gastos)}`} style={{ width: 14, height: `${Math.max(4, (mes.gastos / max) * 140)}px`, background: colors.danger, borderRadius: '6px 6px 0 0' }} />
            </div>
            <span style={{ color: colors.muted, fontSize: 11 }}>{mes.mes}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 12, color: colors.muted, fontSize: 11 }}>
        <span><b style={{ color: colors.success }}>●</b> Ingresos</span>
        <span><b style={{ color: colors.danger }}>●</b> Gastos</span>
      </div>
    </Card>
  );
}

function DonutChart({ gastos }: { gastos: Record<string, number> }) {
  const entries = Object.entries(gastos).filter(([, value]) => Number(value) > 0);
  const total = entries.reduce((sum, [, value]) => sum + Number(value), 0) || 1;
  const palette = ['#E24B4A', '#EF9F27', '#0BC5DF', '#A3AAB0', '#1D9E75', '#203F49', '#8B5CF6'];
  let cursor = 0;
  const gradient = entries.map(([, value], index) => {
    const start = cursor;
    const end = cursor + (Number(value) / total) * 100;
    cursor = end;
    return `${palette[index % palette.length]} ${start}% ${end}%`;
  }).join(', ');

  return (
    <Card style={{ padding: 18 }}>
      <h3 style={{ margin: 0, color: colors.navy, fontSize: 15, fontWeight: 800, borderLeft: `4px solid ${colors.primary}`, paddingLeft: 10 }}>
        Distribución de gastos
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 22, alignItems: 'center', marginTop: 20 }}>
        <div style={{ width: 140, height: 140, borderRadius: '50%', background: entries.length ? `conic-gradient(${gradient})` : colors.gray, position: 'relative', margin: '0 auto' }}>
          <div style={{ position: 'absolute', inset: 34, borderRadius: '50%', background: '#fff' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {entries.length === 0 ? (
            <span style={{ color: colors.muted, fontSize: 12 }}>No hay gastos para el período.</span>
          ) : entries.map(([label, value], index) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12 }}>
              <span style={{ color: colors.navy, display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: palette[index % palette.length] }} />
                {label}
              </span>
              <strong style={{ color: colors.navy }}>{money(value)}</strong>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function EstadoResultadosScreen() {
  const { isMobile } = useResponsive();
  const [preset, setPreset] = useState<PeriodoPreset>('mes-actual');
  const initialRange = useMemo(() => monthRange(0), []);
  const [desde, setDesde] = useState(initialRange.desde);
  const [hasta, setHasta] = useState(initialRange.hasta);
  const [reporte, setReporte] = useState<EstadoResultadoResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [showWarning, setShowWarning] = useState(true);

  const gastosSuperanUmbral = useMemo(() => {
    if (!reporte) return false;
    const gastos = reporte.tarjetas.costoInsumos + reporte.tarjetas.gastosAdministrativos;
    return reporte.ingresos.ingresosNetos > 0 && gastos / reporte.ingresos.ingresosNetos > 0.35;
  }, [reporte]);

  const cargarReporte = async () => {
    if (!desde || !hasta) {
      setError('Seleccione el rango de fechas para generar el reporte.');
      return;
    }

    if (desde > hasta) {
      setError('La fecha desde no puede ser mayor que la fecha hasta.');
      return;
    }

    setCargando(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await finanzasService.getEstadoResultado(desde, hasta);
      setReporte(response.data);
      setSuccess('Estado de resultados generado.');
    } catch (err: any) {
      setError(err?.message || 'No se pudo generar el estado de resultados.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarReporte();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePeriodoChange = (value: PeriodoPreset) => {
    setPreset(value);
    if (value !== 'personalizado') {
      const range = getPresetRange(value);
      setDesde(range.desde);
      setHasta(range.hasta);
    }
  };

  const exportarExcel = async () => {
    if (!reporte) return;

    await exportToExcel(
      [
        { concepto: 'Consultas y tratamientos', monto: reporte.ingresos.consultasTratamientos },
        { concepto: 'Descuentos aplicados', monto: -reporte.ingresos.descuentosAplicados },
        { concepto: 'Ingresos netos', monto: reporte.ingresos.ingresosNetos },
        { concepto: 'Insumos utilizados', monto: -reporte.costoInsumos.insumosUtilizados },
        { concepto: 'Utilidad bruta', monto: reporte.resultadoFinal.utilidadBruta },
        { concepto: 'Nómina', monto: -reporte.gastosAdministrativos.nomina },
        { concepto: 'Renta y servicios básicos', monto: -reporte.gastosAdministrativos.rentaServiciosBasicos },
        { concepto: 'Equipos', monto: -reporte.gastosAdministrativos.equipos },
        { concepto: 'Otros gastos', monto: -reporte.gastosAdministrativos.otros },
        { concepto: 'Comisiones por tarjeta', monto: -reporte.resultadoFinal.comisionesPorTarjeta },
        { concepto: 'Impuestos estimados', monto: -reporte.resultadoFinal.impuestos },
        { concepto: 'Utilidad neta', monto: reporte.resultadoFinal.utilidadNeta },
      ],
      [
        { header: 'Concepto', key: 'concepto', width: 36 },
        { header: 'Monto', key: 'monto', width: 18 },
      ],
      'Estado de resultados',
      `Estado_Resultados_${reporte.periodo.fechaInicio}_${reporte.periodo.fechaFin}`,
      { currencyKeys: ['monto'] },
    );
  };

  const exportarPdf = () => {
    if (!reporte) return;
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Estado de Resultados</title>
          <style>
            body{font-family:Arial,sans-serif;color:#203F49;padding:28px;background:#fff}
            h1{font-size:22px;margin:0 0 4px} p{margin:0 0 20px;color:#5F656A}
            table{width:100%;border-collapse:collapse;margin-top:14px;font-size:13px}
            th{background:#0BC5DF;color:#fff;text-align:left;padding:10px}
            td{border:1px solid #D3D7DA;padding:10px}
            td:last-child{text-align:right;font-weight:bold}
            .section td{background:#F8F9FA;text-align:center;color:#888F94;font-weight:bold;text-transform:uppercase;letter-spacing:1px}
            .total td{background:#1D9E75;color:#fff;font-size:15px}
          </style>
        </head>
        <body>
          <h1>Estado de Resultados</h1>
          <p>${reporte.periodo.nombre} · ${reporte.periodo.fechaInicio} al ${reporte.periodo.fechaFin}</p>
          <table>
            <tr><th>Concepto</th><th>Monto</th></tr>
            <tr class="section"><td colspan="2">Ingresos</td></tr>
            <tr><td>Consultas y tratamientos</td><td>${money(reporte.ingresos.consultasTratamientos)}</td></tr>
            <tr><td>(−) Descuentos aplicados</td><td>${negative(reporte.ingresos.descuentosAplicados)}</td></tr>
            <tr><td>Ingresos netos</td><td>${money(reporte.ingresos.ingresosNetos)}</td></tr>
            <tr class="section"><td colspan="2">Costo de insumos</td></tr>
            <tr><td>(−) Insumos utilizados</td><td>${negative(reporte.costoInsumos.insumosUtilizados)}</td></tr>
            <tr><td>Utilidad bruta</td><td>${money(reporte.resultadoFinal.utilidadBruta)}</td></tr>
            <tr class="section"><td colspan="2">Gastos administrativos</td></tr>
            <tr><td>(−) Nómina</td><td>${negative(reporte.gastosAdministrativos.nomina)}</td></tr>
            <tr><td>(−) Renta y servicios básicos</td><td>${negative(reporte.gastosAdministrativos.rentaServiciosBasicos)}</td></tr>
            <tr><td>(−) Equipos</td><td>${negative(reporte.gastosAdministrativos.equipos)}</td></tr>
            <tr><td>(−) Otros gastos</td><td>${negative(reporte.gastosAdministrativos.otros)}</td></tr>
            <tr class="section"><td colspan="2">Resultado final</td></tr>
            <tr><td>(−) Comisiones por tarjeta</td><td>${negative(reporte.resultadoFinal.comisionesPorTarjeta)}</td></tr>
            <tr><td>(−) Impuestos estimados</td><td>${negative(reporte.resultadoFinal.impuestos)}</td></tr>
            <tr class="total"><td>Utilidad neta</td><td>${money(reporte.resultadoFinal.utilidadNeta)}</td></tr>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const gridCards = isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showInfo && <Alert variant="info" message="Selecciona el período y genera el reporte." onClose={() => setShowInfo(false)} />}
      {success && <Alert variant="success" message={success} onClose={() => setSuccess(null)} />}
      {showWarning && gastosSuperanUmbral && (
        <Alert variant="warning" message="Los gastos superan el 35% de los ingresos netos." onClose={() => setShowWarning(false)} />
      )}
      {error && <Alert variant="error" message={error} onClose={() => setError(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: gridCards, gap: 14 }}>
        <MetricCard title="Ingresos totales" subtitle="Ingresos brutos del período" value={money(reporte?.tarjetas.ingresosTotales)} accent={colors.success} icon={DollarSign} />
        <MetricCard title="Costo de insumos" subtitle="Inventario utilizado" value={money(reporte?.tarjetas.costoInsumos)} accent={colors.danger} icon={TrendingUp} />
        <MetricCard title="Gastos administrativos" subtitle="Nómina + servicios" value={money(reporte?.tarjetas.gastosAdministrativos)} accent={colors.warning} icon={ClipboardList} />
        <MetricCard title="Utilidad neta" subtitle={`Margen ${pct(reporte?.tarjetas.margenNeto)}`} value={money(reporte?.tarjetas.utilidadNeta)} accent={colors.primary} icon={BarChart3} />
      </div>

      <Card style={{ padding: 18 }}>
        <div style={{ color: colors.muted, fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
          Parámetros del reporte
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr auto auto', gap: 12, alignItems: 'end' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: colors.navy, fontSize: 12, fontWeight: 700 }}>
            <span>Período <span style={{ color: colors.danger }}>*</span></span>
            <select value={preset} onChange={(e) => handlePeriodoChange(e.target.value as PeriodoPreset)} style={selectStyle}>
              <option value="mes-actual">Mes actual</option>
              <option value="mes-anterior">Mes anterior</option>
              <option value="anio-actual">Año actual</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: colors.navy, fontSize: 12, fontWeight: 700 }}>
            <span>Desde <span style={{ color: colors.danger }}>*</span></span>
            <input type="date" value={desde} disabled={preset !== 'personalizado'} onChange={(e) => setDesde(e.target.value)} style={{ ...inputStyle, cursor: preset === 'personalizado' ? 'text' : 'not-allowed' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: colors.navy, fontSize: 12, fontWeight: 700 }}>
            <span>Hasta <span style={{ color: colors.danger }}>*</span></span>
            <input type="date" value={hasta} disabled={preset !== 'personalizado'} onChange={(e) => setHasta(e.target.value)} style={{ ...inputStyle, cursor: preset === 'personalizado' ? 'text' : 'not-allowed' }} />
          </label>
          <Button onClick={cargarReporte} disabled={cargando} loading={cargando} style={{ height: 42, minWidth: 126, background: cargando ? colors.border : colors.primary, borderColor: cargando ? colors.border : colors.primary }}>
            <RefreshCw size={15} /> Generar
          </Button>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={exportarPdf} disabled={!reporte} style={{ height: 42 }}>
              <Download size={15} /> Exportar PDF
            </Button>
            <Button variant="secondary" onClick={exportarExcel} disabled={!reporte} style={{ height: 42 }}>
              <FileSpreadsheet size={15} /> Exportar Excel
            </Button>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 4, height: 22, background: colors.primary, borderRadius: 8 }} />
          <h3 style={{ margin: 0, color: colors.navy, fontSize: 16, fontWeight: 800 }}>
            Estado de Resultados — {reporte?.periodo.nombre || 'Período seleccionado'}
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: colors.gray }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: colors.navy, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase' }}>Concepto</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', color: colors.navy, fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase' }}>Monto (L.)</th>
              </tr>
            </thead>
            <tbody>
              <SectionTitle>Ingresos</SectionTitle>
              <TableRow label="Consultas y tratamientos" value={reporte?.ingresos.consultasTratamientos || 0} />
              <TableRow label="(−) Descuentos aplicados" value={reporte?.ingresos.descuentosAplicados || 0} negativeValue />
              <TableRow label="Ingresos netos" value={reporte?.ingresos.ingresosNetos || 0} kind="cyan" />

              <SectionTitle>Costo de insumos</SectionTitle>
              <TableRow label="(−) Insumos utilizados (inventario)" value={reporte?.costoInsumos.insumosUtilizados || 0} negativeValue />
              <TableRow label="Utilidad bruta" value={reporte?.resultadoFinal.utilidadBruta || 0} kind="green" />

              <SectionTitle>Gastos administrativos</SectionTitle>
              <TableRow label="(−) Nómina" value={reporte?.gastosAdministrativos.nomina || 0} negativeValue />
              <TableRow label="(−) Renta y servicios básicos" value={reporte?.gastosAdministrativos.rentaServiciosBasicos || 0} negativeValue />
              {(reporte?.gastosAdministrativos.equipos || 0) > 0 && <TableRow label="(−) Equipos" value={reporte?.gastosAdministrativos.equipos || 0} negativeValue />}
              {(reporte?.gastosAdministrativos.otros || 0) > 0 && <TableRow label="(−) Otros gastos" value={reporte?.gastosAdministrativos.otros || 0} negativeValue />}
              <TableRow label="Total gastos administrativos" value={reporte?.gastosAdministrativos.totalGastos || 0} kind="orange" negativeValue />

              <SectionTitle>Resultado final</SectionTitle>
              <TableRow label="(−) Comisiones por tarjeta" value={reporte?.resultadoFinal.comisionesPorTarjeta || 0} negativeValue />
              <TableRow label="(−) Impuestos estimados" value={reporte?.resultadoFinal.impuestos || 0} negativeValue />
              <TableRow label="✦ Utilidad neta" value={reporte?.resultadoFinal.utilidadNeta || 0} kind="final" />
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ background: colors.primary, borderRadius: 13, color: '#fff', padding: '18px 22px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 18, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.82 }}>Utilidad neta</div>
          <strong style={{ fontSize: 24 }}>{money(reporte?.resultadoFinal.utilidadNeta)}</strong>
        </div>
        <div style={{ borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.28)', paddingLeft: isMobile ? 0 : 22 }}>
          <div style={{ fontSize: 11, opacity: 0.82 }}>Margen neto</div>
          <strong style={{ fontSize: 22 }}>{pct(reporte?.resultadoFinal.margenNeto)}</strong>
        </div>
        <div style={{ borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.28)', paddingLeft: isMobile ? 0 : 22 }}>
          <div style={{ fontSize: 11, opacity: 0.82 }}>vs período anterior</div>
          <strong style={{ fontSize: 20 }}>{pct(reporte?.resultadoFinal.variacionVsPeriodoAnterior)} ↑</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.35fr 1fr', gap: 16 }}>
        <SimpleBarChart meses={reporte?.meses || []} />
        <DonutChart gastos={reporte?.gastosPorCategoria || {}} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="secondary" size="sm" onClick={() => window.location.assign('/design')} style={{ borderRadius: 999, background: colors.navy, color: '#fff', borderColor: colors.navy }}>
          <AlertTriangle size={14} /> Ver Sistema de Diseño
        </Button>
      </div>
    </div>
  );
}

export default EstadoResultadosScreen;
