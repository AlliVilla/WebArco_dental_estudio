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
import { useResponsive } from "../../../hooks/useWindowWidth";
import { useAuthStore } from "../../auth/hooks/useAuthStore";
import api from "../../../services/api";
import billingService from "../services/billingService";
import { consultaService } from "../../patients/services/consultaService";
import { CuentasDestinoConfig } from "./CuentasDestinoConfig";
import type { CreatePaymentInput, PatientPayment } from "../types";
import { exportToExcel } from "../../../utils/exportToExcel";

interface IncomeRecord extends Record<string, unknown> {
  id: string;
  idConsulta: number;
  fecha: string;
  paciente: string;
  tratamiento: string;
  monto: number;
  metodoPago: string;
  cuentaDestino?: string;
  doctor: string;
  estado: string;
  observacion?: string;
}

const mapPaymentToIncomeRecord = (payment: PatientPayment): IncomeRecord => ({
  id: String(payment.id_pago),
  idConsulta: payment.id_consulta,
  fecha: payment.fecha,
  paciente:
    `${payment.consulta.persona.nombre} ${payment.consulta.persona.apellido}`.trim(),
  tratamiento:
    payment.consulta.tratamiento ||
    payment.consulta.diagnostico ||
    `Pago de consulta #${payment.id_consulta}`,
  monto: Number(payment.abono),
  metodoPago: payment.metodoPago,
  cuentaDestino: payment.cuentaDestino,
  doctor: payment.consulta.doctor?.nombre || "—",
  estado: payment.estado,
  observacion: payment.observacion,
});

