import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Edit,
  FileText,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Alert, Button, Card } from "../../../context";
import api from "../../../services/api";
import { calculateAge } from "../../../utils/formatters";
import { AppointmentsTab, FinancialTab } from "./PatientProfileTabs";
import type { AppointmentHistoryItem, FinancialRow } from "./PatientProfileTabs";

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

type AppointmentHistoryResponse = {
  data: AppointmentHistoryItem[];
};

type ConsultaListItem = {
  id_consulta: number;
  fecha_inicio: string;
  motivo?: string | null;
  diagnostico?: string | null;
  tratamiento?: string | null;
  pagos?: PagoPaciente[];
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

  useEffect(() => {
    if (!patientId) return;

    let ignore = false;

    Promise.all([
      api.get<PersonaDetail>(`/persona/${patientId}`),
      api.get<AppointmentHistoryResponse>(`/appointments/patient/${patientId}/history`, {
        params: { page: 1, limit: 10 },
      }),
      api.get<ConsultaListResponse>("/consulta", {
        params: { page: 1, limit: 10, id_persona: patientId },
      }),
    ])
      .then(([patientResponse, appointmentsResponse, consultasResponse]) => {
        if (ignore) return;

        const consultas = consultasResponse.data?.data ?? [];
        const pagos: FinancialRow[] = consultas.flatMap((consulta) =>
          (consulta.pagos ?? []).map((pago) => ({
            id: `${consulta.id_consulta}-${pago.id_pago}`,
            date: pago.fecha,
            concept: pago.observacion || consulta.motivo || consulta.tratamiento || "Pago de consulta",
            amount: Number(pago.abono),
            status: "Pagado",
          })),
        );

        setPatient(patientResponse.data);
        setAppointments(appointmentsResponse.data?.data ?? []);
        setFinancialRows(pagos);
      })
      .catch((requestError: { message?: string }) => {
        if (!ignore) setError(requestError.message ?? "No se pudo cargar el perfil del paciente.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [patientId]);

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
        <div style={{ height: 6, background: "linear-gradient(90deg, var(--arco-primary) 0%, var(--arco-navy) 100%)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 24, padding: 24 }}>
          <div style={{ display: "flex", gap: 20 }}>
            <div
              style={{
                alignItems: "center",
                background: "var(--arco-primary)",
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
                    background: "var(--arco-primary-light)",
                    borderRadius: 999,
                    color: "var(--arco-primary)",
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
                <div style={{ alignItems: "center", color: "var(--arco-warning)", display: "flex", fontSize: 12, fontWeight: 700, gap: 6, marginBottom: 8 }}>
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
              background: "var(--arco-gray-50)",
              border: "1px solid var(--arco-gray-300)",
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

function formatDisplayDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

