import { useEffect, useMemo, useState } from "react";
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

const appointmentRows = [
  { day: "27", month: "MAY", title: "Procedimiento", subtitle: "Dra. Karla Arita - 10:00 AM", status: "Atendida" },
  { day: "14", month: "APR", title: "Procedimiento", subtitle: "Dra. Karla Arita - 09:30 AM", status: "Atendida" },
  { day: "19", month: "MAR", title: "Consulta inicial", subtitle: "Dra. Karla Arita - 11:00 AM", status: "Atendida" },
  { day: "15", month: "JUN", title: "Revisión", subtitle: "Dra. Karla Arita - 10:00 AM", status: "Programada" },
];

const financialRows = [
  { date: "27 de may de 26", concept: "Relleno composite premolar", amount: 1800, status: "Pagado" },
  { date: "14 de abr de 26", concept: "Extracción molar #38", amount: 2400, status: "Pagado" },
  { date: "19 de mar de 26", concept: "Consulta inicial y radiografía", amount: 800, status: "Pagado" },
  { date: "09 de jun de 26", concept: "Limpieza dental programada", amount: 1200, status: "Pendiente" },
  { date: "09 de jun de 26", concept: "Blanqueamiento (plan)", amount: 2200, status: "Pendiente" },
];

export function PatientProfileScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patientId = Number(id);
  const [patient, setPatient] = useState<PersonaDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("appointments");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;
    void loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get<PersonaDetail>(`/persona/${patientId}`);
      setPatient(response.data);
    } catch (requestError) {
      const apiError = requestError as { message?: string };
      setError(apiError.message ?? "No se pudo cargar el perfil del paciente.");
    } finally {
      setIsLoading(false);
    }
  };

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
                Última visita: 27 de mayo de 2026
              </p>
              <div style={{ marginTop: 16 }}>
                <div style={{ alignItems: "center", color: "#B7791F", display: "flex", fontSize: 12, fontWeight: 700, gap: 6, marginBottom: 8 }}>
                  <AlertTriangle size={14} />
                  ALERTAS MÉDICAS ACTIVAS
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Diabetes", "Hipertensión", "Alergia: Penicilina", "Alergia: Ibuprofeno", "Reacción a anestesia"].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: tag.includes("Alergia") ? "#FEF2F2" : "#FFFBEB",
                        borderRadius: 999,
                        color: tag.includes("Alergia") ? "#B91C1C" : "#B7791F",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "5px 10px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
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
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 8,
              color: "#92400E",
              gridColumn: "1 / -1",
              padding: "12px 16px",
            }}
          >
            <div style={{ alignItems: "center", display: "flex", gap: 8, fontSize: 13, fontWeight: 700 }}>
              <AlertTriangle size={15} />
              Este paciente tiene alertas médicas activas. Revisa alergias y enfermedades antes de iniciar cualquier tratamiento.
            </div>
            <p style={{ fontSize: 12, margin: "6px 0 0 24px" }}>
              Reacción moderada a lidocaína con epinefrina en procedimiento de 2023. Utilizar anestesia sin vasoconstrictor.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ borderBottom: "1px solid #D3D7DA", display: "flex", gap: 28, marginBottom: 20 }}>
          <ProfileTab active={activeTab === "appointments"} icon={<Calendar size={16} />} label="Citas" onClick={() => setActiveTab("appointments")} />
          <ProfileTab active={activeTab === "financial"} icon={<DollarSign size={16} />} label="Financiero" onClick={() => setActiveTab("financial")} />
        </div>

        {activeTab === "appointments" ? <AppointmentsTab /> : <FinancialTab />}
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

function AppointmentsTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {appointmentRows.map((appointment) => (
        <div
          key={`${appointment.day}-${appointment.title}`}
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
            <strong style={{ color: "#203F49", fontSize: 14 }}>{appointment.day}</strong>
            <span style={{ color: "#888F94", fontSize: 10, fontWeight: 700 }}>{appointment.month}</span>
          </div>
          <div>
            <div style={{ color: "#203F49", fontSize: 14, fontWeight: 700 }}>{appointment.title}</div>
            <div style={{ color: "#888F94", fontSize: 12 }}>{appointment.subtitle}</div>
          </div>
          <StatusPill status={appointment.status} />
        </div>
      ))}
    </div>
  );
}

function FinancialTab() {
  const totalPaid = financialRows.filter((row) => row.status === "Pagado").reduce((sum, row) => sum + row.amount, 0);
  const totalPending = financialRows.filter((row) => row.status === "Pendiente").reduce((sum, row) => sum + row.amount, 0);
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
        {financialRows.map((row, index) => (
          <div
            key={`${row.date}-${row.concept}`}
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
  const isSuccess = status === "Atendida" || status === "Pagado";
  const isPending = status === "Pendiente";
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

export default PatientProfileScreen;