export function GestionIngresos() {
  const { isMobile } = useResponsive();
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
  const [searchResults, setSearchResults] = useState<
    Array<{
      id_persona: number;
      primer_nombre: string;
      segundo_nombre: string | null;
      primer_apellido: string;
      segundo_apellido: string | null;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected patient and consulta
  const [selectedPatient, setSelectedPatient] = useState<{
    id: number;
    nombre: string;
  } | null>(null);
  const [patientConsultas, setPatientConsultas] = useState<
    Array<{
      id_consulta: number;
      diagnostico: string | null;
      tratamiento: string | null;
      fecha_inicio: string;
      doctor: string;
    }>
  >([]);
  const [selectedConsultaId, setSelectedConsultaId] = useState("");
  const [isLoadingConsultas, setIsLoadingConsultas] = useState(false);

  // Other form fields
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("Efectivo");
  const [cuentaDestino, setCuentaDestino] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Cuenta destino config management
  const user = useAuthStore((s) => s.user);
  const canGestionarIngresos = user?.privilegios?.includes(10) ?? false;
  const [configItems, setConfigItems] = useState<{ id: number; tipo: string; nombre: string; comision: number | null }[]>([]);

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
      setErrorMessage(
        error?.message || "No se pudo cargar el historial de ingresos"
      );
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
    const monthRecords = records.filter((r) =>
      r.fecha?.startsWith(currentMonth)
    );
    const todayRecords = records.filter((r) => r.fecha === today);
    const monthTotal = monthRecords.reduce((s, r) => s + r.monto, 0);
    const dayTotal = todayRecords.reduce((s, r) => s + r.monto, 0);
    return {
      monthTotal,
      dayTotal,
      average: monthRecords.length ? monthTotal / monthRecords.length : 0,
    };
  }, [records]);

  const formatCurrency = (v: number) =>
    `L ${v.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

  const kpis = [
    {
      label: "Ingresos del Mes",
      value: formatCurrency(totals.monthTotal),
      icon: DollarSign,
      color: "#0BC5DF",
      bg: "#E6F8FB",
    },
    {
      label: "Pagos Registrados",
      value: String(totalRecords),
      icon: TrendingUp,
      color: "#EF9F27",
      bg: "#FFFBEB",
    },
    {
      label: "Ingresos del Día",
      value: formatCurrency(totals.dayTotal),
      icon: Calendar,
      color: "#1D9E75",
      bg: "#ECFDF5",
    },
    {
      label: "Promedio por Paciente",
      value: formatCurrency(totals.average),
      icon: Users,
      color: "#203F49",
      bg: "#F1F3F4",
    },
  ];

  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await api.get("/persona", {
        params: { search: query, limit: 8 },
      });
      const data = response.data as {
        data: Array<{
          id_persona: number;
          primer_nombre: string;
          segundo_nombre: string | null;
          primer_apellido: string;
          segundo_apellido: string | null;
        }>;
      };
      setSearchResults(data.data || []);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (value: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => searchPatients(value), 300);
    },
    [searchPatients]
  );

  const selectPatient = async (p: {
    id_persona: number;
    primer_nombre: string;
    segundo_nombre: string | null;
    primer_apellido: string;
  }) => {
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

  const selectedConsulta = patientConsultas.find(
    (c) => String(c.id_consulta) === selectedConsultaId
  );

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      Pagado: { bg: "#ECFDF5", text: "#1D9E75" },
      Pendiente: { bg: "#FFFBEB", text: "#EF9F27" },
      Parcial: { bg: "#E6F8FB", text: "#0BC5DF" },
    };
    const s = variants[estado] || variants.Pendiente;
    return (
      <span
        style={{
          background: s.bg,
          color: s.text,
          padding: "3px 10px",
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {estado}
      </span>
    );
  };

  const getMetodoPagoBadge = (m: string) => (
    <span
      style={{
        background: "#F1F3F4",
        color: "#5F656A",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
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
      cuentaDestino: cuentaDestino || undefined,
      observacion: editingRecord ? observaciones : observaciones || undefined,
    };
    try {
      if (editingRecord) {
        const response = await billingService.update(
          Number(editingRecord.id),
          payload
        );
        const updatedRecord = mapPaymentToIncomeRecord(response.data!);
        setRecords(
          records.map((record) =>
            record.id === updatedRecord.id ? updatedRecord : record
          )
        );
      } else {
        const response = await billingService.create(payload);
        setRecords([mapPaymentToIncomeRecord(response.data!), ...records]);
        setTotalRecords((current) => current + 1);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      setFormError(
        error?.message ||
          (editingRecord
            ? "No se pudo actualizar el ingreso"
            : "No se pudo registrar el ingreso")
      );
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
    setCuentaDestino("");
    setObservaciones("");
    setFormError(null);
  };

  const openEditModal = (record: IncomeRecord) => {
    setErrorMessage(null);
    setEditingRecord(record);
    setFecha(record.fecha);
    setSearchQuery(record.paciente);
    setSelectedPatient({ id: 0, nombre: record.paciente });
    setPatientConsultas([
      {
        id_consulta: record.idConsulta,
        diagnostico: null,
        tratamiento: record.tratamiento,
        fecha_inicio: record.fecha,
        doctor: record.doctor,
      },
    ]);
    setSelectedConsultaId(String(record.idConsulta));
    setMonto(String(record.monto));
    setMetodoPago(record.metodoPago || "Efectivo");
    setCuentaDestino(record.cuentaDestino || "");
    setObservaciones(record.observacion || "");
    setFormError(null);
    setShowResults(false);
    setIsDialogOpen(true);
  };

  const escapeHtml = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getTableRows = (rows: IncomeRecord[]) =>
    rows.map((record) => ({
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

  const handleExportExcel = async (rows: IncomeRecord[]) => {
    if (!rows.length) {
      alert("No hay ingresos para exportar.");
      return;
    }

    const columnas = [
      { header: "Fecha", key: "fecha", width: 14 },
      { header: "Paciente", key: "paciente", width: 25 },
      { header: "Tratamiento", key: "tratamiento", width: 25 },
      { header: "No. Consulta", key: "noConsulta", width: 15 },
      { header: "Monto", key: "monto", width: 16 },
      { header: "Método de pago", key: "metodoPago", width: 18 },
      { header: "Cuenta destino", key: "cuentaDestino", width: 22 },
      { header: "Doctor", key: "doctor", width: 22 },
      { header: "Estado", key: "estado", width: 14 },
      { header: "Observaciones", key: "observaciones", width: 30 },
    ];

    const datos = rows.map((r) => ({
      fecha: r.fecha,
      paciente: r.paciente,
      tratamiento: r.tratamiento,
      noConsulta: `#${r.idConsulta}`,
      monto: r.monto,
      metodoPago: r.metodoPago,
      cuentaDestino: r.cuentaDestino || "",
      doctor: r.doctor,
      estado: r.estado,
      observaciones: r.observacion || "",
    }));

    await exportToExcel(datos, columnas, "Ingresos", "ingresos", {
      currencyKeys: ["monto"],
    });
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
        <thead><tr>${headers
          .map((header) => `<th>${escapeHtml(header)}</th>`)
          .join("")}</tr></thead>
        <tbody>
          ${tableRows
            .map(
              (row) =>
                `<tr>${headers
                  .map(
                    (header) =>
                      `<td>${escapeHtml(row[header as keyof typeof row])}</td>`
                  )
                  .join("")}</tr>`
            )
            .join("")}
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
          <p>Fecha de impresión: ${escapeHtml(
            new Date().toLocaleString("es-HN")
          )}</p>
          ${tableHtml}
          <div class="total">Total: ${escapeHtml(
            formatCurrency(rows.reduce((sum, row) => sum + row.monto, 0))
          )}</div>
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
      key: "paciente",
      label: "Paciente",
      render: (_val: unknown, r: IncomeRecord) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar
            initials={`${r.paciente[0]}${r.paciente.split(" ")[1]?.[0] || ""}`}
            size={24}
            color="#0BC5DF"
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>
            {r.paciente}
          </span>
        </div>
      ),
    },
    { key: "tratamiento", label: "Tratamiento" },
    {
      key: "monto",
      label: "Monto",
      render: (val: unknown) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1D9E75" }}>
          {formatCurrency(Number(val))}
        </span>
      ),
    },
    {
      key: "metodoPago",
      label: "Método de pago",
      render: (val: unknown) => getMetodoPagoBadge(String(val)),
    },
    { key: "doctor", label: "Doctor" },
    {
      key: "estado",
      label: "Estado",
      render: (val: unknown) => getEstadoBadge(String(val)),
    },
  ];

  const getRowActions = (record: IncomeRecord) => [
    {
      icon: <Eye size={14} />,
      label: "Ver Detalles",
      onClick: () => setDetailRecord(record),
    },
    {
      icon: <Pencil size={14} />,
      label: "Editar",
      onClick: () => openEditModal(record),
    },
    {
      icon: <Trash2 size={14} />,
      label: "Eliminar",
      danger: true,
      onClick: () => {
        setRecordToDelete(record.id);
        setIsConfirmOpen(true);
      },
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Alert
        variant="info"
        message="Los ingresos se registran automáticamente en el historial del paciente."
      />
      {errorMessage && <Alert variant="error" message={errorMessage} />}
      {isLoading && <Alert variant="info" message="Cargando ingresos..." />}

      {canGestionarIngresos && (
        <CuentasDestinoConfig
          configItems={configItems}
          onConfigChange={setConfigItems}
        />
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#888F94",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    margin: "0 0 6px 0",
                  }}
                >
                  {kpi.label}
                </p>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#203F49",
                    margin: 0,
                  }}
                >
                  {kpi.value}
                </p>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: kpi.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
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
            key: "metodoPago",
            placeholder: "Todos los métodos",
            options: [
              { value: "Efectivo", label: "Efectivo" },
              { value: "Tarjeta", label: "Tarjeta" },
              { value: "Transferencia", label: "Transferencia" },
            ],
          },
          {
            key: "estado",
            placeholder: "Todos los estados",
            options: [
              { value: "Pagado", label: "Pagado" },
              { value: "Pendiente", label: "Pendiente" },
              { value: "Parcial", label: "Parcial" },
            ],
          },
        ]}
        secondaryActions={[
          {
            label: "Exportar Excel",
            icon: <FileSpreadsheet size={13} />,
            onClick: ({ filteredData }) => handleExportExcel(filteredData),
          },
          {
            label: "Imprimir",
            icon: <Printer size={13} />,
            onClick: ({ filteredData }) => handlePrintTable(filteredData),
          },
        ]}
        rowActions={getRowActions}
        getRowKey={(row) => row.id}
        renderMobileCard={(record) => (
          <IncomeCard
            record={record}
            getEstadoBadge={getEstadoBadge}
            getMetodoPagoBadge={getMetodoPagoBadge}
            actions={getRowActions(record)}
          />
        )}
      />

      <Modal
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        title="Detalle del Ingreso"
        icon={<Eye size={18} style={{ color: "#0BC5DF" }} />}
        maxWidth={480}
      >
        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 12,
            }}
          >
            {[
              { label: "Fecha", value: detailRecord?.fecha },
              { label: "Paciente", value: detailRecord?.paciente },
              { label: "Tratamiento", value: detailRecord?.tratamiento },
              { label: "No. Consulta", value: `#${detailRecord?.idConsulta}` },
              {
                label: "Monto",
                value: detailRecord ? formatCurrency(detailRecord.monto) : "",
              },
              { label: "Método de pago", value: detailRecord?.metodoPago },
              { label: "Cuenta destino", value: detailRecord?.cuentaDestino || "—" },
              { label: "Doctor", value: detailRecord?.doctor },
              { label: "Estado", value: detailRecord?.estado },
            ].map((f) => (
              <div
                key={f.label}
                style={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#888F94",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {f.label}
                </span>
                <span
                  style={{ fontSize: 14, fontWeight: 500, color: "#203F49" }}
                >
                  {f.value}
                </span>
              </div>
            ))}
          </div>
          {detailRecord?.observacion && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#888F94",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Observaciones
              </span>
              <span style={{ fontSize: 14, color: "#5F656A" }}>
                {detailRecord.observacion}
              </span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <button
              onClick={() => setDetailRecord(null)}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #D3D7DA",
                background: "#fff",
                color: "#5F656A",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
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
        onClose={() => {
          setIsConfirmOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      <Modal
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          resetForm();
        }}
        title={editingRecord ? "Editar Ingreso" : "Registrar Nuevo Ingreso"}
        icon={<DollarSign size={18} style={{ color: "#0BC5DF" }} />}
      >
        <form
          onSubmit={handleRegisterIncome}
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
              >
                Fecha
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                position: "relative",
              }}
            >
              <label
                style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
              >
                Paciente
              </label>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o identidad..."
                  required
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    debouncedSearch(e.target.value);
                    if (
                      selectedPatient &&
                      e.target.value !== `${selectedPatient.nombre}`
                    ) {
                      setSelectedPatient(null);
                      setPatientConsultas([]);
                      setSelectedConsultaId("");
                    }
                  }}
                  style={{ ...inputStyle, flex: 1 }}
                />
                {isSearching && (
                  <div style={{ padding: "10px", color: "#888F94" }}>...</div>
                )}
              </div>
              {showResults && searchResults.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    background: "#fff",
                    border: "1px solid #D3D7DA",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  {searchResults.map((p) => (
                    <div
                      key={p.id_persona}
                      onClick={() => selectPatient(p)}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        fontSize: 13,
                        color: "#203F49",
                        borderBottom: "1px solid #F1F3F4",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F1F3F4")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "#fff")
                      }
                    >
                      {p.primer_nombre} {p.segundo_nombre || ""}{" "}
                      {p.primer_apellido} {p.segundo_apellido || ""}
                    </div>
                  ))}
                </div>
              )}
              {showResults &&
                searchResults.length === 0 &&
                searchQuery.trim() &&
                !isSearching && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      zIndex: 10,
                      background: "#fff",
                      border: "1px solid #D3D7DA",
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 12,
                      color: "#888F94",
                    }}
                  >
                    Sin resultados
                  </div>
                )}
            </div>
          </div>

          {selectedPatient && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Paciente seleccionado
                </label>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "#E6F8FB",
                    color: "#203F49",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {selectedPatient.nombre}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Consulta
                </label>
                {isLoadingConsultas ? (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#F1F3F4",
                      color: "#888F94",
                      fontSize: 13,
                    }}
                  >
                    Cargando consultas...
                  </div>
                ) : patientConsultas.length === 0 ? (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#FFF3E0",
                      color: "#EF9F27",
                      fontSize: 13,
                    }}
                  >
                    No tiene consultas registradas
                  </div>
                ) : (
                  <select
                    value={selectedConsultaId}
                    onChange={(e) => setSelectedConsultaId(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Seleccionar consulta...</option>
                    {patientConsultas.map((c) => (
                      <option key={c.id_consulta} value={c.id_consulta}>
                        #{c.id_consulta} —{" "}
                        {c.tratamiento || c.diagnostico || "—"} ({c.doctor})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {selectedConsulta && (
            <div
              style={{
                fontSize: 11,
                color: "#1D9E75",
                background: "#ECFDF5",
                padding: "6px 10px",
                borderRadius: 6,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span>
                <strong>Consulta #:</strong> {selectedConsulta.id_consulta}
              </span>
              <span>
                <strong>Doctor:</strong> {selectedConsulta.doctor}
              </span>
              <span>
                <strong>Tratamiento:</strong>{" "}
                {selectedConsulta.tratamiento ||
                  selectedConsulta.diagnostico ||
                  "—"}
              </span>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
              >
                Monto (L)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                required
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
              >
                Método de pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => {
                  setMetodoPago(e.target.value);
                  setCuentaDestino("");
                }}
                style={inputStyle}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>
            {metodoPago === "Tarjeta" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>
                  Cuenta destino (POS)
                </label>
                <select
                  value={cuentaDestino}
                  onChange={(e) => setCuentaDestino(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- Seleccione --</option>
                  {configItems.filter((i) => i.tipo === "TARJETA").map((item) => (
                    <option key={item.id} value={item.nombre}>{item.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            {metodoPago === "Transferencia" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>
                  Cuenta destino
                </label>
                <select
                  value={cuentaDestino}
                  onChange={(e) => setCuentaDestino(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- Seleccione --</option>
                  {configItems.filter((i) => i.tipo === "TRANSFERENCIA").map((item) => (
                    <option key={item.id} value={item.nombre}>{item.nombre}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>
              Observaciones
            </label>
            <textarea
              value={observaciones}
              placeholder="Notas o comentarios adicionales..."
              onChange={(e) => setObservaciones(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: 60,
                resize: "none",
                fontFamily: "inherit",
              }}
            />
          </div>

          {formError && (
            <div
              style={{
                fontSize: 12,
                color: "#E53E3E",
                background: "#FFF5F5",
                padding: "8px 12px",
                borderRadius: 6,
              }}
            >
              {formError}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "1px solid #D3D7DA",
                background: "#fff",
                color: "#5F656A",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "#0BC5DF",
                color: "#fff",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {editingRecord ? "Guardar Cambios" : "Registrar Ingreso"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function IncomeCard({
  record,
  getEstadoBadge,
  getMetodoPagoBadge,
  actions,
}: {
  record: IncomeRecord;
  getEstadoBadge: (estado: string) => React.ReactNode;
  getMetodoPagoBadge: (m: string) => React.ReactNode;
  actions: {
    icon: React.ReactNode;
    label?: string;
    onClick: (row: IncomeRecord) => void;
    danger?: boolean;
  }[];
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #D3D7DA",
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Avatar
            initials={`${record.paciente[0]}${
              record.paciente.split(" ")[1]?.[0] || ""
            }`}
            size={32}
            color="#0BC5DF"
          />
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#203F49",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {record.paciente}
            </p>
            <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
              {record.fecha}
            </p>
          </div>
        </div>
        {getEstadoBadge(record.estado)}
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
          <span style={{ fontSize: 12, color: "#888F94" }}>Tratamiento</span>
          <span style={{ fontSize: 13, color: "#203F49", textAlign: "right" }}>
            {record.tratamiento}
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
          <span style={{ fontSize: 12, color: "#888F94" }}>Monto</span>
          <span
            style={{ fontSize: 13, fontWeight: 600, color: "#1D9E75" }}
          >{`L ${record.monto.toLocaleString("es-HN", {
            minimumFractionDigits: 2,
          })}`}</span>
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
          <span style={{ fontSize: 12, color: "#888F94" }}>Método</span>
          {getMetodoPagoBadge(record.metodoPago)}
        </div>
        {record.cuentaDestino && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "7px 0",
              borderBottom: "1px solid #F8F9FA",
            }}
          >
            <span style={{ fontSize: 12, color: "#888F94" }}>Cuenta</span>
            <span style={{ fontSize: 13, color: "#203F49" }}>{record.cuentaDestino}</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Doctor</span>
          <span style={{ fontSize: 13, color: "#203F49" }}>
            {record.doctor}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {actions.map((action, i) => (
            <button
              key={i}
              title={action.label}
              onClick={() => action.onClick(record)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 0",
                borderRadius: 8,
                border: "1px solid #D3D7DA",
                background: "#fff",
                color: action.danger ? "#E24B4A" : "#5F656A",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #D3D7DA",
  outline: "none",
  fontSize: 14,
  color: "#203F49",
  boxSizing: "border-box",
};
