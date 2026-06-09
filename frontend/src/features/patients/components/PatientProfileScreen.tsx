import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  DollarSign,
  Edit,
  FileText,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Alert, Button, Card } from "../../../context";
import api from "../../../services/api";

type PersonaDetail = {
  id_persona: number;
  numero_identidad: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  fecha_nacimiento: string;
  telefono: string;
  correo_electronico?: string | null;
  sexo: "M" | "F";
  municipio?: {
    nombre: string;
    departamento?: {
      nombre: string;
    };
  };
};

type TabKey = "appointments" | "financial";

type AppointmentHistoryItem = {
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

type AppointmentHistoryResponse = {
  data: AppointmentHistoryItem[];
};

type ConsultaListItem = {
  id_consulta: number;
  fecha_inicio: string;
  motivo?: string | null;
  diagnostico?: string | null;
  tratamiento?: string | null;
};

type ConsultaListResponse = {
  data: ConsultaListItem[];
};

type PagoPaciente = {
  id_pago: number;
  fecha: string;
  abono: string | number;
  observacion?: string | null;
};

type ConsultaDetail = ConsultaListItem & {
  pagos?: PagoPaciente[];
};

type FinancialRow = {
  id: string;
  date: string;
  concept: string;
  amount: number;
  status: "Pagado";
};

export function PatientProfileScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const parsedPatientId = id ? Number(id) : null;
  const patientId = parsedPatientId && Number.isFinite(parsedPatientId) ? parsedPatientId : null;
  const [patient, setPatient] = useState<PersonaDetail | null>(null);
  const [appointments, setAppointments] = useState<AppointmentHistoryItem[]>([]);
  const [financialRows, setFinancialRows] = useState<FinancialRow[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("appointments");
  const [isLoading, setIsLoading] = useState(Boolean(patientId));
  const [error, setError] = useState("");

  const loadPatient = useCallback(async (currentPatientId: number) => {
    try {
      setIsLoading(true);
      setError("");
      const [patientResponse, appointmentsResponse, consultasResponse] = await Promise.all([
        api.get<PersonaDetail>(`/persona/${currentPatientId}`),
        api.get<AppointmentHistoryResponse>(`/appointments/patient/${currentPatientId}/history`, {
          params: { page: 1, limit: 10 },
        }),
        api.get<ConsultaListResponse>("/consulta", {
          params: { page: 1, limit: 10, id_persona: currentPatientId },
        }),
      ]);

      setPatient(patientResponse.data);
      setAppointments(appointmentsResponse.data?.data ?? []);

      const consultas = consultasResponse.data?.data ?? [];
      const consultaDetails = await Promise.all(
        consultas.map((consulta) => api.get<ConsultaDetail>(`/consulta/${consulta.id_consulta}`)),
      );
      const pagos: FinancialRow[] = consultaDetails.flatMap((response) => {
        const consulta = response.data;
        return (consulta.pagos ?? []).map((pago) => ({
          id: `${consulta.id_consulta}-${pago.id_pago}`,
          date: pago.fecha,
          concept: pago.observacion || consulta.motivo || consulta.tratamiento || "Pago de consulta",
          amount: Number(pago.abono),
          status: "Pagado",
        }));
      });

      setFinancialRows(pagos);
    } catch (requestError) {
      const apiError = requestError as { message?: string };
      setError(apiError.message ?? "No se pudo cargar el perfil del paciente.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patientId) {
      queueMicrotask(() => {
        loadPatient(patientId).catch(() => undefined);
      });
    }
  }, [loadPatient, patientId]);

  const fullName = useMemo(() => {
    if (!patient) return "";
    return [
      patient.primer_nombre,
      patient.segundo_nombre,
      patient.primer_apellido,
      patient.segundo_apellido,
    ]
      .filter(Boolean)
      .join(" ");
  }, [patient]);

  const initials = useMemo(() => {
    if (!patient) return "P";
    return `${patient.primer_nombre?.[0] ?? ""}${patient.primer_apellido?.[0] ?? ""}`.toUpperCase();
  }, [patient]);

  const age = patient?.fecha_nacimiento ? calculateAge(patient.fecha_nacimiento) : null;
  const code = patient ? `PAC-${String(patient.id_persona).padStart(6, "0")}` : "";
  const location = patient?.municipio
    ? `${patient.municipio.nombre}, ${patient.municipio.departamento?.nombre ?? ""}`.replace(/,\s*$/, "")
    : "Sin ubicación";
  const lastVisit = appointments[0]?.fecha_inicio ? formatDisplayDate(appointments[0].fecha_inicio) : "Sin visitas registradas";

  if (!patientId) {
    return <Alert variant="error" message="ID de paciente inválido." />;
  }

  if (isLoading) {
    return <Alert variant="info" message="Cargando perfil del paciente..." />;
  }

  if (error || !patient) {
    return <Alert variant="error" message={error || "Paciente no encontrado."} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1180 }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ height: 6, background: "linear-gradient(90deg, #0BC5DF 0%, #203F49 100%)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 24, padding: 24 }}>
          <div style={{ display: "flex", gap: 20 }}>
            <div
              style={{
                alignItems: "center",
                background: "#0BC5DF",
                borderRadius: "50%",
                color: "#FFFFFF",
                display: "flex",
                flexShrink: 0,
                fontSize: 22,
                fontWeight: 700,
                height: 64,
                justifyContent: "center",
                width: 64,
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ alignItems: "center", display: "flex", gap: 10, marginBottom: 8 }}>
                <h2 style={{ color: "#203F49", fontSize: 24, fontWeight: 700, margin: 0 }}>{fullName}</h2>
                <span
                  style={{
                    background: "#E6F8FB",
                    borderRadius: 999,
                    color: "#0BC5DF",
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 10px",
                  }}
                >
                  # {code}
                </span>
              </div>
              <div style={{ color: "#5F656A", display: "flex", flexWrap: "wrap", fontSize: 13, gap: 14 }}>
                <span>{age ?? "-"} años</span>
                <span>{patient.sexo === "F" ? "Femenino" : "Masculino"}</span>
                <span>{patient.telefono}</span>
                <span>{patient.correo_electronico || "Sin correo"}</span>
                <span>{location}</span>
              </div>
              <p style={{ color: "#5F656A", fontSize: 13, margin: "14px 0 0" }}>
                Última visita: {lastVisit}
              </p>
              <div style={{ marginTop: 16 }}>
                <div style={{ alignItems: "center", color: "#B7791F", display: "flex", fontSize: 12, fontWeight: 700, gap: 6, marginBottom: 8 }}>
                  <AlertTriangle size={14} />
                  ALERTAS MÉDICAS
                </div>
                <span style={{ color: "#888F94", fontSize: 12 }}>
                  Sin alertas médicas registradas para este paciente.
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button variant="primary" onClick={() => navigate(`/patients/edit/${patient.id_persona}`)}>
              <Edit size={15} />
              Editar paciente
            </Button>
            <Button variant="secondary" onClick={() => navigate("/patients/records")}>
              <FileText size={15} />
              Ver expediente
            </Button>
            <Button variant="secondary" onClick={() => navigate("/patients/odontogram")}>
              <Stethoscope size={15} />
              Odontograma
            </Button>
            <Button variant="secondary" onClick={() => navigate("/patients/consent")}>
              <ShieldCheck size={15} />
              Consentimientos
            </Button>
          </div>

          <div
            style={{
              background: "#F8F9FA",
              border: "1px solid #D3D7DA",
              borderRadius: 8,
              color: "#5F656A",
              gridColumn: "1 / -1",
              padding: "12px 16px",
            }}
          >
            <div style={{ alignItems: "center", display: "flex", gap: 8, fontSize: 13, fontWeight: 700 }}>
              <AlertTriangle size={15} />
              Sin alertas médicas activas registradas.
            </div>
            <p style={{ fontSize: 12, margin: "6px 0 0 24px" }}>
              Los antecedentes médicos se registran por consulta. Cuando existan respuestas asociadas, aparecerán en el expediente clínico.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ borderBottom: "1px solid #D3D7DA", display: "flex", gap: 28, marginBottom: 20 }}>
          <ProfileTab active={activeTab === "appointments"} icon={<Calendar size={16} />} label="Citas" onClick={() => setActiveTab("appointments")} />
          <ProfileTab active={activeTab === "financial"} icon={<DollarSign size={16} />} label="Financiero" onClick={() => setActiveTab("financial")} />
        </div>

        {activeTab === "appointments" ? <AppointmentsTab appointments={appointments} /> : <FinancialTab rows={financialRows} />}
      </Card>
    </div>
  );
}

function ProfileTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        alignItems: "center",
        background: "transparent",
        border: "none",
        borderBottom: `2px solid ${active ? "#0BC5DF" : "transparent"}`,
        color: active ? "#0BC5DF" : "#5F656A",
        cursor: "pointer",
        display: "flex",
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        gap: 8,
        padding: "0 0 12px",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function AppointmentsTab({ appointments }: { appointments: AppointmentHistoryItem[] }) {
  if (appointments.length === 0) {
    return <EmptyState message="Este paciente no tiene citas registradas." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {appointments.map((appointment) => {
        const date = new Date(appointment.fecha_inicio);
        const doctorName = formatDoctorName(appointment);
        return (
          <div
            key={appointment.id_cita}
            style={{
              alignItems: "center",
              border: "1px solid #D3D7DA",
              borderRadius: 8,
              display: "grid",
              gridTemplateColumns: "52px 1fr auto",
              padding: "12px 16px",
            }}
          >
            <div style={{ alignItems: "center", background: "#F8F9FA", borderRadius: 8, display: "flex", flexDirection: "column", height: 44, justifyContent: "center", width: 44 }}>
              <strong style={{ color: "#203F49", fontSize: 14 }}>{date.getDate().toString().padStart(2, "0")}</strong>
              <span style={{ color: "#888F94", fontSize: 10, fontWeight: 700 }}>{date.toLocaleDateString("es-HN", { month: "short" }).toUpperCase()}</span>
            </div>
            <div>
              <div style={{ color: "#203F49", fontSize: 14, fontWeight: 700 }}>{appointment.tipo_cita || appointment.motivo || "Cita dental"}</div>
              <div style={{ color: "#888F94", fontSize: 12 }}>
                {doctorName} - {date.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <StatusPill status={appointment.estado} />
          </div>
        );
      })}
    </div>
  );
}

function FinancialTab({ rows }: { rows: FinancialRow[] }) {
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

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 18 }}>
        <FinanceSummary label="Total facturado" tone="neutral" value={totalBilled} />
        <FinanceSummary label="Total pagado" tone="success" value={totalPaid} />
        <FinanceSummary label="Saldo pendiente" tone="danger" value={totalPending} />
      </div>

      <div style={{ border: "1px solid #D3D7DA", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ background: "#F8F9FA", display: "grid", gridTemplateColumns: "150px 1fr 130px 110px", padding: "10px 14px" }}>
          {["Fecha", "Concepto", "Monto", "Estado"].map((heading) => (
            <span key={heading} style={{ color: "#888F94", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{heading}</span>
          ))}
        </div>
        {rows.length === 0 ? (
          <EmptyState message="No hay pagos registrados para este paciente." />
        ) : rows.map((row, index) => (
          <div
            key={row.id}
            style={{
              background: index % 2 === 0 ? "#FFFFFF" : "#F8F9FA",
              display: "grid",
              gridTemplateColumns: "150px 1fr 130px 110px",
              padding: "12px 14px",
            }}
          >
            <span style={{ color: "#5F656A", fontSize: 13 }}>{row.date}</span>
            <span style={{ color: "#203F49", fontSize: 13 }}>{row.concept}</span>
            <span style={{ color: "#203F49", fontSize: 13 }}>L. {row.amount.toLocaleString("es-HN")}</span>
            <StatusPill status={row.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ color: "#888F94", fontSize: 13, padding: "28px 16px", textAlign: "center" }}>
      {message}
    </div>
  );
}

function FinanceSummary({ label, tone, value }: { label: string; tone: "neutral" | "success" | "danger"; value: number }) {
  const styles = {
    neutral: { bg: "#F8F9FA", border: "#D3D7DA", color: "#203F49" },
    success: { bg: "#ECFDF5", border: "#1D9E75", color: "#1D9E75" },
    danger: { bg: "#FEF2F2", border: "#E24B4A", color: "#E24B4A" },
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
  const bg = isSuccess ? "#ECFDF5" : isPending ? "#FFFBEB" : "#E6F8FB";
  const color = isSuccess ? "#1D9E75" : isPending ? "#B7791F" : "#0BC5DF";

  return (
    <span style={{ background: bg, borderRadius: 999, color, fontSize: 12, fontWeight: 700, padding: "5px 10px", textAlign: "center" }}>
      {status}
    </span>
  );
}

function calculateAge(dateValue: string) {
  const birth = new Date(dateValue);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

function formatDisplayDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDoctorName(appointment: AppointmentHistoryItem) {
  const persona = appointment.doctor?.persona;
  const fullName = [persona?.primer_nombre, persona?.primer_apellido].filter(Boolean).join(" ");
  return fullName || appointment.doctor?.username || "Doctor no asignado";
}

export default PatientProfileScreen;
