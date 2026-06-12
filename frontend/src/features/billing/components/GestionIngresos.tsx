import { useEffect, useMemo, useState } from "react";
import { Card, Alert, Avatar } from "../../../context";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Plus,
  FileSpreadsheet,
  Printer,
  XCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { DataTable, ConfirmModal } from "../../../components";
import billingService from "../services/billingService";
import type { CreatePaymentInput, PatientPayment } from "../types";

interface IncomeRecord {
  id: string;
  idConsulta: number;
  fecha: string;
  paciente: string;
  tratamiento: string;
  monto: number;
  metodoPago: "Efectivo" | "Tarjeta" | "Transferencia";
  doctor: string;
  estado: "Pagado" | "Pendiente" | "Parcial";
  observacion?: string;
}

const mapPaymentToIncomeRecord = (payment: PatientPayment): IncomeRecord => {
  const patientName = payment.consulta?.persona
    ? `${payment.consulta.persona.nombre} ${payment.consulta.persona.apellido}`.trim()
    : `Consulta #${payment.id_consulta}`;

  return {
    id: String(payment.id_pago),
    idConsulta: payment.id_consulta,
    fecha: payment.fecha,
    paciente: patientName,
    tratamiento:
      payment.consulta?.tratamiento ||
      payment.consulta?.diagnostico ||
      `Pago de consulta #${payment.id_consulta}`,
    monto: Number(payment.abono),
    metodoPago: "Efectivo",
    doctor: "—",
    estado: "Pagado",
    observacion: payment.observacion,
  };
};

