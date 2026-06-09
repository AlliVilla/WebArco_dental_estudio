import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
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
import { DEFAULT_PAGE_SIZE } from "../../../config/constants";
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

export function PatientsScreen({
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
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const hasAnyFilter = Boolean(
    searchName || searchIdentity || searchPhone || searchCode,
  );

  const filterPatients = useCallback((patients: Patient[]) => {
    const identityQuery = searchIdentity.replace(/\D/g, "");
    const phoneQuery = searchPhone.replace(/\D/g, "");

    return patients.filter((patient) => {
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
  }, [searchCode, searchIdentity, searchName, searchPhone]);

  const getBackendSearchQuery = useCallback(() =>
    searchName.trim() ||
    searchIdentity.replace(/\D/g, "") ||
    searchPhone.replace(/\D/g, "") ||
    searchCode.replace(/^PAC-/i, "").replace(/\D/g, ""), [searchCode, searchIdentity, searchName, searchPhone]);

  const loadPatients = useCallback(async (page: number, search = "") => {
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get<PersonasListResponse>("/persona", {
        params: { page, limit: DEFAULT_PAGE_SIZE, search: search || undefined },
      });
      const personas = response.data?.data ?? [];
      const patients = personas.map(mapPersonaToPatient);
      setAllPatients(patients);
      setSearchResults(hasSearched ? filterPatients(patients) : patients);
      setPagination(response.data?.pagination ?? {
        total: patients.length,
        page,
        limit: DEFAULT_PAGE_SIZE,
        pages: Math.max(1, Math.ceil(patients.length / DEFAULT_PAGE_SIZE)),
      });
    } catch (requestError) {
      const apiError = requestError as { message?: string };
      setError(apiError.message ?? "No se pudieron cargar los pacientes.");
      setAllPatients([]);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [filterPatients, hasSearched]);

  useEffect(() => {
    queueMicrotask(() => {
      loadPatients(currentPage, activeSearchQuery).catch(() => undefined);
    });
  }, [activeSearchQuery, currentPage, loadPatients]);

  const handleSearch = () => {
    if (!hasAnyFilter) return;
    setHasSearched(true);
    setActiveSearchQuery(getBackendSearchQuery());
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearchName("");
    setSearchIdentity("");
    setSearchPhone("");
    setSearchCode("");
    setSearchResults(allPatients);
    setHasSearched(false);
    setActiveSearchQuery("");
    setCurrentPage(1);
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
            {isLoading && hasSearched ? "Buscando..." : "Buscar paciente"}
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
                : `${hasSearched ? "Página de resultados" : "Página"} ${pagination.page} de ${pagination.pages} · ${pagination.total} pacientes registrados`}
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

        {pagination.pages > 1 ? (
          <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginTop: 16 }}>
            <span style={{ color: "var(--arco-gray-500)", fontSize: 12 }}>
              Mostrando {searchResults.length} de {pagination.total} pacientes
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                disabled={isLoading || currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                variant="secondary"
              >
                Anterior
              </Button>
              <Button
                disabled={isLoading || currentPage >= pagination.pages}
                onClick={() => setCurrentPage((page) => Math.min(pagination.pages, page + 1))}
                variant="secondary"
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : null}
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

        <div
          style={{
            background: "var(--arco-gray-50)",
            border: "1px solid var(--arco-gray-300)",
            borderRadius: 8,
            color: "var(--arco-gray-500)",
            fontSize: 13,
            padding: "24px 16px",
            textAlign: "center",
          }}
        >
          Sin información médica registrada para este paciente.
        </div>

        <p style={{ color: "var(--arco-gray-500)", fontSize: 12, margin: "16px 0 0" }}>
          Los antecedentes médicos se registran por consulta. Cuando existan datos asociados, esta vista rápida podrá mostrarlos desde la API.
        </p>
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
