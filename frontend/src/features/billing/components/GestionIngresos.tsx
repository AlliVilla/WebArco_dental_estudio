import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Card, Alert, Avatar } from "../../../context";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Plus,
  FileSpreadsheet,
  Printer,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { DataTable, ConfirmModal, Modal } from "../../../components";
import api from "../../../services/api";
import billingService from "../services/billingService";
import { consultaService } from "../../patients/services/consultaService";
import type { CreatePaymentInput, PatientPayment } from "../types";

interface IncomeRecord extends Record<string, unknown> {
  id: string;
  idConsulta: number;
  fecha: string;
  paciente: string;
  tratamiento: string;
  monto: number;
  metodoPago: string;
  doctor: string;
  estado: string;
  observacion?: string;
}

const mapPaymentToIncomeRecord = (payment: PatientPayment): IncomeRecord => ({
  id: String(payment.id_pago),
  idConsulta: payment.id_consulta,
  fecha: payment.fecha,
  paciente: `${payment.consulta.persona.nombre} ${payment.consulta.persona.apellido}`.trim(),
  tratamiento: payment.consulta.tratamiento || payment.consulta.diagnostico || `Pago de consulta #${payment.id_consulta}`,
  monto: Number(payment.abono),
  metodoPago: payment.metodoPago,
  doctor: payment.consulta.doctor?.nombre || "—",
  estado: payment.estado,
  observacion: payment.observacion,
});

