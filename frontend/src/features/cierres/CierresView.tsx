import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Alert, Button, Card, Input, Select } from "../../context";
import { DataTable, Column } from "../../components";
import { useResponsive } from "../../hooks/useWindowWidth";
import { billingService } from "../billing";
import { CierreHistorialItem, TipoCierre } from "../billing/types";
import { formatCurrency, obtenerHoyLocal } from "../../utils/formatters";

type FilaCierre = CierreHistorialItem & {
  periodo: string;
  fecha: string;
  desglose: { efectivo: number; tarjeta: number; transfer: number };
};

const COLORS = {
  primary: "#0BC5DF",
  success: "#1D9E75",
  danger: "#E24B4A",
  text: "#203F49",
  muted: "#888F94",
  borderLight: "#E5E7EB",
};

function toNum(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  const n = typeof val === "number" ? val : parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function formatFechaRango(item: CierreHistorialItem): string {
  if (!item.fecha) return "—";
  const parts = item.fecha.split("T")[0].split("-");
  if (parts.length !== 3) return item.fecha;

  const fecha = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );
  const opciones: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };
  const fin = fecha.toLocaleDateString("es-HN", opciones);

  const inicio = new Date(fecha);
  switch (item.tipo_cierre) {
    case "Semanal":
      inicio.setDate(inicio.getDate() - 6);
      break;
    case "Quincenal":
      inicio.setDate(inicio.getDate() - 14);
      break;
    case "Mensual":
      inicio.setMonth(inicio.getMonth() - 1);
      break;
    default:
      return fin;
  }

  return `${inicio.toLocaleDateString("es-HN", opciones)} – ${fin}`;
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
  const { isMobile } = useResponsive();
  const hoy = obtenerHoyLocal();

  const [activeTab, setActiveTab] = useState<"diario" | "periodico">("diario");
  const [fechaCierre, setFechaCierre] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoCierre | "Rango">(
    "Semanal"
  );
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

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
        setError(
          respuesta.message ?? "Error al cargar el historial de cierres."
        );
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
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
      const parts = fecha.split("-");
      if (parts.length === 3) {
        const fechaFormat = `${parts[2]}/${parts[1]}/${parts[0]}`;
        const respuesta = await billingService.previewCierre(fechaFormat);
        // ponytail: la API devuelve data directamente o envuelto segun interceptor
        if (respuesta.success && respuesta.data) {
          setPreviewData({
            totalIngresos: respuesta.data.totalIngresos,
            totalEgresos: respuesta.data.totalEgresos,
            utilidad: respuesta.data.utilidad,
            efectivo: respuesta.data.ingresos.efectivo,
            tarjeta: respuesta.data.ingresos.tarjeta,
            transferencia: respuesta.data.ingresos.transferencia,
          });
        } else {
          setError(respuesta.message ?? "Error al obtener la vista previa.");
        }
      }
    } catch (err: any) {
      setError(
        err.message ??
          "Error al obtener la vista previa del cierre."
      );
    } finally {
      setCargandoPreview(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "diario") {
      cargarPreview(fechaCierre);
    }
  }, [activeTab, fechaCierre, cargarPreview]);

  const handleCerrarDia = async () => {
    if (cierreDiarioHoy) {
      setError("Ya se realizó el cierre de hoy. Solo se puede realizar un cierre por día.");
      return;
    }
    setCreandoCierre(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await billingService.createCierre("Diario");
      if (res.success) {
        setSuccessMsg(res.message ?? "Cierre de caja generado exitosamente");
        await cargarHistorial();
        await cargarPreview(fechaCierre);
      } else {
        setError(res.message ?? "Error al crear el cierre");
      }
    } catch (e: any) {
      if (e.statusCode === 400) {
        setError(e.message ?? "Ya se realizó el cierre de hoy. Solo se puede realizar un cierre por día.");
      } else {
        setError(
          e.message ?? "Error al conectar con el servidor."
        );
      }
    } finally {
      setCreandoCierre(false);
    }
  };

  const cierreDiarioHoy = historial.find((c) => {
    if (!c.fecha) return false;
    const cDateStr = c.fecha.split("T")[0];
    return c.tipo_cierre === "Diario" && cDateStr === fechaCierre;
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

  const isRangoValido = tipoPeriodo === "Rango" && !!(fechaInicio && fechaFin);

  const cierresFiltrados = useMemo(() => {
    if (isRangoValido) {
      return historial.filter((c) => {
        if (!c.fecha) return false;
        const cDateStr = c.fecha.split("T")[0];
        return cDateStr >= fechaInicio && cDateStr <= fechaFin;
      });
    }
    if (tipoPeriodo === "Rango") return [];
    return historial.filter((c) => c.tipo_cierre === tipoPeriodo);
  }, [historial, isRangoValido, fechaInicio, fechaFin, tipoPeriodo]);

  const periodicSummary = useMemo(() => {
    if (cierresFiltrados.length === 0) {
      return { ingresos: 0, egresos: 0, utilidad: 0 };
    }
    const ingresos = cierresFiltrados.reduce(
      (acc, c) => acc + toNum(c.ingresos),
      0
    );
    const egresos = cierresFiltrados.reduce(
      (acc, c) => acc + toNum(c.egresos),
      0
    );
    const utilidad = cierresFiltrados.reduce(
      (acc, c) => acc + toNum(c.utilidad),
      0
    );
    return { ingresos, egresos, utilidad };
  }, [cierresFiltrados]);

  const filasTabla = useMemo(() => {
    return cierresFiltrados.map((item) => ({
      ...item,
      desglose: calcularDesgloseItem(item),
      periodo: item.tipo_cierre,
      fecha: formatFechaRango(item),
    }));
  }, [cierresFiltrados]);

  const columns = useMemo<Column<FilaCierre>[]>(
    () => [
      { key: "periodo", label: "Período" },
      { key: "fecha", label: "Rango de fechas" },
      {
        key: "ingresos",
        label: "Ingresos",
        render: (val) => (
          <span style={{ color: COLORS.primary, fontWeight: 600 }}>
            {formatCurrency(toNum(val as string))}
          </span>
        ),
      },
      {
        key: "egresos",
        label: "Egresos",
        render: (val) => (
          <span style={{ color: COLORS.danger, fontWeight: 600 }}>
            {formatCurrency(toNum(val as string))}
          </span>
        ),
      },
      {
        key: "utilidad",
        label: "Utilidad",
        render: (val) => (
          <span style={{ color: COLORS.success, fontWeight: 600 }}>
            {formatCurrency(toNum(val as string))}
          </span>
        ),
      },
      {
        key: "desglose",
        label: "Desglose métodos de pago",
        render: (_, fila) => (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 12,
            }}
          >
            <span>
              Efectivo:&nbsp;&nbsp;{fila.desglose.efectivo.toFixed(2)}%
            </span>
            <span>
              Tarjeta:&nbsp;&nbsp;&nbsp;{fila.desglose.tarjeta.toFixed(2)}%
            </span>
            <span>
              Transfer:&nbsp;&nbsp;{fila.desglose.transfer.toFixed(2)}%
            </span>
          </div>
        ),
      },
      {
        key: "usuario",
        label: "Responsable",
        render: (_, fila) => {
          const u = fila.usuario;
          if (!u) return "—";
          return u.persona
            ? `${u.persona.primer_nombre} ${u.persona.primer_apellido}`
            : u.username;
        },
      },
    ],
    []
  );

  const buildNombreArchivoPeriodico = (): string => {
    if (tipoPeriodo === "Rango" && fechaInicio && fechaFin) {
      const fmt = (d: string) => d.split("-").reverse().join("-");
      return `Cierre_Caja_${fmt(fechaInicio)}_${fmt(fechaFin)}`;
    }
    return `Cierre_Caja_${tipoPeriodo}`;
  };

  const exportarCierreDiario = async () => {
    setExportandoDiario(true);
    setError(null);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Cierre Diario");

      const fechaDisplay = fechaCierre.split("-").reverse().join("/");

      worksheet.mergeCells("A1:D1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = `Cierre Diario — ${fechaDisplay}`;
      titleCell.font = { bold: true, size: 14, color: { argb: "FF203F49" } };
      titleCell.alignment = { vertical: "middle", horizontal: "left" };
      worksheet.getRow(1).height = 28;

      worksheet.addRow([]);

      const headerRow = worksheet.addRow(["Concepto", "Monto (L.)"]);
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0BC5DF" },
      };
      headerRow.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 12 };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 22;

      const dataRows = [
        ["Total ingresos del día", summaryData.totalIngresos],
        ["Ingresos en efectivo", summaryData.ingresosEfectivo],
        ["Ingresos por tarjeta", summaryData.ingresosTarjeta],
        ["Ingresos por transferencia", summaryData.ingresosTransferencia],
        ["Total egresos del día", summaryData.totalEgresos],
        ["Utilidad neta del día", summaryData.utilidadNeta],
      ];

      dataRows.forEach(([concepto, monto], index) => {
        const row = worksheet.addRow([concepto, monto]);
        if (index % 2 === 0) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8F9FA" },
          };
        }
        row.getCell(2).numFmt = '"L." #,##0.00';
        row.alignment = { vertical: "middle" };
        row.font = { color: { argb: "FF203F49" } };
      });

      worksheet.getColumn(1).width = 36;
      worksheet.getColumn(2).width = 22;

      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD3D7DA" } },
            left: { style: "thin", color: { argb: "FFD3D7DA" } },
            bottom: { style: "thin", color: { argb: "FFD3D7DA" } },
            right: { style: "thin", color: { argb: "FFD3D7DA" } },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const fechaArchivo = fechaCierre.split("-").reverse().join("-");
      saveAs(blob, `Cierre_diario_${fechaArchivo}.xlsx`);
    } catch {
      setError("Error al exportar el cierre diario a Excel.");
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
      const worksheet = workbook.addWorksheet("Consolidado");

      const HEADER_COLOR = "FF0BC5DF";
      const HEADER_FONT_COLOR = "FFFFFFFF";
      const TEXT_COLOR = "FF203F49";
      const ALT_ROW_COLOR = "FFF8F9FA";
      const BORDER_COLOR = "FFD3D7DA";

      const applyBorders = (cell: ExcelJS.Cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: BORDER_COLOR } },
          left: { style: "thin", color: { argb: BORDER_COLOR } },
          bottom: { style: "thin", color: { argb: BORDER_COLOR } },
          right: { style: "thin", color: { argb: BORDER_COLOR } },
        };
      };

      worksheet.mergeCells("A1:I1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "Consolidado del período";
      titleCell.font = { bold: true, size: 14, color: { argb: TEXT_COLOR } };
      titleCell.alignment = { vertical: "middle", horizontal: "left" };
      worksheet.getRow(1).height = 28;

      worksheet.addRow([]);

      const summaryTitle = worksheet.addRow(["Resumen del período"]);
      worksheet.mergeCells(`A${summaryTitle.number}:I${summaryTitle.number}`);
      summaryTitle.getCell(1).font = {
        bold: true,
        size: 11,
        color: { argb: TEXT_COLOR },
      };
      summaryTitle.getCell(1).alignment = {
        vertical: "middle",
        horizontal: "left",
      };

      const summaryHeaders = worksheet.addRow([
        "Ingresos totales del período",
        "Egresos totales del período",
        "Utilidad neta",
      ]);
      summaryHeaders.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: HEADER_COLOR },
      };
      summaryHeaders.font = {
        color: { argb: HEADER_FONT_COLOR },
        bold: true,
        size: 11,
      };
      summaryHeaders.alignment = { vertical: "middle", horizontal: "center" };
      summaryHeaders.height = 22;
      summaryHeaders.eachCell(applyBorders);
      worksheet.mergeCells(
        `D${summaryHeaders.number}:I${summaryHeaders.number}`
      );

      const summaryValues = worksheet.addRow([
        periodicSummary.ingresos,
        periodicSummary.egresos,
        periodicSummary.utilidad,
      ]);
      summaryValues.getCell(1).numFmt = '"L." #,##0.00';
      summaryValues.getCell(2).numFmt = '"L." #,##0.00';
      summaryValues.getCell(3).numFmt = '"L." #,##0.00';
      summaryValues.font = { color: { argb: TEXT_COLOR }, size: 11 };
      summaryValues.alignment = { vertical: "middle", horizontal: "center" };
      summaryValues.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: ALT_ROW_COLOR },
      };
      summaryValues.eachCell(applyBorders);
      worksheet.mergeCells(`D${summaryValues.number}:I${summaryValues.number}`);

      worksheet.addRow([]);

      const tableHeaderRow1Number = worksheet.rowCount + 1;

      const superHeader = worksheet.addRow([
        "Período",
        "Rango de fechas",
        "Ingresos",
        "Egresos",
        "Utilidad",
        "Desglose métodos de pago",
        "",
        "",
        "Responsable",
      ]);
      superHeader.height = 22;

      const subHeader = worksheet.addRow([
        "",
        "",
        "",
        "",
        "",
        "Efectivo (%)",
        "Tarjeta (%)",
        "Transferencia (%)",
        "",
      ]);
      subHeader.height = 20;

      worksheet.mergeCells(
        `F${tableHeaderRow1Number}:H${tableHeaderRow1Number}`
      );
      ["A", "B", "C", "D", "E", "I"].forEach((col) => {
        worksheet.mergeCells(
          `${col}${tableHeaderRow1Number}:${col}${tableHeaderRow1Number + 1}`
        );
      });

      ["A", "B", "C", "D", "E", "F", "G", "H", "I"].forEach((col) => {
        const cellTop = superHeader.getCell(col);
        cellTop.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: HEADER_COLOR },
        };
        cellTop.font = {
          color: { argb: HEADER_FONT_COLOR },
          bold: true,
          size: 12,
        };
        cellTop.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        applyBorders(cellTop);

        const cellBot = subHeader.getCell(col);
        cellBot.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: HEADER_COLOR },
        };
        cellBot.font = {
          color: { argb: HEADER_FONT_COLOR },
          bold: true,
          size: 12,
        };
        cellBot.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        applyBorders(cellBot);
      });

      filasTabla.forEach((fila, index) => {
        const nombreResponsable = fila.usuario
          ? fila.usuario.persona
            ? `${fila.usuario.persona.primer_nombre} ${fila.usuario.persona.primer_apellido}`
            : fila.usuario.username
          : "—";

        const row = worksheet.addRow([
          fila.periodo,
          fila.fecha,
          toNum(fila.ingresos),
          toNum(fila.egresos),
          toNum(fila.utilidad),
          fila.desglose.efectivo,
          fila.desglose.tarjeta,
          fila.desglose.transfer,
          nombreResponsable,
        ]);

        if (index % 2 === 0) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: ALT_ROW_COLOR },
          };
        }

        row.getCell(3).numFmt = '"L." #,##0.00';
        row.getCell(4).numFmt = '"L." #,##0.00';
        row.getCell(5).numFmt = '"L." #,##0.00';
        row.getCell(6).numFmt = '#,##0.00"%"';
        row.getCell(7).numFmt = '#,##0.00"%"';
        row.getCell(8).numFmt = '#,##0.00"%"';

        row.font = { color: { argb: TEXT_COLOR } };
        row.eachCell(applyBorders);

        row.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
        row.getCell(2).alignment = { vertical: "middle" };
        row.getCell(3).alignment = { vertical: "middle" };
        row.getCell(4).alignment = { vertical: "middle" };
        row.getCell(5).alignment = { vertical: "middle" };
        row.getCell(6).alignment = { vertical: "middle" };
        row.getCell(7).alignment = { vertical: "middle" };
        row.getCell(8).alignment = { vertical: "middle" };
        row.getCell(9).alignment = { vertical: "middle", horizontal: "right" };
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

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `${buildNombreArchivoPeriodico()}.xlsx`);
    } catch {
      setError("Error al exportar el consolidado a Excel.");
    } finally {
      setExportandoPeriodico(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        height: "100%",
        minHeight: 0,
        overflowY: "auto",
      }}
    >
      {error && <Alert variant="error" message={error} />}
      {successMsg && <Alert variant="success" message={successMsg} />}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("diario")}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 600,
            border: `1px solid ${
              activeTab === "diario" ? COLORS.primary : COLORS.borderLight
            }`,
            background: activeTab === "diario" ? COLORS.primary : "#fff",
            color: activeTab === "diario" ? "#fff" : COLORS.muted,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Cierre Diario
        </button>
        <button
          onClick={() => setActiveTab("periodico")}
          style={{
            padding: "8px 16px",
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 600,
            border: `1px solid ${
              activeTab === "periodico" ? COLORS.primary : COLORS.borderLight
            }`,
            background: activeTab === "periodico" ? COLORS.primary : "#fff",
            color: activeTab === "periodico" ? "#fff" : COLORS.muted,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          Cierres Semanales / Quincenales / Mensuales
        </button>
      </div>

      {activeTab === "diario" ? (
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

      {activeTab === "diario" && (
        <Card style={{ display: "flex", flexDirection: "column", gap: 32 }}>
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
                  style={{ borderRadius: 8, padding: "4px 12px" }}
                  onClick={() => setFechaCierre(hoy)}
                >
                  <Calendar size={14} style={{ marginRight: 4 }} />
                  Hoy
                </Button>
              }
            />
          </div>

          {cargandoPreview ? (
            <p style={{ color: COLORS.muted, fontSize: 14 }}>
              Cargando vista previa del cierre…
            </p>
          ) : (
            <div>
              <h3
                style={{
                  margin: "0 0 16px 0",
                  color: COLORS.text,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Resumen del día
              </h3>

              {cierreDiarioHoy ? (
                <p
                  style={{
                    color: COLORS.success,
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  El cierre diario de esta fecha ya fue realizado y guardado en
                  el historial.
                </p>
              ) : (
                <p
                  style={{
                    color: COLORS.muted,
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  Mostrando vista previa de valores actuales para esta fecha
                  (cierre aún no realizado).
                </p>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: COLORS.muted,
                        marginBottom: 4,
                      }}
                    >
                      Total ingresos del día
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: COLORS.primary,
                      }}
                    >
                      {formatCurrency(summaryData.totalIngresos)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#E6F8FB",
                      padding: 12,
                      borderRadius: 8,
                      display: "flex",
                    }}
                  >
                    <DollarSign size={24} color={COLORS.primary} />
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: COLORS.muted,
                        marginBottom: 4,
                      }}
                    >
                      Ingresos en efectivo
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: COLORS.success,
                      }}
                    >
                      {formatCurrency(summaryData.ingresosEfectivo)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#ECFDF5",
                      padding: 12,
                      borderRadius: 8,
                      display: "flex",
                    }}
                  >
                    <Wallet size={24} color={COLORS.success} />
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: COLORS.muted,
                        marginBottom: 4,
                      }}
                    >
                      Ingresos por tarjeta
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: COLORS.primary,
                      }}
                    >
                      {formatCurrency(summaryData.ingresosTarjeta)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#E6F8FB",
                      padding: 12,
                      borderRadius: 8,
                      display: "flex",
                    }}
                  >
                    <CreditCard size={24} color={COLORS.primary} />
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: COLORS.muted,
                        marginBottom: 4,
                      }}
                    >
                      Ingresos por transferencia
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: COLORS.primary,
                      }}
                    >
                      {formatCurrency(summaryData.ingresosTransferencia)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#E6F8FB",
                      padding: 12,
                      borderRadius: 8,
                      display: "flex",
                    }}
                  >
                    <ArrowRightLeft size={24} color={COLORS.primary} />
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: COLORS.muted,
                        marginBottom: 4,
                      }}
                    >
                      Total egresos del día
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: COLORS.danger,
                      }}
                    >
                      {formatCurrency(summaryData.totalEgresos)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#FEF2F2",
                      padding: 12,
                      borderRadius: 8,
                      display: "flex",
                    }}
                  >
                    <TrendingDown size={24} color={COLORS.danger} />
                  </div>
                </div>

                <div
                  style={{
                    border: `1px solid ${COLORS.borderLight}`,
                    borderRadius: 12,
                    padding: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: COLORS.muted,
                        marginBottom: 4,
                      }}
                    >
                      Utilidad neta del día
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: COLORS.success,
                      }}
                    >
                      {formatCurrency(summaryData.utilidadNeta)}
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#ECFDF5",
                      padding: 12,
                      borderRadius: 8,
                      display: "flex",
                    }}
                  >
                    <TrendingUp size={24} color={COLORS.success} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 16,
            }}
          >
            <Button
              variant="secondary"
              onClick={() => void exportarCierreDiario()}
              disabled={exportandoDiario || !previewData}
            >
              <Download size={16} />
              {exportandoDiario ? "Exportando..." : "Exportar cierre"}
            </Button>
            <Button
              variant="primary"
              onClick={handleCerrarDia}
              disabled={creandoCierre}
            >
              <Lock size={16} />
              {creandoCierre ? "Cerrando..." : "Cerrar día"}
            </Button>
          </div>
        </Card>
      )}

      {activeTab === "periodico" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Card>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 24,
              }}
            >
              <Select
                label="Tipo de periodo"
                badge="required"
                options={[
                  { value: "Semanal", label: "Semanal" },
                  { value: "Quincenal", label: "Quincenal" },
                  { value: "Mensual", label: "Mensual" },
                  { value: "Rango", label: "Rango de fechas" },
                ]}
                value={tipoPeriodo}
                onChange={(v) => {
                  setFechaInicio("");
                  setFechaFin("");
                  setTipoPeriodo(v as TipoCierre | "Rango");
                }}
              />
              {tipoPeriodo === "Rango" && (
                <>
                  <Input
                    type="date"
                    label="Fecha inicio"
                    badge="required"
                    value={fechaInicio}
                    max={hoy}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val > hoy || (fechaFin && val > fechaFin)) {
                        setError(
                          "Por favor asegúrese que el rango de fechas ingresado sea válido."
                        );
                      } else {
                        setError(null);
                        setFechaInicio(val);
                      }
                    }}
                  />
                  <Input
                    type="date"
                    label="Fecha fin"
                    badge="required"
                    value={fechaFin}
                    min={fechaInicio}
                    max={hoy}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val > hoy || (fechaInicio && val < fechaInicio)) {
                        setError(
                          "Por favor asegúrese que el rango de fechas ingresado sea válido."
                        );
                      } else {
                        setError(null);
                        setFechaFin(val);
                      }
                    }}
                  />
                </>
              )}
            </div>
          </Card>

          {cargando && (
            <p style={{ color: COLORS.muted, fontSize: 14 }}>
              Cargando historial de cierres…
            </p>
          )}

          {!cargando && (
            <>
              <div>
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    color: COLORS.text,
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {tipoPeriodo === "Rango"
                    ? fechaInicio && fechaFin
                      ? `Consolidado del período [${fechaInicio
                          .split("-")
                          .reverse()
                          .join("/")} al ${fechaFin
                          .split("-")
                          .reverse()
                          .join("/")}]`
                      : "Consolidado del período [seleccione un rango de fechas]"
                    : `Consolidado del período [${tipoPeriodo.toLowerCase()}]`}
                </h3>

                {cierresFiltrados.length === 0 && (
                  <p
                    style={{
                      color: COLORS.muted,
                      fontSize: 13,
                      marginBottom: 16,
                    }}
                  >
                    {isRangoValido
                      ? "No hay cierres registrados en el rango de fechas seleccionado."
                      : `No hay cierres ${tipoPeriodo.toLowerCase()}es registrados aún.`}
                  </p>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#fff",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: COLORS.muted,
                          marginBottom: 4,
                        }}
                      >
                        Ingresos totales del periodo
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: COLORS.primary,
                        }}
                      >
                        {formatCurrency(periodicSummary.ingresos)}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#E6F8FB",
                        padding: 12,
                        borderRadius: 8,
                        display: "flex",
                      }}
                    >
                      <DollarSign size={24} color={COLORS.primary} />
                    </div>
                  </div>

                  <div
                    style={{
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#fff",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: COLORS.muted,
                          marginBottom: 4,
                        }}
                      >
                        Egresos totales del periodo
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: COLORS.danger,
                        }}
                      >
                        {formatCurrency(periodicSummary.egresos)}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#FEF2F2",
                        padding: 12,
                        borderRadius: 8,
                        display: "flex",
                      }}
                    >
                      <TrendingDown size={24} color={COLORS.danger} />
                    </div>
                  </div>

                  <div
                    style={{
                      border: `1px solid ${COLORS.borderLight}`,
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#fff",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color: COLORS.muted,
                          marginBottom: 4,
                        }}
                      >
                        Utilidad neta
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: COLORS.success,
                        }}
                      >
                        {formatCurrency(periodicSummary.utilidad)}
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#ECFDF5",
                        padding: 12,
                        borderRadius: 8,
                        display: "flex",
                      }}
                    >
                      <TrendingUp size={24} color={COLORS.success} />
                    </div>
                  </div>
                </div>
              </div>

              <DataTable<FilaCierre>
                columns={columns}
                data={filasTabla as FilaCierre[]}
                title="Historial de cierres"
                getRowKey={(row) => String(row.id_cierre)}
                emptyMessage={
                  isRangoValido
                    ? "No hay cierres registrados en el rango de fechas seleccionado."
                    : "No hay cierres registrados para el período seleccionado."
                }
                searchable={false} // ponytail: mantenemos la estética original sin el buscador superior de DataTable
                pageSize={10}
                renderMobileCard={(fila: Record<string, unknown>) => (
                  <CierreCard fila={fila as unknown as FilaCierre} />
                )}
              />
            </>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Button
              variant="secondary"
              onClick={() => void exportarConsolidado()}
              disabled={exportandoPeriodico || filasTabla.length === 0}
            >
              <Download size={16} />
              {exportandoPeriodico ? "Exportando..." : "Exportar consolidado"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CierreCard({ fila }: { fila: FilaCierre }) {
  const responsable = fila.usuario
    ? fila.usuario.persona
      ? `${fila.usuario.persona.primer_nombre} ${fila.usuario.persona.primer_apellido}`
      : fila.usuario.username
    : "—";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: `1px solid ${COLORS.borderLight}`,
        padding: 16,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.text,
            margin: 0,
          }}
        >
          {fila.periodo}
        </p>
        <p style={{ fontSize: 12, color: COLORS.muted, margin: "2px 0 0" }}>
          {fila.fecha}
        </p>
      </div>

      <div style={{ borderTop: "1px solid #F8F9FA", paddingTop: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
          }}
        >
          <span style={{ fontSize: 12, color: COLORS.muted }}>Ingresos</span>
          <span
            style={{ fontSize: 13, fontWeight: 600, color: COLORS.primary }}
          >
            {formatCurrency(toNum(fila.ingresos as unknown as string))}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
          }}
        >
          <span style={{ fontSize: 12, color: COLORS.muted }}>Egresos</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.danger }}>
            {formatCurrency(toNum(fila.egresos as unknown as string))}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
          }}
        >
          <span style={{ fontSize: 12, color: COLORS.muted }}>Utilidad</span>
          <span
            style={{ fontSize: 13, fontWeight: 600, color: COLORS.success }}
          >
            {formatCurrency(toNum(fila.utilidad as unknown as string))}
          </span>
        </div>
        <div style={{ padding: "7px 0", borderBottom: "1px solid #F8F9FA" }}>
          <span
            style={{
              fontSize: 12,
              color: COLORS.muted,
              display: "block",
              marginBottom: 4,
            }}
          >
            Desglose métodos de pago
          </span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              fontSize: 12,
              color: COLORS.text,
            }}
          >
            <span>Efectivo: {fila.desglose.efectivo.toFixed(2)}%</span>
            <span>Tarjeta: {fila.desglose.tarjeta.toFixed(2)}%</span>
            <span>Transfer: {fila.desglose.transfer.toFixed(2)}%</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
          }}
        >
          <span style={{ fontSize: 12, color: COLORS.muted }}>Responsable</span>
          <span style={{ fontSize: 13, color: COLORS.text }}>
            {responsable}
          </span>
        </div>
      </div>
    </div>
  );
}
