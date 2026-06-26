import { DataTable } from "../../../components";
import type { Column } from "../../../components";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { useResponsive } from "../../../hooks/useWindowWidth";

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

function formatDoctorName(appointment: AppointmentHistoryItem) {
  const persona = appointment.doctor?.persona;
  const fullName = [persona?.primer_nombre, persona?.primer_apellido]
    .filter(Boolean)
    .join(" ");
  return fullName || appointment.doctor?.username || "Doctor no asignado";
}

function StatusPill({ status }: { status: string }) {
  const n = status.toLowerCase();
  const isSuccess = ["atendida", "pagado", "completada", "completed"].includes(
    n
  );
  const isPending = [
    "pendiente",
    "programada",
    "pending",
    "scheduled",
  ].includes(n);
  const bg = isSuccess
    ? "var(--arco-success-soft)"
    : isPending
    ? "var(--arco-warning-soft)"
    : "var(--arco-primary-light)";
  const color = isSuccess
    ? "var(--arco-success)"
    : isPending
    ? "var(--arco-warning)"
    : "var(--arco-primary)";
  return (
    <span
      style={{
        background: bg,
        borderRadius: 999,
        color,
        fontSize: 12,
        fontWeight: 700,
        padding: "5px 10px",
      }}
    >
      {status}
    </span>
  );
}

function AppointmentCard({ row }: { row: AppointmentRow }) {
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--arco-navy)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.titulo}
          </p>
          <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
            {formatDate(row.fecha)}
          </p>
        </div>
        <StatusPill status={row.estado} />
      </div>
      <div style={{ borderTop: "1px solid #F8F9FA", paddingTop: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Doctor</span>
          <span style={{ fontSize: 13, color: "#203F49" }}>{row.doctor}</span>
        </div>
      </div>
    </div>
  );
}

export function AppointmentsTab({
  appointments,
}: {
  appointments: AppointmentHistoryItem[];
}) {
  const { isMobile, isTablet } = useResponsive();
  const showCards = isMobile || isTablet;

  const rows: AppointmentRow[] = appointments.map((a) => ({
    id: a.id_cita,
    fecha: a.fecha_inicio,
    titulo: a.tipo_cita || a.motivo || "Cita dental",
    doctor: formatDoctorName(a),
    estado: a.estado,
  }));

  const columns: Column<AppointmentRow>[] = [
    {
      key: "fecha",
      label: "Fecha",
      render: (_v, row) => formatDate(row.fecha),
    },
    { key: "titulo", label: "Cita" },
    { key: "doctor", label: "Doctor" },
    {
      key: "estado",
      label: "Estado",
      render: (_v, row) => <StatusPill status={row.estado} />,
    },
  ];

  if (showCards) {
    if (rows.length === 0) {
      return (
        <p
          style={{
            textAlign: "center",
            color: "#888F94",
            fontSize: 14,
            padding: 24,
            margin: 0,
          }}
        >
          Este paciente no tiene citas registradas.
        </p>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((row) => (
          <AppointmentCard key={row.id} row={row} />
        ))}
      </div>
    );
  }

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

function FinancialCard({ row }: { row: FinancialRow }) {
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--arco-navy)",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.concept}
          </p>
          <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
            {formatDate(row.date)}
          </p>
        </div>
        <StatusPill status={row.status} />
      </div>
      <div style={{ borderTop: "1px solid #F8F9FA", paddingTop: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Monto</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#203F49" }}>
            {formatCurrency(row.amount)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function FinancialTab({ rows }: { rows: FinancialRow[] }) {
  const { isMobile, isTablet } = useResponsive();
  const showCards = isMobile || isTablet;

  const totalPaid = rows.reduce(
    (s, r) => s + (r.status === "Pagado" ? r.amount : 0),
    0
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            color: "var(--arco-navy)",
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
          }}
        >
          Resumen financiero
        </h3>
        <p
          style={{
            color: "var(--arco-gray-500)",
            fontSize: 12,
            margin: "4px 0 0",
          }}
        >
          Historial de pagos registrados
        </p>
      </div>

      {/* KPI: total pagado */}
      <div style={{ marginBottom: 18 }}>
        <FinanceSummary label="Total pagado" tone="success" value={totalPaid} />
      </div>

      {showCards ? (
        rows.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#888F94",
              fontSize: 14,
              padding: 24,
              margin: 0,
            }}
          >
            No hay pagos registrados para este paciente.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rows.map((row) => (
              <FinancialCard key={row.id} row={row} />
            ))}
          </div>
        )
      ) : (
        <DataTable<FinancialRow>
          columns={[
            {
              key: "date",
              label: "Fecha",
              render: (_v, row) => formatDate(row.date),
            },
            { key: "concept", label: "Concepto" },
            {
              key: "amount",
              label: "Monto",
              render: (_v, row) => formatCurrency(row.amount),
            },
            {
              key: "status",
              label: "Estado",
              render: (_v, row) => <StatusPill status={row.status} />,
            },
          ]}
          data={rows}
          emptyMessage="No hay pagos registrados para este paciente."
          getRowKey={(row) => row.id}
          hidePagination
          searchable={false}
        />
      )}
    </div>
  );
}

function FinanceSummary({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "neutral" | "success" | "danger";
  value: number;
}) {
  const styles = {
    neutral: {
      bg: "var(--arco-gray-50)",
      border: "var(--arco-gray-300)",
      color: "var(--arco-navy)",
    },
    success: {
      bg: "var(--arco-success-soft)",
      border: "var(--arco-success)",
      color: "var(--arco-success)",
    },
    danger: {
      bg: "var(--arco-danger-soft)",
      border: "var(--arco-danger)",
      color: "var(--arco-danger)",
    },
  }[tone];
  return (
    <div
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: 8,
        padding: 18,
      }}
    >
      <div
        style={{
          color: "var(--arco-gray-500)",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: styles.color,
          fontSize: 24,
          fontWeight: 800,
          marginTop: 8,
        }}
      >
        L. {value.toLocaleString("es-HN")}
      </div>
    </div>
  );
}