export function GestionIngresos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deletion confirm states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // Form states
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [idConsulta, setIdConsulta] = useState("");
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState<
    "Efectivo" | "Tarjeta" | "Transferencia"
  >("Efectivo");
  const [observaciones, setObservaciones] = useState("");

  const loadPayments = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await billingService.getAll();
      setRecords((response.data || []).map(mapPaymentToIncomeRecord));
    } catch (error: any) {
      setErrorMessage(error?.message || "No se pudo cargar el historial de ingresos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const totals = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.slice(0, 7);
    const monthRecords = records.filter((record) => record.fecha?.startsWith(currentMonth));
    const todayRecords = records.filter((record) => record.fecha === today);
    const monthTotal = monthRecords.reduce((sum, record) => sum + record.monto, 0);
    const dayTotal = todayRecords.reduce((sum, record) => sum + record.monto, 0);

    return {
      monthTotal,
      dayTotal,
      average: monthRecords.length ? monthTotal / monthRecords.length : 0,
    };
  }, [records]);

  const formatCurrency = (value: number) =>
    `L ${value.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`;

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
      value: String(records.length),
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

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      Pagado: { bg: "#ECFDF5", text: "#1D9E75" },
      Pendiente: { bg: "#FFFBEB", text: "#EF9F27" },
      Parcial: { bg: "#E6F8FB", text: "#0BC5DF" },
    };
    const variant = variants[estado] || variants["Pendiente"];
    return (
      <span
        style={{
          background: variant.bg,
          color: variant.text,
          padding: "3px 10px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: 600,
        }}
      >
        {estado}
      </span>
    );
  };

  const getMetodoPagoBadge = (metodo: string) => {
    return (
      <span
        style={{
          background: "#F1F3F4",
          color: "#5F656A",
          padding: "3px 10px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: 600,
        }}
      >
        {metodo}
      </span>
    );
  };

  const handleRegisterIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idConsulta || !monto || !fecha) {
      setErrorMessage("Por favor complete los campos requeridos");
      return;
    }

    const payload: CreatePaymentInput = {
      id_consulta: Number(idConsulta),
      fecha,
      abono: Number(monto),
      observacion: observaciones || undefined,
    };

    try {
      setErrorMessage(null);
      const response = await billingService.create(payload);
      setRecords([mapPaymentToIncomeRecord(response.data), ...records]);
      setIsDialogOpen(false);
      setIdConsulta("");
      setMonto("");
      setObservaciones("");
    } catch (error: any) {
      setErrorMessage(error?.message || "No se pudo registrar el ingreso");
    }
  };

  const columns = [
    { key: "fecha", label: "Fecha", width: 110 },
    { key: "idConsulta", label: "Consulta", width: 90 },
    {
      key: "paciente",
      label: "Paciente",
      render: (_val: unknown, record: IncomeRecord) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar
            initials={`${record.paciente[0]}${record.paciente.split(" ")[1]?.[0] || ""}`}
            size={24}
            color="#0BC5DF"
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>
            {record.paciente}
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
          L {Number(val).toLocaleString("es-HN", { minimumFractionDigits: 2 })}
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
      onClick: () =>
        alert(`Detalles: ${record.paciente} - ${record.tratamiento}`),
    },
    {
      icon: <Edit size={14} />,
      label: "Editar",
      onClick: () => alert("Editar próximamente"),
    },
    {
      icon: <Trash2 size={14} />,
      label: "Eliminar",
      onClick: () => {
        setRecordToDelete(record.id);
        setIsConfirmOpen(true);
      },
      danger: true,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Alert informativo */}
      <Alert
        variant="info"
        message="Los ingresos se registran automáticamente en el historial del paciente."
      />
      {errorMessage && <Alert variant="error" message={errorMessage} />}
      {isLoading && <Alert variant="info" message="Cargando ingresos..." />}

      {/* KPIs */}
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

      {/* Tabla de Registros */}
      <DataTable<any>
        title="Registros de Ingresos"
        description="Gestiona todos los ingresos de la clínica"
        columns={columns}
        data={records}
        searchable={true}
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
        primaryAction={{
          label: "Registrar Ingreso",
          icon: <Plus size={16} />,
          onClick: () => setIsDialogOpen(true),
        }}
        secondaryActions={[
          {
            label: "Exportar",
            icon: <FileSpreadsheet size={13} />,
            onClick: () => alert("Exportando registros a Excel..."),
          },
          {
            label: "Imprimir",
            icon: <Printer size={13} />,
            onClick: () => window.print(),
          },
        ]}
        rowActions={getRowActions}
        getRowKey={(row) => row.id}
      />

      {/* ConfirmModal para eliminación */}
      <ConfirmModal
        open={isConfirmOpen}
        variant="danger"
        title="¿Eliminar registro de ingreso?"
        description="Esta acción eliminará el registro permanentemente. Esta operación no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onClose={() => {
          setIsConfirmOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={() => {
          if (recordToDelete) {
            setRecords(records.filter((r) => r.id !== recordToDelete));
            setRecordToDelete(null);
          }
          setIsConfirmOpen(false);
        }}
      />

      {/* Modal - Registrar Ingreso */}
      {isDialogOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(32, 63, 73, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 500,
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #EAECEE",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#F8F9FA",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DollarSign size={18} style={{ color: "#0BC5DF" }} />
                <h3
                  style={{
                    margin: 0,
                    color: "#203F49",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Registrar Nuevo Ingreso
                </h3>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#888F94",
                  fontSize: 18,
                }}
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Modal Form */}
            {/* Note: keeping form fields but we can wrap inside FormSection if needed later */}
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
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
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
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #D3D7DA",
                      outline: "none",
                      fontSize: 14,
                      color: "#203F49",
                    }}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    ID Consulta
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej. 12"
                    required
                    value={idConsulta}
                    onChange={(e) => setIdConsulta(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #D3D7DA",
                      outline: "none",
                      fontSize: 14,
                      color: "#203F49",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Concepto
                </label>
                <input
                  disabled
                  value="Pago de paciente asociado a la consulta"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #D3D7DA",
                    outline: "none",
                    fontSize: 14,
                    color: "#203F49",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Monto ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #D3D7DA",
                      outline: "none",
                      fontSize: 14,
                      color: "#203F49",
                    }}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Método de pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #D3D7DA",
                      outline: "none",
                      fontSize: 14,
                      background: "#fff",
                      color: "#203F49",
                    }}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Doctor Responsable
                </label>
                <input
                  disabled
                  value="Dr. Karla Arita"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #D3D7DA",
                    outline: "none",
                    fontSize: 14,
                    background: "#F1F3F4",
                    color: "#203F49",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Observaciones
                </label>
                <textarea
                  value={observaciones}
                  placeholder="Notas o comentarios adicionales..."
                  onChange={(e) => setObservaciones(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 60,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #D3D7DA",
                    outline: "none",
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "none",
                  }}
                />
              </div>

              {/* Action Buttons */}
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
                  onClick={() => setIsDialogOpen(false)}
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
                  Registrar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