export function GestionIngresos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IncomeRecord | null>(null);
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // View detail state
  const [detailRecord, setDetailRecord] = useState<IncomeRecord | null>(null);

  // Delete state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // Form states
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);

  // Patient search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id_persona: number; primer_nombre: string; segundo_nombre: string | null; primer_apellido: string; segundo_apellido: string | null }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected patient and consulta
  const [selectedPatient, setSelectedPatient] = useState<{ id: number; nombre: string } | null>(null);
  const [patientConsultas, setPatientConsultas] = useState<Array<{ id_consulta: number; diagnostico: string | null; tratamiento: string | null; fecha_inicio: string; doctor: string }>>([]);
  const [selectedConsultaId, setSelectedConsultaId] = useState("");
  const [isLoadingConsultas, setIsLoadingConsultas] = useState(false);

  // Other form fields
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [observaciones, setObservaciones] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const loadPayments = async (p = page) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await billingService.getAll({ page: p, limit: 20 });
      const body = response.data!;
      setRecords(body.data.map(mapPaymentToIncomeRecord));
      setTotalPages(body.pagination.totalPages);
      setTotalRecords(body.pagination.total);
      setPage(body.pagination.page);
    } catch (error: any) {
      setErrorMessage(error?.message || "No se pudo cargar el historial de ingresos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments(1);
  }, []);

  const totals = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.slice(0, 7);
    const monthRecords = records.filter((r) => r.fecha?.startsWith(currentMonth));
    const todayRecords = records.filter((r) => r.fecha === today);
    const monthTotal = monthRecords.reduce((s, r) => s + r.monto, 0);
    const dayTotal = todayRecords.reduce((s, r) => s + r.monto, 0);
    return { monthTotal, dayTotal, average: monthRecords.length ? monthTotal / monthRecords.length : 0 };
  }, [records]);

  const formatCurrency = (v: number) =>
    `L ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

  const kpis = [
    { label: "Ingresos del Mes", value: formatCurrency(totals.monthTotal), icon: DollarSign, color: "#0BC5DF", bg: "#E6F8FB" },
    { label: "Pagos Registrados", value: String(totalRecords), icon: TrendingUp, color: "#EF9F27", bg: "#FFFBEB" },
    { label: "Ingresos del Día", value: formatCurrency(totals.dayTotal), icon: Calendar, color: "#1D9E75", bg: "#ECFDF5" },
    { label: "Promedio por Paciente", value: formatCurrency(totals.average), icon: Users, color: "#203F49", bg: "#F1F3F4" },
  ];

  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await api.get("/persona", { params: { search: query, limit: 8 } });
      const data = response.data as { data: Array<{ id_persona: number; primer_nombre: string; segundo_nombre: string | null; primer_apellido: string; segundo_apellido: string | null }> };
      setSearchResults(data.data || []);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback((value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchPatients(value), 300);
  }, [searchPatients]);

  const selectPatient = async (p: { id_persona: number; primer_nombre: string; segundo_nombre: string | null; primer_apellido: string }) => {
    const fullName = `${p.primer_nombre} ${p.primer_apellido}`.trim();
    setSelectedPatient({ id: p.id_persona, nombre: fullName });
    setSearchQuery(fullName);
    setShowResults(false);
    setSelectedConsultaId("");
    setPatientConsultas([]);

    setIsLoadingConsultas(true);
    try {
      const response = await consultaService.getByPersona(p.id_persona);
      const consultas = response.data.data;
      setPatientConsultas(
        consultas.map((c) => ({
          id_consulta: c.id_consulta,
          diagnostico: c.diagnostico,
          tratamiento: c.tratamiento,
          fecha_inicio: c.fecha_inicio,
          doctor: `Dr. ${c.doctor.persona.primer_nombre} ${c.doctor.persona.primer_apellido}`,
        }))
      );
    } catch {
      setPatientConsultas([]);
    } finally {
      setIsLoadingConsultas(false);
    }
  };

  const selectedConsulta = patientConsultas.find((c) => String(c.id_consulta) === selectedConsultaId);

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      Pagado: { bg: "#ECFDF5", text: "#1D9E75" },
      Pendiente: { bg: "#FFFBEB", text: "#EF9F27" },
      Parcial: { bg: "#E6F8FB", text: "#0BC5DF" },
    };
    const s = variants[estado] || variants.Pendiente;
    return (
      <span style={{ background: s.bg, color: s.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
        {estado}
      </span>
    );
  };

  const getMetodoPagoBadge = (m: string) => (
    <span style={{ background: "#F1F3F4", color: "#5F656A", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
      {m}
    </span>
  );

  const handleRegisterIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedConsultaId) {
      setFormError("Seleccione una consulta del paciente");
      return;
    }
    if (!monto) {
      setFormError("Ingrese el monto del ingreso");
      return;
    }
    const payload: CreatePaymentInput = {
      id_consulta: Number(selectedConsultaId),
      fecha,
      abono: Number(monto),
      metodoPago,
      observacion: editingRecord ? observaciones : observaciones || undefined,
    };
    try {
      if (editingRecord) {
        const response = await billingService.update(Number(editingRecord.id), payload);
        const updatedRecord = mapPaymentToIncomeRecord(response.data!);
        setRecords(records.map((record) => record.id === updatedRecord.id ? updatedRecord : record));
      } else {
        const response = await billingService.create(payload);
        setRecords([mapPaymentToIncomeRecord(response.data!), ...records]);
        setTotalRecords((current) => current + 1);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      setFormError(error?.message || (editingRecord ? "No se pudo actualizar el ingreso" : "No se pudo registrar el ingreso"));
    }
  };

  const resetForm = () => {
    setEditingRecord(null);
    setFecha(new Date().toISOString().split("T")[0]);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setSelectedPatient(null);
    setPatientConsultas([]);
    setSelectedConsultaId("");
    setMonto("");
    setMetodoPago("Efectivo");
    setObservaciones("");
    setFormError(null);
  };

  const openEditModal = (record: IncomeRecord) => {
    setErrorMessage(null);
    setEditingRecord(record);
    setFecha(record.fecha);
    setSearchQuery(record.paciente);
    setSelectedPatient({ id: 0, nombre: record.paciente });
    setPatientConsultas([{
      id_consulta: record.idConsulta,
      diagnostico: null,
      tratamiento: record.tratamiento,
      fecha_inicio: record.fecha,
      doctor: record.doctor,
    }]);
    setSelectedConsultaId(String(record.idConsulta));
    setMonto(String(record.monto));
    setMetodoPago(record.metodoPago || "Efectivo");
    setObservaciones(record.observacion || "");
    setFormError(null);
    setShowResults(false);
    setIsDialogOpen(true);
  };

  const escapeHtml = (value: unknown) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const getTableRows = (rows: IncomeRecord[]) => rows.map((record) => ({
    Fecha: record.fecha,
    Paciente: record.paciente,
    Tratamiento: record.tratamiento,
    "No. Consulta": `#${record.idConsulta}`,
    Monto: formatCurrency(record.monto),
    "Método de pago": record.metodoPago,
    Doctor: record.doctor,
    Estado: record.estado,
    Observaciones: record.observacion || "",
  }));

  const escapeXml = (value: unknown) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

  const getExcelColumnName = (index: number) => {
    let columnName = "";
    let current = index;

    while (current >= 0) {
      columnName = String.fromCharCode((current % 26) + 65) + columnName;
      current = Math.floor(current / 26) - 1;
    }

    return columnName;
  };

  const createCrc32Table = () => {
    const table = new Uint32Array(256);

    for (let i = 0; i < 256; i += 1) {
      let value = i;
      for (let j = 0; j < 8; j += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      table[i] = value >>> 0;
    }

    return table;
  };

  const crc32Table = createCrc32Table();

  const getCrc32 = (data: Uint8Array) => {
    let crc = 0xffffffff;

    for (let i = 0; i < data.length; i += 1) {
      crc = crc32Table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
  };

  const createZip = (files: Array<{ name: string; content: string }>) => {
    const encoder = new TextEncoder();
    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;

    const writeUint16 = (view: DataView, position: number, value: number) => view.setUint16(position, value, true);
    const writeUint32 = (view: DataView, position: number, value: number) => view.setUint32(position, value, true);

    files.forEach((file) => {
      const nameBytes = encoder.encode(file.name);
      const contentBytes = encoder.encode(file.content);
      const crc = getCrc32(contentBytes);
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const localView = new DataView(localHeader.buffer);

      writeUint32(localView, 0, 0x04034b50);
      writeUint16(localView, 4, 20);
      writeUint16(localView, 6, 0);
      writeUint16(localView, 8, 0);
      writeUint16(localView, 10, 0);
      writeUint16(localView, 12, 0);
      writeUint32(localView, 14, crc);
      writeUint32(localView, 18, contentBytes.length);
      writeUint32(localView, 22, contentBytes.length);
      writeUint16(localView, 26, nameBytes.length);
      writeUint16(localView, 28, 0);
      localHeader.set(nameBytes, 30);

      localParts.push(localHeader, contentBytes);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const centralView = new DataView(centralHeader.buffer);

      writeUint32(centralView, 0, 0x02014b50);
      writeUint16(centralView, 4, 20);
      writeUint16(centralView, 6, 20);
      writeUint16(centralView, 8, 0);
      writeUint16(centralView, 10, 0);
      writeUint16(centralView, 12, 0);
      writeUint16(centralView, 14, 0);
      writeUint32(centralView, 16, crc);
      writeUint32(centralView, 20, contentBytes.length);
      writeUint32(centralView, 24, contentBytes.length);
      writeUint16(centralView, 28, nameBytes.length);
      writeUint16(centralView, 30, 0);
      writeUint16(centralView, 32, 0);
      writeUint16(centralView, 34, 0);
      writeUint16(centralView, 36, 0);
      writeUint32(centralView, 38, 0);
      writeUint32(centralView, 42, offset);
      centralHeader.set(nameBytes, 46);

      centralParts.push(centralHeader);
      offset += localHeader.length + contentBytes.length;
    });

    const centralDirectoryOffset = offset;
    const centralDirectorySize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);

    writeUint32(endView, 0, 0x06054b50);
    writeUint16(endView, 4, 0);
    writeUint16(endView, 6, 0);
    writeUint16(endView, 8, files.length);
    writeUint16(endView, 10, files.length);
    writeUint32(endView, 12, centralDirectorySize);
    writeUint32(endView, 16, centralDirectoryOffset);
    writeUint16(endView, 20, 0);

    const allParts = [...localParts, ...centralParts, endRecord];
    const totalLength = allParts.reduce((sum, part) => sum + part.length, 0);
    const zipBytes = new Uint8Array(totalLength);
    let position = 0;

    allParts.forEach((part) => {
      zipBytes.set(part, position);
      position += part.length;
    });

    return zipBytes;
  };

  const createXlsxFile = (rows: Array<Record<string, unknown>>) => {
    const headers = Object.keys(rows[0]);
    const sheetRows = [headers, ...rows.map((row) => headers.map((header) => row[header]))];
    const columnDefinitions = headers.map((_header, index) => `<col min="${index + 1}" max="${index + 1}" width="20" customWidth="1"/>`).join("");
    const sheetData = sheetRows.map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cells = row.map((cell, columnIndex) => {
        const cellReference = `${getExcelColumnName(columnIndex)}${rowNumber}`;
        const style = rowIndex === 0 ? ' s="1"' : "";
        return `<c r="${cellReference}" t="inlineStr"${style}><is><t>${escapeXml(cell)}</t></is></c>`;
      }).join("");

      return `<row r="${rowNumber}">${cells}</row>`;
    }).join("");

    return createZip([
      {
        name: "[Content_Types].xml",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
      },
      {
        name: "_rels/.rels",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      },
      {
        name: "xl/workbook.xml",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Ingresos" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      },
      {
        name: "xl/_rels/workbook.xml.rels",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      },
      {
        name: "xl/styles.xml",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleLight16"/></styleSheet>`,
      },
      {
        name: "xl/worksheets/sheet1.xml",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${columnDefinitions}</cols><sheetData>${sheetData}</sheetData></worksheet>`,
      },
    ]);
  };

  const handleExportExcel = (rows: IncomeRecord[]) => {
    if (!rows.length) {
      alert("No hay ingresos para exportar.");
      return;
    }

    const tableRows = getTableRows(rows);
    const xlsxFile = createXlsxFile(tableRows);
    const blob = new Blob([xlsxFile], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ingresos_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintTable = (rows: IncomeRecord[]) => {
    if (!rows.length) {
      alert("No hay ingresos para imprimir.");
      return;
    }

    const tableRows = getTableRows(rows);
    const headers = Object.keys(tableRows[0]);
    const tableHtml = `
      <table>
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
        <tbody>
          ${tableRows.map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header as keyof typeof row])}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    `;

    const printWindow = window.open("", "_blank", "width=1100,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Registros de Ingresos</title>
          <style>
            body { font-family: Arial, sans-serif; color: #203F49; padding: 24px; }
            h1 { font-size: 22px; margin: 0 0 4px 0; }
            p { margin: 0 0 18px 0; color: #5F656A; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #D3D7DA; padding: 8px; text-align: left; }
            th { background: #F1F3F4; color: #203F49; }
            .total { margin-top: 14px; font-weight: 700; text-align: right; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Registros de Ingresos</h1>
          <p>Fecha de impresión: ${escapeHtml(new Date().toLocaleString("es-HN"))}</p>
          ${tableHtml}
          <div class="total">Total: ${escapeHtml(formatCurrency(rows.reduce((sum, row) => sum + row.monto, 0)))}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await billingService.delete(Number(recordToDelete));
      setRecords(records.filter((r) => r.id !== recordToDelete));
      setTotalRecords((current) => Math.max(0, current - 1));
    } catch (error: any) {
      setErrorMessage(error?.message || "No se pudo eliminar el ingreso");
    }
    setRecordToDelete(null);
    setIsConfirmOpen(false);
  };

  const columns = [
    { key: "fecha", label: "Fecha", width: 110 },
    {
      key: "paciente", label: "Paciente",
      render: (_val: unknown, r: IncomeRecord) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar initials={`${r.paciente[0]}${r.paciente.split(" ")[1]?.[0] || ""}`} size={24} color="#0BC5DF" />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>{r.paciente}</span>
        </div>
      ),
    },
    { key: "tratamiento", label: "Tratamiento" },
    {
      key: "monto", label: "Monto",
      render: (val: unknown) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1D9E75" }}>
          {formatCurrency(Number(val))}
        </span>
      ),
    },
    { key: "metodoPago", label: "Método de pago", render: (val: unknown) => getMetodoPagoBadge(String(val)) },
    { key: "doctor", label: "Doctor" },
    { key: "estado", label: "Estado", render: (val: unknown) => getEstadoBadge(String(val)) },
  ];

  const getRowActions = (record: IncomeRecord) => [
    { icon: <Eye size={14} />, label: "Ver Detalles", onClick: () => setDetailRecord(record) },
    { icon: <Pencil size={14} />, label: "Editar", onClick: () => openEditModal(record) },
    {
      icon: <Trash2 size={14} />, label: "Eliminar", danger: true,
      onClick: () => { setRecordToDelete(record.id); setIsConfirmOpen(true); },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Alert variant="info" message="Los ingresos se registran automáticamente en el historial del paciente." />
      {errorMessage && <Alert variant="error" message={errorMessage} />}
      {isLoading && <Alert variant="info" message="Cargando ingresos..." />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#888F94", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px 0" }}>{kpi.label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: "#203F49", margin: 0 }}>{kpi.value}</p>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <DataTable<IncomeRecord>
        title="Registros de Ingresos"
        description="Gestiona todos los ingresos de la clínica"
        columns={columns}
        data={records}
        searchable
        searchPlaceholder="Buscar paciente o tratamiento..."
        searchKeys={["paciente", "tratamiento"]}
        filters={[
          {
            key: "metodoPago", placeholder: "Todos los métodos",
            options: [{ value: "Efectivo", label: "Efectivo" }, { value: "Tarjeta", label: "Tarjeta" }, { value: "Transferencia", label: "Transferencia" }],
          },
          {
            key: "estado", placeholder: "Todos los estados",
            options: [{ value: "Pagado", label: "Pagado" }, { value: "Pendiente", label: "Pendiente" }, { value: "Parcial", label: "Parcial" }],
          },
        ]}
        primaryAction={{
          label: "Registrar Ingreso", icon: <Plus size={16} />,
          onClick: () => { setErrorMessage(null); resetForm(); setIsDialogOpen(true); },
        }}
        secondaryActions={[
          { label: "Exportar Excel", icon: <FileSpreadsheet size={13} />, onClick: ({ filteredData }) => handleExportExcel(filteredData) },
          { label: "Imprimir", icon: <Printer size={13} />, onClick: ({ filteredData }) => handlePrintTable(filteredData) },
        ]}
        rowActions={getRowActions}
        getRowKey={(row) => row.id}
      />

      <Modal open={!!detailRecord} onClose={() => setDetailRecord(null)} title="Detalle del Ingreso" icon={<Eye size={18} style={{ color: "#0BC5DF" }} />} maxWidth={480}>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Fecha", value: detailRecord?.fecha },
              { label: "Paciente", value: detailRecord?.paciente },
              { label: "Tratamiento", value: detailRecord?.tratamiento },
              { label: "No. Consulta", value: `#${detailRecord?.idConsulta}` },
              { label: "Monto", value: detailRecord ? formatCurrency(detailRecord.monto) : "" },
              { label: "Método de pago", value: detailRecord?.metodoPago },
              { label: "Doctor", value: detailRecord?.doctor },
              { label: "Estado", value: detailRecord?.estado },
            ].map((f) => (
              <div key={f.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#888F94", textTransform: "uppercase", letterSpacing: "0.04em" }}>{f.label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#203F49" }}>{f.value}</span>
              </div>
            ))}
          </div>
          {detailRecord?.observacion && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#888F94", textTransform: "uppercase", letterSpacing: "0.04em" }}>Observaciones</span>
              <span style={{ fontSize: 14, color: "#5F656A" }}>{detailRecord.observacion}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setDetailRecord(null)}
              style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #D3D7DA", background: "#fff", color: "#5F656A", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={isConfirmOpen}
        variant="danger"
        title="¿Eliminar registro de ingreso?"
        description="Esta acción eliminará el registro permanentemente."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onClose={() => { setIsConfirmOpen(false); setRecordToDelete(null); }}
        onConfirm={handleDelete}
      />

      <Modal open={isDialogOpen} onClose={() => { setIsDialogOpen(false); resetForm(); }} title={editingRecord ? "Editar Ingreso" : "Registrar Nuevo Ingreso"} icon={<DollarSign size={18} style={{ color: "#0BC5DF" }} />}>
        <form onSubmit={handleRegisterIncome} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Fecha</label>
              <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Paciente</label>
              <div style={{ display: "flex", gap: 4 }}>
                <input type="text" placeholder="Buscar por nombre, apellido o identidad..." required
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); debouncedSearch(e.target.value); if (selectedPatient && e.target.value !== `${selectedPatient.nombre}`) { setSelectedPatient(null); setPatientConsultas([]); setSelectedConsultaId(""); } }}
                  style={{ ...inputStyle, flex: 1 }} />
                {isSearching && <div style={{ padding: "10px", color: "#888F94" }}>...</div>}
              </div>
              {showResults && searchResults.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "#fff", border: "1px solid #D3D7DA", borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 200, overflowY: "auto",
                }}>
                  {searchResults.map((p) => (
                    <div key={p.id_persona} onClick={() => selectPatient(p)}
                      style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "#203F49", borderBottom: "1px solid #F1F3F4" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F3F4")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                      {p.primer_nombre} {p.segundo_nombre || ""} {p.primer_apellido} {p.segundo_apellido || ""}
                    </div>
                  ))}
                </div>
              )}
              {showResults && searchResults.length === 0 && searchQuery.trim() && !isSearching && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "#fff", border: "1px solid #D3D7DA", borderRadius: 8, padding: 12, fontSize: 12, color: "#888F94" }}>
                  Sin resultados
                </div>
              )}
            </div>
          </div>

          {selectedPatient && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Paciente seleccionado</label>
                <div style={{ padding: "10px 12px", borderRadius: 8, background: "#E6F8FB", color: "#203F49", fontSize: 13, fontWeight: 500 }}>
                  {selectedPatient.nombre}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Consulta</label>
                {isLoadingConsultas ? (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: "#F1F3F4", color: "#888F94", fontSize: 13 }}>
                    Cargando consultas...
                  </div>
                ) : patientConsultas.length === 0 ? (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: "#FFF3E0", color: "#EF9F27", fontSize: 13 }}>
                    No tiene consultas registradas
                  </div>
                ) : (
                  <select value={selectedConsultaId} onChange={(e) => setSelectedConsultaId(e.target.value)} style={inputStyle}>
                    <option value="">Seleccionar consulta...</option>
                    {patientConsultas.map((c) => (
                      <option key={c.id_consulta} value={c.id_consulta}>
                        #{c.id_consulta} — {c.tratamiento || c.diagnostico || "—"} ({c.doctor})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {selectedConsulta && (
            <div style={{ fontSize: 11, color: "#1D9E75", background: "#ECFDF5", padding: "6px 10px", borderRadius: 6, display: "flex", flexDirection: "column", gap: 2 }}>
              <span><strong>Consulta #:</strong> {selectedConsulta.id_consulta}</span>
              <span><strong>Doctor:</strong> {selectedConsulta.doctor}</span>
              <span><strong>Tratamiento:</strong> {selectedConsulta.tratamiento || selectedConsulta.diagnostico || "—"}</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Monto (L)</label>
              <input type="number" step="0.01" placeholder="0.00" required value={monto}
                onChange={(e) => setMonto(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Método de pago</label>
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} style={inputStyle}>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>Observaciones</label>
            <textarea value={observaciones} placeholder="Notas o comentarios adicionales..."
              onChange={(e) => setObservaciones(e.target.value)}
              style={{ ...inputStyle, minHeight: 60, resize: "none", fontFamily: "inherit" }} />
          </div>

          {formError && (
            <div style={{ fontSize: 12, color: "#E53E3E", background: "#FFF5F5", padding: "8px 12px", borderRadius: 6 }}>
              {formError}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <button type="button" onClick={() => { setIsDialogOpen(false); resetForm(); }}
              style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #D3D7DA", background: "#fff", color: "#5F656A", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit"
              style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#0BC5DF", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              {editingRecord ? "Guardar Cambios" : "Registrar Ingreso"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #D3D7DA", outline: "none", fontSize: 14, color: "#203F49",
  boxSizing: "border-box",
};
