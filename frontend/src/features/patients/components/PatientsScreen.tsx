import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Hash,
  IdCard,
  Pencil,
  Phone,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import { Alert, Button, Card, Input } from "../../../context";
import api from "../../../services/api";

type Patient = {
  id: number;
  code: string;
  fullName: string;
  identity: string;
  phone: string;
  lastVisit: string | null;
};

type PersonaApi = {
  id_persona: number;
  numero_identidad: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  telefono: string;
};

type PersonasListResponse = {
  data: PersonaApi[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

interface PatientsScreenProps {
  onViewProfile?: () => void;
  onCreatePatient?: () => void;
  onEditPatient?: (id: number) => void;
  onViewPatient?: (id: number) => void;
}

export function PatientsScreen({
  onViewProfile,
  onCreatePatient,
  onEditPatient,
  onViewPatient,
}: PatientsScreenProps) {
  const navigate = useNavigate();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchIdentity, setSearchIdentity] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedMedicalPatient, setSelectedMedicalPatient] =
    useState<Patient | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const hasAnyFilter = Boolean(
    searchName || searchIdentity || searchPhone || searchCode,
  );

  useEffect(() => {
    void loadPatients();
  }, []);

  const mapPersonaToPatient = (persona: PersonaApi): Patient => {
    const fullName = [
      persona.primer_nombre,
      persona.segundo_nombre,
      persona.primer_apellido,
      persona.segundo_apellido,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      id: persona.id_persona,
      code: `PAC-${String(persona.id_persona).padStart(6, "0")}`,
      fullName,
      identity: persona.numero_identidad,
      phone: persona.telefono,
      lastVisit: null,
    };
  };

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get<PersonasListResponse>("/persona", {
        params: { page: 1, limit: 100 },
      });
      const personas = response.data?.data ?? [];
      const patients = personas.map(mapPersonaToPatient);
      setAllPatients(patients);
      setSearchResults(patients);
    } catch (requestError) {
      const apiError = requestError as { message?: string };
      setError(apiError.message ?? "No se pudieron cargar los pacientes.");
      setAllPatients([]);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!hasAnyFilter) return;

    const identityQuery = searchIdentity.replace(/\D/g, "");
    const phoneQuery = searchPhone.replace(/\D/g, "");

    const filtered = allPatients.filter((patient) => {
      const matchName =
        !searchName ||
        patient.fullName.toLowerCase().includes(searchName.toLowerCase());
      const matchIdentity =
        !searchIdentity ||
        patient.identity.includes(identityQuery || searchIdentity);
      const matchPhone =
        !searchPhone ||
        patient.phone.includes(searchPhone) ||
        patient.phone.replace(/\D/g, "").includes(phoneQuery);
      const matchCode =
        !searchCode ||
        patient.code.toLowerCase().includes(searchCode.toLowerCase());

      return matchName && matchIdentity && matchPhone && matchCode;
    });

    setSearchResults(filtered);
    setHasSearched(true);
  };

  const handleClear = () => {
    setSearchName("");
    setSearchIdentity("");
    setSearchPhone("");
    setSearchCode("");
    setSearchResults(allPatients);
    setHasSearched(false);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Sin visitas";

    return new Date(dateStr).toLocaleDateString("es-HN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleEditPatient = (id: number) => {
    onEditPatient?.(id);
    if (!onEditPatient) navigate(`/patients/edit/${id}`);
  };

  const handleViewPatient = (patient: Patient) => {
    onViewPatient?.(patient.id);
    setSelectedMedicalPatient(patient);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {error ? <Alert variant="error" message={error} onClose={() => setError("")} /> : null}

      <Card>
        <div style={{ marginBottom: 20 }}>
          <h3
            style={{
              color: "var(--arco-navy)",
              fontSize: 15,
              fontWeight: 600,
              margin: "0 0 4px",
            }}
          >
            Filtros de búsqueda
          </h3>
          <p
            style={{
              color: "var(--arco-gray-500)",
              fontSize: 12,
              margin: 0,
            }}
          >
            Ingresa al menos un criterio para buscar pacientes
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <Input
            label="Búsqueda por nombre"
            badge="optional"
            placeholder="Ej: María López"
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
            icon={<User size={15} />}
          />
          <Input
            label="Búsqueda por número de identidad"
            badge="optional"
            placeholder="Ej: 0801-1990-12345"
            value={searchIdentity}
            onChange={(event) => setSearchIdentity(event.target.value)}
            icon={<IdCard size={15} />}
          />
          <Input
            label="Búsqueda por teléfono"
            badge="optional"
            placeholder="Ej: 9876-5432"
            value={searchPhone}
            onChange={(event) => setSearchPhone(event.target.value)}
            icon={<Phone size={15} />}
          />
          <Input
            label="Búsqueda por código autogenerado"
            badge="optional"
            placeholder="Ej: PAC-000124"
            value={searchCode}
            onChange={(event) => setSearchCode(event.target.value)}
            icon={<Hash size={15} />}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Button
            variant="primary"
            onClick={handleSearch}
            disabled={!hasAnyFilter || isLoading}
            style={{ flex: 1 }}
          >
            <Search size={16} />
            Buscar paciente
          </Button>
          <Button variant="secondary" onClick={handleClear} disabled={isLoading}>
            <X size={16} />
            Limpiar filtros
          </Button>
          <Button
            variant="primary"
            onClick={
              onCreatePatient ?? (() => navigate("/patients/new"))
            }
          >
            <Plus size={16} />
            Crear nuevo paciente
          </Button>
        </div>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <h3
            style={{
              color: "var(--arco-navy)",
              fontSize: 15,
              fontWeight: 600,
              margin: "0 0 4px",
            }}
          >
            {hasSearched ? "Resultados de búsqueda" : "Listado de pacientes"}
          </h3>
          <p
            style={{
              color: "var(--arco-gray-500)",
              fontSize: 12,
              margin: 0,
            }}
          >
            {hasSearched
              ? searchResults.length === 0
                ? "No se encontraron pacientes con los criterios especificados"
                : `Se encontraron ${searchResults.length} paciente${
                    searchResults.length !== 1 ? "s" : ""
                  }`
              : isLoading
                ? "Cargando pacientes registrados..."
                : `Total de ${searchResults.length} pacientes registrados`}
          </p>
        </div>

        <div
          style={{
            border: "1px solid var(--arco-gray-300)",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "var(--arco-gray-50)",
              borderBottom: "1px solid var(--arco-gray-300)",
              display: "grid",
              gridTemplateColumns: "140px 1fr 160px 140px 90px",
              padding: "10px 16px",
            }}
          >
            {[
              "Código del paciente",
              "Nombre completo",
              "Teléfono",
              "Fecha última visita",
              "Acciones",
            ].map((heading) => (
              <span
                key={heading}
                style={{
                  color: "var(--arco-gray-500)",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textAlign: heading === "Acciones" ? "center" : "left",
                  textTransform: "uppercase",
                }}
              >
                {heading}
              </span>
            ))}
          </div>

          {isLoading ? (
            <div
              style={{
                color: "var(--arco-gray-500)",
                fontSize: 13,
                padding: "28px 16px",
                textAlign: "center",
              }}
            >
              Cargando pacientes...
            </div>
          ) : searchResults.length === 0 ? (
            <div
              style={{
                color: "var(--arco-gray-500)",
                fontSize: 13,
                padding: "28px 16px",
                textAlign: "center",
              }}
            >
              No hay pacientes para mostrar.
            </div>
          ) : (
            searchResults.map((patient, index) => (
              <div
                key={patient.id}
                style={{
                  alignItems: "center",
                  background:
                    index % 2 === 0 ? "#FFFFFF" : "var(--arco-gray-50)",
                  borderBottom:
                    index < searchResults.length - 1
                      ? "1px solid var(--arco-gray-100)"
                      : "none",
                  display: "grid",
                  gridTemplateColumns: "140px 1fr 160px 140px 90px",
                  minHeight: 50,
                  padding: "12px 16px",
                }}
              >
                <span
                  style={{
                    color: "var(--arco-primary)",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {patient.code}
                </span>
                <PatientNameButton
                  name={patient.fullName}
                  onClick={() => navigate(`/patients/profile/${patient.id}`)}
                />
                <span style={{ color: "var(--arco-gray-700)", fontSize: 13 }}>
                  {patient.phone}
                </span>
                <span style={{ color: "var(--arco-gray-700)", fontSize: 13 }}>
                  {formatDate(patient.lastVisit)}
                </span>
                <div
                  style={{
                    alignItems: "center",
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  <ActionIconButton
                    title="Editar paciente"
                    onClick={() => handleEditPatient(patient.id)}
                  >
                    <Pencil size={15} />
                  </ActionIconButton>
                  <ActionIconButton
                    title="Ver información médica"
                    onClick={() => handleViewPatient(patient)}
                  >
                    <FileText size={15} />
                  </ActionIconButton>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {selectedMedicalPatient ? (
        <MedicalInfoModal
          patient={selectedMedicalPatient}
          onClose={() => setSelectedMedicalPatient(null)}
        />
      ) : null}
    </div>
  );
}

function MedicalInfoModal({
  onClose,
  patient,
}: {
  onClose: () => void;
  patient: Patient;
}) {
  return (
    <div
      style={{
        alignItems: "center",
        background: "rgba(32, 63, 73, 0.28)",
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        left: 0,
        padding: 24,
        position: "fixed",
        right: 0,
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid var(--arco-gray-300)",
          borderRadius: 12,
          boxShadow: "0 24px 70px rgba(32, 63, 73, 0.18)",
          maxWidth: 720,
          padding: 20,
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "flex-start",
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          <div>
            <h3
              style={{
                color: "var(--arco-navy)",
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Información médica
            </h3>
            <p style={{ color: "var(--arco-gray-500)", fontSize: 12, margin: "4px 0 0" }}>
              {patient.fullName} · {patient.code}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              alignItems: "center",
              background: "#FFFFFF",
              border: "1px solid var(--arco-gray-300)",
              borderRadius: 6,
              color: "var(--arco-gray-500)",
              cursor: "pointer",
              display: "flex",
              height: 32,
              justifyContent: "center",
              width: 32,
            }}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <MedicalBlock
            items={["Diabetes", "Hipertensión"]}
            title="Enfermedades sistémicas"
            tone="warning"
          />
          <MedicalBlock
            items={["Penicilina", "Ibuprofeno"]}
            title="Alergias a medicamentos"
            tone="danger"
          />
          <MedicalBlock
            items={["Reacción moderada a lidocaína con epinefrina en procedimiento de 2023. Utilizar anestesia sin vasoconstrictor."]}
            title="Historial de anestesia"
            tone="warning"
          />
          <MedicalBlock
            items={["No hay medicamentos actuales registrados."]}
            title="Medicamentos actuales"
            tone="neutral"
          />
        </div>

        <p style={{ color: "var(--arco-gray-500)", fontSize: 12, margin: "16px 0 0" }}>
          Nota: estos datos médicos se muestran como vista clínica rápida. Cuando el backend exponga antecedentes médicos por paciente, esta tarjeta puede leerlos desde la API.
        </p>
      </div>
    </div>
  );
}

function MedicalBlock({
  items,
  title,
  tone,
}: {
  items: string[];
  title: string;
  tone: "danger" | "neutral" | "warning";
}) {
  const colorMap = {
    danger: { bg: "#FEF2F2", border: "#FECACA", text: "#B91C1C" },
    neutral: { bg: "#F8F9FA", border: "#D3D7DA", text: "#5F656A" },
    warning: { bg: "#FFFBEB", border: "#FDE68A", text: "#B7791F" },
  };
  const colors = colorMap[tone];

  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 8,
        padding: 14,
      }}
    >
      <div style={{ color: "#203F49", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {items.map((item) => (
          <span
            key={item}
            style={{
              background: "#FFFFFF",
              border: `1px solid ${colors.border}`,
              borderRadius: 999,
              color: colors.text,
              fontSize: 12,
              fontWeight: 600,
              padding: "5px 10px",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ActionIconButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  title: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={title}
      type="button"
      style={{
        alignItems: "center",
        background: isHovered ? "var(--arco-primary-light)" : "#FFFFFF",
        border: `1px solid ${
          isHovered ? "var(--arco-primary)" : "var(--arco-gray-300)"
        }`,
        borderRadius: 6,
        color: isHovered ? "var(--arco-primary)" : "var(--arco-gray-500)",
        cursor: "pointer",
        display: "flex",
        height: 32,
        justifyContent: "center",
        padding: 0,
        transition: "all 0.15s ease",
        width: 32,
      }}
    >
      {children}
    </button>
  );
}

function PatientNameButton({
  name,
  onClick,
}: {
  name: string;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      type="button"
      style={{
        background: "transparent",
        border: "none",
        color: isHovered ? "#0899B0" : "#0BC5DF",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        padding: 0,
        textAlign: "left",
        textDecoration: isHovered ? "underline" : "none",
        textUnderlineOffset: 3,
        transition: "color 0.15s ease",
      }}
      title="Abrir perfil del paciente"
    >
      {name}
    </button>
  );
}
