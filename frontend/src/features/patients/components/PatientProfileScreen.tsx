import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
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
import { useResponsive } from "../../../hooks/useWindowWidth";
import { AppointmentsTab, FinancialTab } from "./PatientProfileTabs";
import type {
  AppointmentHistoryItem,
  FinancialRow,
} from "./PatientProfileTabs";

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
  municipio?: { nombre: string; departamento?: { nombre: string } };
};

type TabKey = "appointments" | "financial";

type AppointmentHistoryResponse = { data: AppointmentHistoryItem[] };
type ConsultaListItem = {
  id_consulta: number;
  fecha_inicio: string;
  motivo?: string | null;
  diagnostico?: string | null;
  tratamiento?: string | null;
  pagos?: PagoPaciente[];
};
type ConsultaListResponse = { data: ConsultaListItem[] };
type PagoPaciente = {
  id_pago: number;
  fecha: string;
  abono: string | number;
  observacion?: string | null;
};

function formatDisplayDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function PatientProfileScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const mountedRef = useRef(true);

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
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!patientId) return;
    let ignore = false;

    Promise.all([
      api.get<PersonaDetail>(`/persona/${patientId}`),
      api.get<AppointmentHistoryResponse>(
        `/appointments/patient/${patientId}/history`,
        { params: { page: 1, limit: 10 } }
      ),
      api.get<ConsultaListResponse>("/consulta", {
        params: { page: 1, limit: 10, id_persona: patientId },
      }),
    ])
      .then(([patientRes, apptRes, consultasRes]) => {
        if (ignore) return;
        const consultas = consultasRes.data?.data ?? [];
        const pagos: FinancialRow[] = consultas.flatMap((c) =>
          (c.pagos ?? []).map((p) => ({
            id: `${c.id_consulta}-${p.id_pago}`,
            date: p.fecha,
            concept:
              p.observacion || c.motivo || c.tratamiento || "Pago de consulta",
            amount: Number(p.abono),
            status: "Pagado" as const,
          }))
        );
        setPatient(patientRes.data);
        setAppointments(apptRes.data?.data ?? []);
        setFinancialRows(pagos);
      })
      .catch((err: unknown) => {
        if (ignore) return;
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

  const fullName = useMemo(
    () =>
      !patient
        ? ""
        : [
            patient.primer_nombre,
            patient.segundo_nombre,
            patient.primer_apellido,
            patient.segundo_apellido,
          ]
            .filter(Boolean)
            .join(" "),
    [patient]
  );

  const initials = useMemo(
    () =>
      !patient
        ? "P"
        : `${patient.primer_nombre?.[0] ?? ""}${
            patient.primer_apellido?.[0] ?? ""
          }`.toUpperCase(),
    [patient]
  );

  const age = patient?.fecha_nacimiento
    ? calculateAge(patient.fecha_nacimiento)
    : null;

  const enfermedadesList = useMemo(() => {
    if (!patient?.enfermedades) return [];
    try {
      const p = JSON.parse(patient.enfermedades);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }, [patient?.enfermedades]);

  const medicalSummary = useMemo(() => {
    if (!patient) return [];
    const items: string[] = [];
    if (enfermedadesList.length > 0)
      items.push(`Enfermedades sistémicas: ${enfermedadesList.join(", ")}`);
    if (patient.otras_enfermedades)
      items.push(`Otras enfermedades: ${patient.otras_enfermedades}`);
    if (patient.medicamentos)
      items.push(`Medicamentos: ${patient.medicamentos}`);
    if (patient.alergias) items.push(`Alergias: ${patient.alergias}`);
    if (patient.reaccion_anestesia)
      items.push(
        patient.reaccion_anestesia === "si"
          ? "Anestesia: Sí ha tenido reacciones"
          : "Anestesia: No ha tenido reacciones"
      );
    return items;
  }, [enfermedadesList, patient]);

  const hasMedicalAlerts = medicalSummary.length > 0;
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
    : "Sin visitas registradas";

  const isStacked = isMobile || isTablet;

  if (!patientId)
    return <Alert variant="error" message="ID de paciente inválido." />;
  if (isLoading)
    return <Alert variant="info" message="Cargando perfil del paciente..." />;
  if (error || !patient)
    return (
      <Alert variant="error" message={error || "Paciente no encontrado."} />
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 24,
        maxWidth: 1180,
      }}
    >
      {/* Flecha de volver */}
      <button
        onClick={() => navigate("/patients")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#888F94",
          fontSize: 13,
          fontWeight: 500,
          padding: 0,
          width: "fit-content",
        }}
      >
        <ArrowLeft size={16} /> Volver a pacientes
      </button>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            height: 6,
            background:
              "linear-gradient(90deg, var(--arco-primary) 0%, var(--arco-navy) 100%)",
          }}
        />
        <div style={{ padding: isMobile ? 16 : 24 }}>
          {/* Header: avatar + info + botones */}
          <div
            style={{
              display: "flex",
              flexDirection: isStacked ? "column" : "row",
              gap: isStacked ? 16 : 24,
            }}
          >
            {/* Avatar + info */}
            <div style={{ display: "flex", gap: 16, flex: 1 }}>
              <div
                style={{
                  alignItems: "center",
                  background: "var(--arco-primary)",
                  borderRadius: "50%",
                  color: "#fff",
                  display: "flex",
                  flexShrink: 0,
                  fontSize: isMobile ? 18 : 22,
                  fontWeight: 700,
                  height: isMobile ? 52 : 64,
                  justifyContent: "center",
                  width: isMobile ? 52 : 64,
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    alignItems: "flex-start",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <h2
                    style={{
                      color: "#203F49",
                      fontSize: isMobile ? 18 : 24,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {fullName}
                  </h2>
                  <span
                    style={{
                      background: "var(--arco-primary-light)",
                      borderRadius: 999,
                      color: "var(--arco-primary)",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "4px 10px",
                      flexShrink: 0,
                    }}
                  >
                    #{code}
                  </span>
                </div>
                <div
                  style={{
                    color: "#5F656A",
                    display: "flex",
                    flexWrap: "wrap",
                    fontSize: 13,
                    gap: 10,
                  }}
                >
                  <span>{age ?? "-"} años</span>
                  <span>{patient.sexo === "F" ? "Femenino" : "Masculino"}</span>
                  <span>{patient.telefono}</span>
                  {patient.correo_electronico && (
                    <span>{patient.correo_electronico}</span>
                  )}
                  <span>{location}</span>
                </div>
                <p
                  style={{ color: "#5F656A", fontSize: 13, margin: "10px 0 0" }}
                >
                  Última visita: {lastVisit}
                </p>

                {/* Alertas médicas */}
                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      alignItems: "center",
                      color: "var(--arco-warning)",
                      display: "flex",
                      fontSize: 12,
                      fontWeight: 700,
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <AlertTriangle size={13} /> ALERTAS MÉDICAS
                  </div>
                  {hasMedicalAlerts ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {medicalSummary.map((item) => (
                        <span
                          key={item}
                          style={{ color: "#5F656A", fontSize: 12 }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: "#888F94", fontSize: 12 }}>
                      Sin alertas médicas registradas.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div
              style={{
                display: "flex",
                flexDirection: isStacked ? "row" : "column",
                flexWrap: "wrap",
                gap: 8,
                flexShrink: 0,
                width: isStacked ? "100%" : 180,
              }}
            >
              {[
                {
                  label: "Editar paciente",
                  icon: <Edit size={14} />,
                  onClick: () =>
                    navigate(`/patients/edit/${patient.id_persona}`),
                  variant: "primary" as const,
                },
                {
                  label: "Ver expediente",
                  icon: <FileText size={14} />,
                  onClick: () =>
                    navigate(
                      `/patients/records${
                        patientQuery ? `?${patientQuery}` : ""
                      }`
                    ),
                  variant: "secondary" as const,
                },
                {
                  label: "Odontograma",
                  icon: <Stethoscope size={14} />,
                  onClick: () =>
                    navigate(
                      `/patients/odontogram${
                        patientQuery ? `?${patientQuery}` : ""
                      }`
                    ),
                  variant: "secondary" as const,
                },
                {
                  label: "Consentimientos",
                  icon: <ShieldCheck size={14} />,
                  onClick: () =>
                    navigate(
                      `/patients/consent${
                        patientQuery ? `?${patientQuery}` : ""
                      }`
                    ),
                  variant: "secondary" as const,
                },
              ].map((btn) => (
                <Button
                  key={btn.label}
                  variant={btn.variant}
                  onClick={btn.onClick}
                  style={{
                    flex: isStacked ? "1 1 140px" : undefined,
                    justifyContent: "center",
                  }}
                >
                  {btn.icon} {btn.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Banner de alertas médicas */}
          <div
            style={{
              background: hasMedicalAlerts
                ? "rgba(239,159,39,0.08)"
                : "var(--arco-gray-50)",
              border: `1px solid ${
                hasMedicalAlerts
                  ? "rgba(239,159,39,0.35)"
                  : "var(--arco-gray-300)"
              }`,
              borderRadius: 8,
              color: "#5F656A",
              marginTop: 16,
              padding: "12px 16px",
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <AlertTriangle size={14} />
              {hasMedicalAlerts
                ? "Información médica registrada para este paciente."
                : "Sin alertas médicas activas registradas."}
            </div>
            <p style={{ fontSize: 12, margin: "6px 0 0 22px" }}>
              {hasMedicalAlerts
                ? "Los antecedentes iniciales fueron guardados en el perfil del paciente y pueden complementarse desde el expediente clínico."
                : "Los antecedentes médicos se registran por consulta. Cuando existan respuestas asociadas, aparecerán en el expediente clínico."}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <div
          style={{
            borderBottom: "1px solid #D3D7DA",
            display: "flex",
            gap: isMobile ? 16 : 28,
            marginBottom: 20,
          }}
        >
          <ProfileTab
            active={activeTab === "appointments"}
            icon={<Calendar size={16} />}
            label="Citas"
            onClick={() => setActiveTab("appointments")}
          />
          <ProfileTab
            active={activeTab === "financial"}
            icon={<DollarSign size={16} />}
            label="Financiero"
            onClick={() => setActiveTab("financial")}
          />
        </div>
        {activeTab === "appointments" ? (
          <AppointmentsTab appointments={appointments} />
        ) : (
          <FinancialTab rows={financialRows} />
        )}
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
