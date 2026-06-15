import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Alert, Button, Card, Input, Select } from '../../context';
import { billingService } from '../billing';
import { CierreHistorialItem, TipoCierre } from '../billing/types';
import { formatCurrency, obtenerHoyLocal } from '../../utils/formatters';

const COLORS = {
  primary: '#0BC5DF',
  success: '#1D9E75',
  danger: '#E24B4A',
  text: '#203F49',
  muted: '#888F94',
  borderLight: '#E5E7EB',
};

function toNum(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function formatFechaRango(item: CierreHistorialItem): string {
  if (!item.fecha) return '—';
  const parts = item.fecha.split('T')[0].split('-');
  if (parts.length !== 3) return item.fecha;

  const fecha = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
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

function calcularComparativa(
  actual: CierreHistorialItem,
  anterior: CierreHistorialItem | undefined,
): number {
  if (!anterior) return 0;
  const utilActual = toNum(actual.utilidad);
  const utilAnterior = toNum(anterior.utilidad);
  if (utilAnterior === 0) return 0;
  const pct = ((utilActual - utilAnterior) / Math.abs(utilAnterior)) * 100;
  return parseFloat(pct.toFixed(2));
}

function calcularDesgloseItem(item: CierreHistorialItem): {
  efectivo: number;
  tarjeta: number;
  transfer: number;
} {
  const ef = toNum(item.efectivo);
  const ta = toNum(item.tarjeta);
  const tr = toNum(item.transferencia);
  const total = ef + ta + tr;
  if (total === 0) return { efectivo: 0, tarjeta: 0, transfer: 0 };

  const pct = (v: number) => parseFloat(((v / total) * 100).toFixed(2));
  const efectivo = pct(ef);
  const tarjeta = pct(ta);
  const transfer = parseFloat((100 - efectivo - tarjeta).toFixed(2));

  return { efectivo, tarjeta, transfer };
}

export function CierresView() {
  const [activeTab, setActiveTab] = useState<'diario' | 'periodico'>('diario');
  const [fechaCierre, setFechaCierre] = useState(new Date().toISOString().split('T')[0]);
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoCierre | 'Rango'>('Semanal');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [historial, setHistorial] = useState<CierreHistorialItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [creandoCierre, setCreandoCierre] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [exportandoDiario, setExportandoDiario] = useState(false);
  const [exportandoPeriodico, setExportandoPeriodico] = useState(false);

  const [previewData, setPreviewData] = useState<{
    totalIngresos: number;
    totalEgresos: number;
    utilidad: number;
    efectivo: number;
    tarjeta: number;
    transferencia: number;
  } | null>(null);
  const [cargandoPreview, setCargandoPreview] = useState(false);

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

  const cargarPreview = useCallback(async (fecha: string) => {
    setCargandoPreview(true);
    setError(null);
    try {
      const parts = fecha.split('-');
      if (parts.length === 3) {
        const fechaFormat = `${parts[2]}/${parts[1]}/${parts[0]}`;
        const res = await billingService.previewCierre(fechaFormat);
        if (res.success && res.data) {
          setPreviewData({
            totalIngresos: res.data.totalIngresos,
            totalEgresos: res.data.totalEgresos,
            utilidad: res.data.utilidad,
            efectivo: res.data.ingresos.efectivo,
            tarjeta: res.data.ingresos.tarjeta,
            transferencia: res.data.ingresos.transferencia,
          });
        } else {
          setError(res.message ?? 'Error al obtener la vista previa.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al obtener la vista previa del cierre.');
    } finally {
      setCargandoPreview(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'diario') {
      cargarPreview(fechaCierre);
    }
  }, [activeTab, fechaCierre, cargarPreview]);

  const handleCerrarDia = async () => {
    setCreandoCierre(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await billingService.createCierre('Diario');
      if (res.success) {
        setSuccessMsg(res.message ?? 'Cierre de caja generado exitosamente');
        await cargarHistorial();
        await cargarPreview(fechaCierre);
      } else {
        setError(res.message ?? 'Error al crear el cierre');
      }
    } catch (e: any) {
      if (e.response?.status === 400 || e.response?.data?.statusCode === 400) {
        setError('Ya existe un cierre Diario para el período actual.');
      } else {
        setError(e.response?.data?.message ?? 'Error al conectar con el servidor.');
      }
    } finally {
      setCreandoCierre(false);
    }
  };

  const cierreDiarioHoy = historial.find((c) => {
    if (!c.fecha) return false;
    const cDateStr = c.fecha.split('T')[0];
    return c.tipo_cierre === 'Diario' && cDateStr === fechaCierre;
  });

  const summaryData = previewData
    ? {
      totalIngresos: previewData.totalIngresos,
      ingresosEfectivo: previewData.efectivo,
      ingresosTarjeta: previewData.tarjeta,
      ingresosTransferencia: previewData.transferencia,
      totalEgresos: previewData.totalEgresos,
      utilidadNeta: previewData.utilidad,
    }
    : {
      totalIngresos: 0,
      ingresosEfectivo: 0,
      ingresosTarjeta: 0,
      ingresosTransferencia: 0,
      totalEgresos: 0,
      utilidadNeta: 0,
    };

  const isRangoValido = tipoPeriodo === 'Rango' && !!(fechaInicio && fechaFin);

  const cierresFiltrados = useMemo(() => {
    if (isRangoValido) {
      return historial.filter((c) => {
        if (!c.fecha) return false;
        const cDateStr = c.fecha.split('T')[0];
        return cDateStr >= fechaInicio && cDateStr <= fechaFin;
      });
    }
    if (tipoPeriodo === 'Rango') return [];
    return historial.filter((c) => c.tipo_cierre === tipoPeriodo);
  }, [historial, isRangoValido, fechaInicio, fechaFin, tipoPeriodo]);

  const periodicSummary = useMemo(() => {
    if (cierresFiltrados.length === 0) {
      return { ingresos: 0, egresos: 0, utilidad: 0, comparativa: 0 };
    }

    if (isRangoValido) {
      const ingresos = cierresFiltrados.reduce((acc, c) => acc + toNum(c.ingresos), 0);
      const egresos = cierresFiltrados.reduce((acc, c) => acc + toNum(c.egresos), 0);
      const utilidad = cierresFiltrados.reduce((acc, c) => acc + toNum(c.utilidad), 0);

      let comparativa = 0;
      const start = new Date(fechaInicio + 'T00:00:00');
      const end = new Date(fechaFin + 'T23:59:59');
      const diffMs = end.getTime() - start.getTime();

      const prevStart = new Date(start.getTime() - diffMs - 1);
      const prevEnd = new Date(start.getTime() - 1);

      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];

      const cierresPeriodoAnterior = historial.filter((c) => {
        if (!c.fecha) return false;
        const cDateStr = c.fecha.split('T')[0];
        return cDateStr >= prevStartStr && cDateStr <= prevEndStr;
      });

      const utilidadAnterior = cierresPeriodoAnterior.reduce((acc, c) => acc + toNum(c.utilidad), 0);
      if (utilidadAnterior !== 0) {
        comparativa = parseFloat((((utilidad - utilidadAnterior) / Math.abs(utilidadAnterior)) * 100).toFixed(2));
      }

      return { ingresos, egresos, utilidad, comparativa };
    }

    const ingresos = cierresFiltrados.reduce((acc, c) => acc + toNum(c.ingresos), 0);
    const egresos = cierresFiltrados.reduce((acc, c) => acc + toNum(c.egresos), 0);
    const utilidad = cierresFiltrados.reduce((acc, c) => acc + toNum(c.utilidad), 0);

    const todosDelTipo = tipoPeriodo !== 'Rango' ? historial.filter((c) => c.tipo_cierre === tipoPeriodo) : [];
    const utilidadAnterior = todosDelTipo
      .slice(cierresFiltrados.length)
      .reduce((acc, c) => acc + toNum(c.utilidad), 0);

    let comparativa = 0;
    if (utilidadAnterior !== 0) {
      comparativa = parseFloat((((utilidad - utilidadAnterior) / Math.abs(utilidadAnterior)) * 100).toFixed(2));
    }

    return { ingresos, egresos, utilidad, comparativa };
  }, [cierresFiltrados, isRangoValido, fechaInicio, fechaFin, historial, tipoPeriodo]);

  const filasTabla = useMemo(() => {
    return cierresFiltrados.map((item, idx) => ({
      ...item,
      comparativa: isRangoValido
        ? (() => {
          const allSorted = [...historial].sort(
            (a, b) => new Date(b.fecha ?? '').getTime() - new Date(a.fecha ?? '').getTime(),
          );
          const currentIdx = allSorted.findIndex((c) => c.id_cierre === item.id_cierre);
          const prevItem = currentIdx !== -1 ? allSorted[currentIdx + 1] : undefined;
          return calcularComparativa(item, prevItem);
        })()
        : calcularComparativa(item, cierresFiltrados[idx + 1]),
      desglose: calcularDesgloseItem(item),
      periodo: item.tipo_cierre,
      fecha: formatFechaRango(item),
    }));
  }, [cierresFiltrados, isRangoValido, historial]);

  const buildNombreArchivoPeriodico = (): string => {
    if (tipoPeriodo === 'Rango' && fechaInicio && fechaFin) {
      const fmt = (d: string) => d.split('-').reverse().join('-');
      return `Cierre_Caja_${fmt(fechaInicio)}_${fmt(fechaFin)}`;
    }
    return `Cierre_Caja_Tipo_${tipoPeriodo}`;
  };

  const exportarCierreDiario = async () => {
    setExportandoDiario(true);
    setError(null);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Cierre Diario');

      const fechaDisplay = fechaCierre.split('-').reverse().join('/');

      worksheet.mergeCells('A1:D1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `Cierre Diario — ${fechaDisplay}`;
      titleCell.font = { bold: true, size: 14, color: { argb: 'FF203F49' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
      worksheet.getRow(1).height = 28;

      worksheet.addRow([]);

      const headerRow = worksheet.addRow(['Concepto', 'Monto (L.)']);
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0BC5DF' } };
      headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 22;

      const dataRows = [
        ['Total ingresos del día', summaryData.totalIngresos],
        ['Ingresos en efectivo', summaryData.ingresosEfectivo],
        ['Ingresos por tarjeta', summaryData.ingresosTarjeta],
        ['Ingresos por transferencia', summaryData.ingresosTransferencia],
        ['Total egresos del día', summaryData.totalEgresos],
        ['Utilidad neta del día', summaryData.utilidadNeta],
      ];

      dataRows.forEach(([concepto, monto], index) => {
        const row = worksheet.addRow([concepto, monto]);
        if (index % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        }
        row.getCell(2).numFmt = '"L." #,##0.00';
        row.alignment = { vertical: 'middle' };
        row.font = { color: { argb: 'FF203F49' } };
      });

      worksheet.getColumn(1).width = 36;
      worksheet.getColumn(2).width = 22;

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD3D7DA' } },
            left: { style: 'thin', color: { argb: 'FFD3D7DA' } },
            bottom: { style: 'thin', color: { argb: 'FFD3D7DA' } },
            right: { style: 'thin', color: { argb: 'FFD3D7DA' } },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fechaArchivo = fechaCierre.split('-').reverse().join('-');
      saveAs(blob, `Cierre_diario_${fechaArchivo}.xlsx`);
    } catch {
      setError('Error al exportar el cierre diario a Excel.');
    } finally {
      setExportandoDiario(false);
    }
  };

  const exportarConsolidado = async () => {
    if (filasTabla.length === 0) return;
    setExportandoPeriodico(true);
    setError(null);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Consolidado');

      const HEADER_COLOR = 'FF0BC5DF';
      const HEADER_FONT_COLOR = 'FFFFFFFF';
      const TEXT_COLOR = 'FF203F49';
      const ALT_ROW_COLOR = 'FFF8F9FA';
      const BORDER_COLOR = 'FFD3D7DA';

      const applyBorders = (cell: ExcelJS.Cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: BORDER_COLOR } },
          left: { style: 'thin', color: { argb: BORDER_COLOR } },
          bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
          right: { style: 'thin', color: { argb: BORDER_COLOR } },
        };
      };

      worksheet.mergeCells('A1:J1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Consolidado del período';
      titleCell.font = { bold: true, size: 14, color: { argb: TEXT_COLOR } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
      worksheet.getRow(1).height = 28;

      worksheet.addRow([]);

      const summaryTitle = worksheet.addRow(['Resumen del período']);
      worksheet.mergeCells(`A${summaryTitle.number}:J${summaryTitle.number}`);
      summaryTitle.getCell(1).font = { bold: true, size: 11, color: { argb: TEXT_COLOR } };
      summaryTitle.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      const summaryHeaders = worksheet.addRow([
        'Ingresos totales del período',
        'Egresos totales del período',
        'Utilidad neta',
        'Comparativo vs período anterior',
      ]);
      summaryHeaders.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
      summaryHeaders.font = { color: { argb: HEADER_FONT_COLOR }, bold: true, size: 11 };
      summaryHeaders.alignment = { vertical: 'middle', horizontal: 'center' };
      summaryHeaders.height = 22;
      summaryHeaders.eachCell(applyBorders);
      worksheet.mergeCells(`E${summaryHeaders.number}:J${summaryHeaders.number}`);

      const comparativaSign = periodicSummary.comparativa > 0 ? '+' : '';
      const summaryValues = worksheet.addRow([
        periodicSummary.ingresos,
        periodicSummary.egresos,
        periodicSummary.utilidad,
        `${comparativaSign}${periodicSummary.comparativa.toFixed(2)}%`,
      ]);
      summaryValues.getCell(1).numFmt = '"L." #,##0.00';
      summaryValues.getCell(2).numFmt = '"L." #,##0.00';
      summaryValues.getCell(3).numFmt = '"L." #,##0.00';
      summaryValues.font = { color: { argb: TEXT_COLOR }, size: 11 };
      summaryValues.alignment = { vertical: 'middle', horizontal: 'center' };
      summaryValues.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALT_ROW_COLOR } };
      summaryValues.eachCell(applyBorders);
      worksheet.mergeCells(`E${summaryValues.number}:J${summaryValues.number}`);

      worksheet.addRow([]);

      const tableHeaderRow1Number = worksheet.rowCount + 1;

      const superHeader = worksheet.addRow([
        'Período',
        'Rango de fechas',
        'Ingresos',
        'Egresos',
        'Utilidad',
        'Desglose métodos de pago',
        '',
        '',
        'Comparativa',
        'Responsable',
      ]);
      superHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
      superHeader.font = { color: { argb: HEADER_FONT_COLOR }, bold: true, size: 12 };
      superHeader.alignment = { vertical: 'middle', horizontal: 'center' };
      superHeader.height = 22;
      superHeader.eachCell(applyBorders);

      worksheet.mergeCells(`F${tableHeaderRow1Number}:H${tableHeaderRow1Number}`);
      ['A', 'B', 'C', 'D', 'E', 'I', 'J'].forEach((col) => {
        worksheet.mergeCells(`${col}${tableHeaderRow1Number}:${col}${tableHeaderRow1Number + 1}`);
      });

      const subHeader = worksheet.addRow([
        '', '', '', '', '',
        'Efectivo (%)',
        'Tarjeta (%)',
        'Transferencia (%)',
        '', '',
      ]);
      subHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
      subHeader.font = { color: { argb: HEADER_FONT_COLOR }, bold: true, size: 11 };
      subHeader.alignment = { vertical: 'middle', horizontal: 'center' };
      subHeader.height = 20;
      subHeader.eachCell(applyBorders);

      filasTabla.forEach((fila, index) => {
        const nombreResponsable = fila.usuario
          ? fila.usuario.persona
            ? `${fila.usuario.persona.primer_nombre} ${fila.usuario.persona.primer_apellido}`
            : fila.usuario.username
          : '—';

        const comparativaSign = fila.comparativa > 0 ? '+' : '';

        const row = worksheet.addRow([
          fila.periodo,
          fila.fecha,
          toNum(fila.ingresos),
          toNum(fila.egresos),
          toNum(fila.utilidad),
          fila.desglose.efectivo,
          fila.desglose.tarjeta,
          fila.desglose.transfer,
          `${comparativaSign}${fila.comparativa.toFixed(2)}%`,
          nombreResponsable,
        ]);

        if (index % 2 === 0) {
          row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALT_ROW_COLOR } };
        }

        row.getCell(3).numFmt = '"L." #,##0.00';
        row.getCell(4).numFmt = '"L." #,##0.00';
        row.getCell(5).numFmt = '"L." #,##0.00';
        row.getCell(6).numFmt = '#,##0.00"%"';
        row.getCell(7).numFmt = '#,##0.00"%"';
        row.getCell(8).numFmt = '#,##0.00"%"';

        row.alignment = { vertical: 'middle' };
        row.font = { color: { argb: TEXT_COLOR } };
        row.eachCell(applyBorders);
      });

      worksheet.getColumn(1).width = 16;
      worksheet.getColumn(2).width = 30;
      worksheet.getColumn(3).width = 20;
      worksheet.getColumn(4).width = 20;
      worksheet.getColumn(5).width = 20;
      worksheet.getColumn(6).width = 16;
      worksheet.getColumn(7).width = 16;
      worksheet.getColumn(8).width = 18;
      worksheet.getColumn(9).width = 18;
      worksheet.getColumn(10).width = 26;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `${buildNombreArchivoPeriodico()}.xlsx`);
    } catch {
      setError('Error al exportar el consolidado a Excel.');
    } finally {
      setExportandoPeriodico(false);
    }
  };

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
      {error && <Alert variant="error" message={error} />}
      {successMsg && <Alert variant="success" message={successMsg} />}

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

      {activeTab === 'diario' && (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
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

          {cargandoPreview ? (
            <p style={{ color: COLORS.muted, fontSize: 14 }}>Cargando vista previa del cierre…</p>
          ) : (
            <div>
              <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16, fontWeight: 600 }}>
                Resumen del día
              </h3>

              {cierreDiarioHoy ? (
                <p style={{ color: COLORS.success, fontSize: 13, marginBottom: 16 }}>
                  El cierre diario de esta fecha ya fue realizado y guardado en el historial.
                </p>
              ) : (
                <p style={{ color: COLORS.muted, fontSize: 13, marginBottom: 16 }}>
                  Mostrando vista previa de valores actuales para esta fecha (cierre aún no realizado).
                </p>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: 16,
                }}
              >
                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Total ingresos del día</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(summaryData.totalIngresos)}</div>
                  </div>
                  <div style={{ background: '#E6F8FB', padding: 12, borderRadius: 8, display: 'flex' }}>
                    <DollarSign size={24} color={COLORS.primary} />
                  </div>
                </div>

                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Ingresos en efectivo</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success }}>{formatCurrency(summaryData.ingresosEfectivo)}</div>
                  </div>
                  <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 8, display: 'flex' }}>
                    <Wallet size={24} color={COLORS.success} />
                  </div>
                </div>

                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Ingresos por tarjeta</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(summaryData.ingresosTarjeta)}</div>
                  </div>
                  <div style={{ background: '#E6F8FB', padding: 12, borderRadius: 8, display: 'flex' }}>
                    <CreditCard size={24} color={COLORS.primary} />
                  </div>
                </div>

                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Ingresos por transferencia</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(summaryData.ingresosTransferencia)}</div>
                  </div>
                  <div style={{ background: '#E6F8FB', padding: 12, borderRadius: 8, display: 'flex' }}>
                    <ArrowRightLeft size={24} color={COLORS.primary} />
                  </div>
                </div>

                <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Total egresos del día</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.danger }}>{formatCurrency(summaryData.totalEgresos)}</div>
                  </div>
                  <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 8, display: 'flex' }}>
                    <TrendingDown size={24} color={COLORS.danger} />
                  </div>
                </div>

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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button
              variant="secondary"
              onClick={() => void exportarCierreDiario()}
              disabled={exportandoDiario || !previewData}
            >
              <Download size={16} />
              {exportandoDiario ? 'Exportando...' : 'Exportar cierre'}
            </Button>
            <Button variant="primary" onClick={handleCerrarDia} disabled={creandoCierre}>
              <Lock size={16} />
              {creandoCierre ? 'Cerrando...' : 'Cerrar día'}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'periodico' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
              <Select
                label="Tipo de periodo"
                badge="required"
                options={[
                  { value: 'Semanal', label: 'Semanal' },
                  { value: 'Quincenal', label: 'Quincenal' },
                  { value: 'Mensual', label: 'Mensual' },
                  { value: 'Rango', label: 'Rango de fechas' },
                ]}
                value={tipoPeriodo}
                onChange={(v) => {
                  setFechaInicio('');
                  setFechaFin('');
                  setTipoPeriodo(v as TipoCierre | 'Rango');
                }}
              />
              {tipoPeriodo === 'Rango' && (
                <>
                  <Input
                    type="date"
                    label="Fecha inicio"
                    badge="required"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                  <Input
                    type="date"
                    label="Fecha fin"
                    badge="required"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </>
              )}
            </div>
          </Card>

          {cargando && (
            <p style={{ color: COLORS.muted, fontSize: 14 }}>Cargando historial de cierres…</p>
          )}

          {!cargando && (
            <>
              <div>
                <h3 style={{ margin: '0 0 16px 0', color: COLORS.text, fontSize: 16, fontWeight: 600 }}>
                  Consolidado del período
                </h3>

                {cierresFiltrados.length === 0 && (
                  <p style={{ color: COLORS.muted, fontSize: 13, marginBottom: 16 }}>
                    {isRangoValido
                      ? 'No hay cierres registrados en el rango de fechas seleccionado.'
                      : `No hay cierres ${tipoPeriodo.toLowerCase()}es registrados aún.`}
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                  <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Ingresos totales del periodo</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.primary }}>{formatCurrency(periodicSummary.ingresos)}</div>
                    </div>
                    <div style={{ background: '#E6F8FB', padding: 12, borderRadius: 8, display: 'flex' }}>
                      <DollarSign size={24} color={COLORS.primary} />
                    </div>
                  </div>

                  <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Egresos totales del periodo</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.danger }}>{formatCurrency(periodicSummary.egresos)}</div>
                    </div>
                    <div style={{ background: '#FEF2F2', padding: 12, borderRadius: 8, display: 'flex' }}>
                      <TrendingDown size={24} color={COLORS.danger} />
                    </div>
                  </div>

                  <div style={{ border: `1px solid ${COLORS.borderLight}`, borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>Utilidad neta</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.success }}>{formatCurrency(periodicSummary.utilidad)}</div>
                    </div>
                    <div style={{ background: '#ECFDF5', padding: 12, borderRadius: 8, display: 'flex' }}>
                      <TrendingUp size={24} color={COLORS.success} />
                    </div>
                  </div>

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
                            {isRangoValido
                              ? 'No hay cierres registrados en el rango de fechas seleccionado.'
                              : 'No hay cierres registrados para el período seleccionado.'}
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
                              <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.primary, fontWeight: 600, ...borde }}>{formatCurrency(toNum(fila.ingresos))}</td>
                              <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.danger, fontWeight: 600, ...borde }}>{formatCurrency(toNum(fila.egresos))}</td>
                              <td style={{ padding: '16px 20px', fontSize: 13, color: COLORS.success, fontWeight: 600, ...borde }}>{formatCurrency(toNum(fila.utilidad))}</td>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button
              variant="secondary"
              onClick={() => void exportarConsolidado()}
              disabled={exportandoPeriodico || filasTabla.length === 0}
            >
              <Download size={16} />
              {exportandoPeriodico ? 'Exportando...' : 'Exportar consolidado'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}