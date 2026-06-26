import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  DollarSign,
  Edit,
  FileText,
  Hash,
  Info,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Spinner } from "../../../components";
import { Alert, Button } from "../../../context";
import api from "../../../services/api";
import { calculateAge } from "../../../utils/formatters";
import { MedicalAlertBadge } from "./MedicalAlertBadge";
import { AppointmentsTab, FinancialTab } from "./PatientProfileTabs";
import type {
  AppointmentHistoryItem,
  FinancialRow,
} from "./PatientProfileTabs";
import {
  buildMedicalAlertBadges,
  buildMedicalWarningDetails,
} from "../utils/patientMedicalAlerts";
import { useResponsive } from "../../../hooks/useWindowWidth";

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
  enfermedades?: string | null;
  otras_enfermedades?: string | null;
  medicamentos?: string | null;
  alergias?: string | null;
  reaccion_anestesia?: string | null;
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
  const { isMobile } = useResponsive();
  const parsedPatientId = id ? Number(id) : null;
  const patientId =
    parsedPatientId && Number.isFinite(parsedPatientId)
      ? parsedPatientId
      : null;
  const [patient, setPatient] = useState<PersonaDetail | null>(null);
  const [appointments, setAppointments] = useState<AppointmentHistoryItem[]>(
    []
  );
  const [financialRows, setFinancialRows] = useState<FinancialRow[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("appointments");
  const [isLoading, setIsLoading] = useState(Boolean(patientId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let ignore = false;

    Promise.all([
      api.get<PersonaDetail>(`/persona/${patientId}`),
      api.get<AppointmentHistoryResponse>(
        `/appointments/patient/${patientId}/history`,
        {
          params: { page: 1, limit: 10 },
        }
      ),
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
            concept:
              pago.observacion ||
              consulta.motivo ||
              consulta.tratamiento ||
              "Pago de consulta",
            amount: Number(pago.abono),
            status: "Pagado",
          }))
        );

        setPatient(patientResponse.data);
        setAppointments(appointmentsResponse.data?.data ?? []);
        setFinancialRows(pagos);
      })
      .catch((err: unknown) => {
        if (import.meta.env.DEV) console.error("[PatientProfileScreen]", err);
        if (!ignore)
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el perfil del paciente."
          );
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
    return `${patient.primer_nombre?.[0] ?? ""}${
      patient.primer_apellido?.[0] ?? ""
    }`.toUpperCase();
  }, [patient]);

  const medicalBadges = useMemo(
    () => (patient ? buildMedicalAlertBadges(patient) : []),
    [patient]
  );
  const medicalWarningDetails = useMemo(
    () => (patient ? buildMedicalWarningDetails(patient) : []),
    [patient]
  );
  const showMedicalAlerts = medicalBadges.length > 0;

  const age = patient?.fecha_nacimiento
    ? calculateAge(patient.fecha_nacimiento)
    : null;
  const code = patient
    ? `PAC-${String(patient.id_persona).padStart(6, "0")}`
    : "";
  const patientQuery = patient
    ? new URLSearchParams({
        patientId: String(patient.id_persona),
        patientName: fullName,
        patientCode: code,
      }).toString()
    : "";
  const location = patient?.municipio
    ? `${patient.municipio.nombre}, ${
        patient.municipio.departamento?.nombre ?? ""
      }`.replace(/,\s*$/, "")
    : "Sin ubicación";
  const lastVisit = appointments[0]?.fecha_inicio
    ? formatDisplayDate(appointments[0].fecha_inicio)
    : "Sin consultas registradas";

  if (!patientId) {
    return <Alert variant="error" message="ID de paciente inválido." />;
  }

  if (isLoading) {
    return (
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "center",
          minHeight: 240,
        }}
      >
        <Spinner size={32} color="#0BC5DF" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <Alert variant="error" message={error || "Paciente no encontrado."} />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 20,
        width: "100%",
      }}
    >
      <button
        onClick={() => navigate("/patients/list", { replace: true })}
        type="button"
        style={{
          alignItems: "center",
          background: "transparent",
          border: "none",
          color: "#5F656A",
          cursor: "pointer",
          display: "flex",
          fontSize: 13,
          fontWeight: 500,
          gap: 5,
          lineHeight: "19.5px",
          padding: 0,
          width: "fit-content",
        }}
      >
        <ArrowLeft size={16} />
        Regresar
      </button>
      {/* Tarjeta de perfil */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #D3D7DA",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg, #0BC5DF 0%, #203F49 100%)",
            height: 4,
          }}
        />

        <div
          style={{
            alignItems: isMobile ? "stretch" : "flex-start",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 16 : 20,
            padding: isMobile ? 16 : 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 16,
              width: "100%",
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "linear-gradient(135deg, #0BC5DF 0%, #0899B0 100%)",
                border: "2px solid #E6F8FB",
                borderRadius: 36,
                color: "#FFFFFF",
                display: "flex",
                flexShrink: 0,
                fontSize: isMobile ? 22 : 26,
                fontWeight: 700,
                height: isMobile ? 60 : 72,
                justifyContent: "center",
                lineHeight: "39px",
                width: isMobile ? 60 : 72,
              }}
            >
              {initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <h2
                  style={{
                    color: "#203F49",
                    fontSize: isMobile ? 18 : 22,
                    fontWeight: 700,
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  {fullName}
                </h2>
                <span
                  style={{
                    alignItems: "center",
                    background: "#E6F8FB",
                    border: "1px solid #B3E8F0",
                    borderRadius: 20,
                    color: "#0BC5DF",
                    display: "inline-flex",
                    fontSize: 12,
                    fontWeight: 600,
                    gap: 5,
                    lineHeight: "18px",
                    padding: "4px 12px",
                  }}
                >
                  <Hash size={11} />
                  {code}
                </span>
              </div>

              <div
                style={{
                  color: "#5F656A",
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  flexWrap: "wrap",
                  fontSize: 13,
                  gap: isMobile ? 4 : 20,
                  lineHeight: "19.5px",
                }}
              >
                <span>
                  {age ?? "-"} años ·{" "}
                  {patient.sexo === "F" ? "Femenino" : "Masculino"}
                </span>
                <span>{patient.telefono}</span>
                <span>{patient.correo_electronico || "Sin correo"}</span>
                <span>{location}</span>
              </div>

              <p
                style={{
                  color: "#5F656A",
                  fontSize: 13,
                  lineHeight: "19.5px",
                  margin: "8px 0 0",
                }}
              >
                Última consulta: {lastVisit}
              </p>

              <div style={{ marginTop: 14 }}>
                {showMedicalAlerts ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {medicalBadges.map((badge) => (
                      <MedicalAlertBadge key={badge.id} badge={badge} />
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "#888F94", fontSize: 12 }}>
                    Sin alertas médicas registradas para este paciente.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "row" : "column",
              flexWrap: isMobile ? "wrap" : "nowrap",
              flexShrink: 0,
              gap: 8,
              width: isMobile ? "100%" : undefined,
            }}
          >
            <Button
              fullWidth
              onClick={() => navigate(`/patients/edit/${patient.id_persona}`)}
              style={{
                padding: "10px 19px",
                whiteSpace: "nowrap",
                flex: isMobile ? "1 1 calc(50% - 4px)" : undefined,
              }}
              variant="primary"
            >
              <Edit size={14} />
              Editar paciente
            </Button>
            <Button
              fullWidth
              onClick={() =>
                navigate(
                  `/patients/records${patientQuery ? `?${patientQuery}` : ""}`
                )
              }
              style={{
                padding: "10px 19px",
                whiteSpace: "nowrap",
                flex: isMobile ? "1 1 calc(50% - 4px)" : undefined,
              }}
              variant="secondary"
            >
              <FileText size={14} />
              Ver expediente
            </Button>
            <Button
              fullWidth
              onClick={() =>
                navigate(
                  `/patients/odontogram${
                    patientQuery ? `?${patientQuery}` : ""
                  }`
                )
              }
              style={{
                padding: "10px 19px",
                whiteSpace: "nowrap",
                flex: isMobile ? "1 1 calc(50% - 4px)" : undefined,
              }}
              variant="secondary"
            >
              <Stethoscope size={14} />
              Odontograma
            </Button>
            <Button
              fullWidth
              onClick={() =>
                navigate(
                  `/patients/consent${patientQuery ? `?${patientQuery}` : ""}`
                )
              }
              style={{
                padding: "10px 19px",
                whiteSpace: "nowrap",
                flex: isMobile ? "1 1 calc(50% - 4px)" : undefined,
              }}
              variant="secondary"
            >
              <ShieldCheck size={14} />
              Consentimientos
            </Button>
          </div>
        </div>

        {showMedicalAlerts ? (
          <div
            style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: "0 0 12px 12px",
              display: "flex",
              gap: 10,
              padding: isMobile ? "12px" : "12px 16px",
            }}
          >
            <Info
              color="#B45309"
              size={15}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p
                style={{
                  color: "#B45309",
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: "19.5px",
                  margin: 0,
                }}
              >
                Este paciente tiene alertas médicas activas.
                <span style={{ color: "#B45309", fontWeight: 400 }}>
                  {" "}
                  Revisa alergias y enfermedades antes de iniciar cualquier
                  tratamiento.
                </span>
              </p>
              {medicalWarningDetails.map((detail, index) => (
                <p
                  key={`warning-${index}`}
                  style={{
                    color: "#92400E",
                    display: "flex",
                    fontSize: 12,
                    gap: 4,
                    lineHeight: "18px",
                    margin: 0,
                    paddingLeft: 15,
                  }}
                >
                  {detail}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Tarjeta de citas / financiero */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #D3D7DA",
          borderRadius: 12,
          padding: isMobile ? "16px 12px" : 21,
        }}
      >
        <div
          style={{
            borderBottom: "1px solid #E8EBED",
            display: "flex",
            height: 44,
            marginBottom: 0,
            padding: isMobile ? "0 4px" : "0 8px",
          }}
        >
          <ProfileTab
            active={activeTab === "appointments"}
            icon={<Calendar size={15} />}
            label="Citas"
            onClick={() => setActiveTab("appointments")}
          />
          <ProfileTab
            active={activeTab === "financial"}
            icon={<DollarSign size={15} />}
            label="Financiero"
            onClick={() => setActiveTab("financial")}
          />
        </div>

        <div style={{ padding: isMobile ? "16px 4px" : 24 }}>
          {activeTab === "appointments" ? (
            <AppointmentsTab appointments={appointments} />
          ) : (
            <FinancialTab rows={financialRows} />
          )}
        </div>
      </div>
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
        borderBottom: `1px solid ${active ? "#0BC5DF" : "transparent"}`,
        color: active ? "#0BC5DF" : "#5F656A",
        cursor: "pointer",
        display: "flex",
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        gap: 8,
        lineHeight: "21px",
        padding: "10px 20px 13px",
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
    month: "short",
    year: "numeric",
  });
}
