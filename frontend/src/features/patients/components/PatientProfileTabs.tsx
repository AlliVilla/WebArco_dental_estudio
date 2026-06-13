import { ClipboardList } from "lucide-react";
import { DataTable } from "../../../components";
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

export type FinancialRow = Record<string, unknown> & {
  id: string;
  date: string;
  concept: string;
  amount: number;
  status: "Pagado";
};

export function AppointmentsTab({ appointments }: { appointments: AppointmentHistoryItem[] }) {
  if (appointments.length === 0) {
    return (
      <div
        style={{
          background: "#F8F9FA",
          border: "1px solid #D3D7DA",
          borderRadius: 8,
          color: "#888F94",
          fontSize: 13,
          padding: "32px 16px",
          textAlign: "center",
        }}
      >
        Este paciente no tiene citas registradas.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {appointments.map((appointment) => (
        <AppointmentCard key={appointment.id_cita} appointment={appointment} />
      ))}
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: AppointmentHistoryItem }) {
  const appointmentDate = new Date(appointment.fecha_inicio);
  const day = appointmentDate.toLocaleDateString("es-HN", { day: "2-digit" });
  const month = appointmentDate
    .toLocaleDateString("es-HN", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const time = appointmentDate.toLocaleTimeString("es-HN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const title = capitalizeFirst(appointment.tipo_cita || appointment.motivo || "Cita dental");
  const doctor = formatDoctorName(appointment);
  const statusLabel = formatAppointmentStatus(appointment.estado);

  return (
    <div
      style={{
        alignItems: "center",
        background: "#FFFFFF",
        border: "1px solid #D3D7DA",
        borderRadius: 8,
        display: "flex",
        gap: 14,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "#F1F3F4",
          borderRadius: 8,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          height: 40,
          justifyContent: "center",
          width: 40,
        }}
      >
        <span style={{ color: "#203F49", fontSize: 11, fontWeight: 700, lineHeight: "11px" }}>
          {day}
        </span>
        <span
          style={{
            color: "#888F94",
            fontSize: 9,
            fontWeight: 400,
            lineHeight: "9px",
            marginTop: 1,
            textTransform: "uppercase",
          }}
        >
          {month}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#203F49", fontSize: 13, fontWeight: 600, lineHeight: "19.5px" }}>
          {title}
        </div>
        <div style={{ color: "#888F94", fontSize: 12, lineHeight: "18px", marginTop: 2 }}>
          {doctor} · {time}
        </div>
      </div>

      <AppointmentStatusBadge status={appointment.estado} label={statusLabel} />
    </div>
  );
}

function AppointmentStatusBadge({ status, label }: { status: string; label: string }) {
  const normalizedStatus = status.toLowerCase();
  const isAttended = ["atendida", "completada", "completed"].includes(normalizedStatus);
  const isScheduled = ["programada", "confirmada", "reprogramada", "pending", "scheduled"].includes(
    normalizedStatus,
  );

  const styles = isAttended
    ? { background: "#E6E8EC", color: "#5A6370" }
    : isScheduled
      ? { background: "#D4EDF7", color: "#3A88AA" }
      : { background: "#F1F3F4", color: "#5F656A" };

  return (
    <span
      style={{
        background: styles.background,
        borderRadius: 20,
        color: styles.color,
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: "16.5px",
        minHeight: 22.5,
        padding: "3px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
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
          <h3 style={{ color: "#203F49", fontSize: 16, fontWeight: 700, margin: 0 }}>Resumen financiero</h3>
          <p style={{ color: "#888F94", fontSize: 12, margin: "4px 0 0" }}>Historial de facturación y estado de cuenta</p>
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
    neutral: { bg: "#F8F9FA", border: "#D3D7DA", color: "#203F49" },
    success: { bg: "rgba(29, 158, 117, 0.12)", border: "#1D9E75", color: "#1D9E75" },
    danger: { bg: "rgba(226, 75, 74, 0.12)", border: "#E24B4A", color: "#E24B4A" },
  }[tone];

  return (
    <div style={{ background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: 8, padding: 18 }}>
      <div style={{ color: "#888F94", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: styles.color, fontSize: 24, fontWeight: 800, marginTop: 8 }}>L. {value.toLocaleString("es-HN")}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  const isSuccess = ["atendida", "pagado", "completada", "completed"].includes(normalizedStatus);
  const isPending = ["pendiente", "programada", "pending", "scheduled"].includes(normalizedStatus);
  const bg = isSuccess ? "rgba(29, 158, 117, 0.12)" : isPending ? "rgba(239, 159, 39, 0.12)" : "#E6F8FB";
  const color = isSuccess ? "#1D9E75" : isPending ? "#EF9F27" : "#0BC5DF";

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

function formatAppointmentStatus(status: string) {
  const labels: Record<string, string> = {
    programada: "Programada",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
    no_asistio: "No asistió",
    atendida: "Atendida",
    ausente: "Ausente",
    reprogramada: "Reprogramada",
  };

  return labels[status.toLowerCase()] ?? status;
}

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
