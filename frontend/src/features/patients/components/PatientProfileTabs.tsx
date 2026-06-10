import { ClipboardList } from "lucide-react";
import { DataTable } from "../../../components";
import type { Column } from "../../../components";
import { Button } from "../../../context";
import { formatCurrency, formatDate } from "../../../utils/formatters";

export type AppointmentHistoryItem = {
  id_cita: number;
  fecha_inicio: string;
  tipo_cita?: string | null;
  motivo?: string | null;
  estado: string;
  doctor?: {
    username?: string;
    persona?: {
      primer_nombre?: string | null;
      primer_apellido?: string | null;
    } | null;
  } | null;
};

type AppointmentRow = Record<string, unknown> & {
  id: number;
  fecha: string;
  titulo: string;
  doctor: string;
  estado: string;
};

export type FinancialRow = Record<string, unknown> & {
  id: string;
  date: string;
  concept: string;
  amount: number;
  status: "Pagado";
};

export function AppointmentsTab({ appointments }: { appointments: AppointmentHistoryItem[] }) {
  const rows: AppointmentRow[] = appointments.map((appointment) => ({
    id: appointment.id_cita,
    fecha: appointment.fecha_inicio,
    titulo: appointment.tipo_cita || appointment.motivo || "Cita dental",
    doctor: formatDoctorName(appointment),
    estado: appointment.estado,
  }));

  const columns: Column<AppointmentRow>[] = [
    { key: "fecha", label: "Fecha", render: (_value, row) => formatDate(row.fecha) },
    { key: "titulo", label: "Cita" },
    { key: "doctor", label: "Doctor" },
    { key: "estado", label: "Estado", render: (_value, row) => <StatusPill status={row.estado} /> },
  ];

  return (
    <DataTable<AppointmentRow>
      columns={columns}
      data={rows}
      emptyMessage="Este paciente no tiene citas registradas."
      getRowKey={(row) => String(row.id)}
      hidePagination
      searchable={false}
    />
  );
}

export function FinancialTab({ rows }: { rows: FinancialRow[] }) {
  const totals = rows.reduce(
    (summary, row) => ({
      paid: summary.paid + (row.status === "Pagado" ? row.amount : 0),
      pending: summary.pending,
    }),
    { paid: 0, pending: 0 },
  );
  const totalPaid = totals.paid;
  const totalPending = totals.pending;
  const totalBilled = totalPaid + totalPending;

  return (
    <div>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h3 style={{ color: "var(--arco-navy)", fontSize: 16, fontWeight: 700, margin: 0 }}>Resumen financiero</h3>
          <p style={{ color: "var(--arco-gray-500)", fontSize: 12, margin: "4px 0 0" }}>Historial de facturación y estado de cuenta</p>
        </div>
        <Button variant="secondary">
          <ClipboardList size={15} />
          Generar estado de cuenta
        </Button>
      </div>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 18 }}>
        <FinanceSummary label="Total facturado" tone="neutral" value={totalBilled} />
        <FinanceSummary label="Total pagado" tone="success" value={totalPaid} />
        <FinanceSummary label="Saldo pendiente" tone="danger" value={totalPending} />
      </div>

      <DataTable<FinancialRow>
        columns={[
          { key: "date", label: "Fecha", render: (_value, row) => formatDate(row.date) },
          { key: "concept", label: "Concepto" },
          { key: "amount", label: "Monto", render: (_value, row) => formatCurrency(row.amount) },
          { key: "status", label: "Estado", render: (_value, row) => <StatusPill status={row.status} /> },
        ]}
        data={rows}
        emptyMessage="No hay pagos registrados para este paciente."
        getRowKey={(row) => row.id}
        hidePagination
        searchable={false}
      />
    </div>
  );
}

function FinanceSummary({ label, tone, value }: { label: string; tone: "neutral" | "success" | "danger"; value: number }) {
  const styles = {
    neutral: { bg: "var(--arco-gray-50)", border: "var(--arco-gray-300)", color: "var(--arco-navy)" },
    success: { bg: "var(--arco-success-soft)", border: "var(--arco-success)", color: "var(--arco-success)" },
    danger: { bg: "var(--arco-danger-soft)", border: "var(--arco-danger)", color: "var(--arco-danger)" },
  }[tone];

  return (
    <div style={{ background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: 8, padding: 18 }}>
      <div style={{ color: "var(--arco-gray-500)", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: styles.color, fontSize: 24, fontWeight: 800, marginTop: 8 }}>L. {value.toLocaleString("es-HN")}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  const isSuccess = ["atendida", "pagado", "completada", "completed"].includes(normalizedStatus);
  const isPending = ["pendiente", "programada", "pending", "scheduled"].includes(normalizedStatus);
  const bg = isSuccess ? "var(--arco-success-soft)" : isPending ? "var(--arco-warning-soft)" : "var(--arco-primary-light)";
  const color = isSuccess ? "var(--arco-success)" : isPending ? "var(--arco-warning)" : "var(--arco-primary)";

  return (
    <span style={{ background: bg, borderRadius: 999, color, fontSize: 12, fontWeight: 700, padding: "5px 10px", textAlign: "center" }}>
      {status}
    </span>
  );
}

function formatDoctorName(appointment: AppointmentHistoryItem) {
  const persona = appointment.doctor?.persona;
  const fullName = [persona?.primer_nombre, persona?.primer_apellido].filter(Boolean).join(" ");
  return fullName || appointment.doctor?.username || "Doctor no asignado";
}
