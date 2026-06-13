import { useCallback, useEffect, useRef, useState } from "react";
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
import { DataTable } from "../../../components";
import type { Column } from "../../../components";
import { Alert, Button, Card, Input } from "../../../context";
import {
  DEFAULT_PAGE_SIZE,
  PATIENT_SYSTEMIC_DISEASES,
} from "../../../config/constants";
import api from "../../../services/api";
import { formatDate, normalizeSearch } from "../../../utils/formatters";
import { useResponsive } from "../../../hooks/useWindowWidth";
import { Z } from "../../../utils/zIndex";

type Patient = Record<string, unknown> & {
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
  enfermedades?: string | null;
  otras_enfermedades?: string | null;
  medicamentos?: string | null;
  alergias?: string | null;
  reaccion_anestesia?: string | null;
};

type PersonasListResponse = {
  data: PersonaApi[];
  pagination?: { total: number; page: number; limit: number; pages: number };
};

type PatientSearchFilters = {
  nombre?: string;
  identidad?: string;
  telefono?: string;
  codigo?: string;
};

interface PatientsScreenProps {
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
    enfermedades: persona.enfermedades ?? null,
    otras_enfermedades: persona.otras_enfermedades ?? null,
    medicamentos: persona.medicamentos ?? null,
    alergias: persona.alergias ?? null,
    reaccion_anestesia: persona.reaccion_anestesia ?? null,
  };
};

// ─── Card para móvil/tablet ───────────────────────────────────────────────────
function PatientCard({
  patient,
  onEdit,
  onView,
}: {
  patient: Patient;
  onEdit: () => void;
  onView: () => void;
}) {
  const navigate = useNavigate();
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
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            onClick={() => navigate(`/patients/profile/${patient.id}`)}
            style={{
              background: "transparent",
              border: "none",
              color: "#0BC5DF",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              padding: 0,
              textAlign: "left",
              textDecoration: "none",
            }}
          >
            {patient.fullName}
          </button>
          <p
            style={{
              fontSize: 12,
              color: "#888F94",
              margin: "2px 0 0",
              fontFamily: "monospace",
            }}
          >
            {patient.code}
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            onClick={onEdit}
            title="Editar"
            style={{
              padding: 6,
              borderRadius: 8,
              border: "none",
              background: "#F8F9FA",
              cursor: "pointer",
              color: "#203F49",
              display: "flex",
            }}
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onView}
            title="Ver información médica"
            style={{
              padding: 6,
              borderRadius: 8,
              border: "none",
              background: "#F8F9FA",
              cursor: "pointer",
              color: "#203F49",
              display: "flex",
            }}
          >
            <FileText size={15} />
          </button>
        </div>
      </div>
      <div style={{ borderTop: "1px solid #F8F9FA", paddingTop: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Teléfono</span>
          <span style={{ fontSize: 13, color: "#203F49" }}>
            {patient.phone}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "7px 0",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Última visita</span>
          <span
            style={{
              fontSize: 13,
              color: patient.lastVisit ? "#203F49" : "#888F94",
            }}
          >
            {patient.lastVisit ? formatDate(patient.lastVisit) : "Sin visitas"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export function PatientsScreen({
  onCreatePatient,
  onEditPatient,
  onViewPatient,
}: PatientsScreenProps) {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const mountedRef = useRef(true);

  const [searchName, setSearchName] = useState("");
  const [searchIdentity, setSearchIdentity] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedMedicalPatient, setSelectedMedicalPatient] =
    useState<Patient | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeFilters, setActiveFilters] = useState<PatientSearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    pages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const hasAnyFilter = Boolean(
    searchName || searchIdentity || searchPhone || searchCode
  );

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError("");

    api
      .get<PersonasListResponse>("/persona", {
        params: {
          page: currentPage,
          limit: DEFAULT_PAGE_SIZE,
          nombre: activeFilters.nombre || undefined,
          identidad: activeFilters.identidad || undefined,
          telefono: activeFilters.telefono || undefined,
          codigo: activeFilters.codigo || undefined,
          includeConsulta: false,
        },
      })
      .then((response) => {
        if (ignore) return;
        const personas = response.data?.data ?? [];
        const patients = personas.map(mapPersonaToPatient);
        setSearchResults(patients);
        setPagination(
          response.data?.pagination ?? {
            total: patients.length,
            page: currentPage,
            limit: DEFAULT_PAGE_SIZE,
            pages: Math.max(1, Math.ceil(patients.length / DEFAULT_PAGE_SIZE)),
          }
        );
      })
      .catch((err: unknown) => {
        if (ignore) return;
        const message =
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los pacientes.";
        setError(message);
        setSearchResults([]);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeFilters, currentPage]);

  const handleSearch = () => {
    if (!hasAnyFilter) return;
    setIsLoading(true);
    setError("");
    setHasSearched(true);
    setActiveFilters({
      // Fix 2: normalizar tildes para que "Maria" encuentre "María"
      nombre: searchName.trim()
        ? normalizeSearch(searchName.trim())
        : undefined,
      identidad: searchIdentity.replace(/\D/g, "") || undefined,
      telefono: searchPhone.replace(/\D/g, "") || undefined,
      codigo: searchCode.replace(/^PAC-/i, "").replace(/\D/g, "") || undefined,
    });
    setCurrentPage(1);
  };

  const handleClear = () => {
    setIsLoading(true);
    setError("");
    setSearchName("");
    setSearchIdentity("");
    setSearchPhone("");
    setSearchCode("");
    setHasSearched(false);
    setActiveFilters({});
    setCurrentPage(1);
  };

  const handleEditPatient = (id: number) => {
    onEditPatient?.(id);
    if (!onEditPatient) navigate(`/patients/edit/${id}`);
  };

  const handleViewPatient = (patient: Patient) => {
    onViewPatient?.(patient.id);
    setSelectedMedicalPatient(patient);
  };

  const handleTableParamsChange = useCallback(
    ({
      page,
    }: {
      page: number;
      search: string;
      filters: Record<string, string>;
    }) => {
      if (page === currentPage) return;
      setIsLoading(true);
      setError("");
      setCurrentPage(page);
    },
    [currentPage]
  );

  const columns: Column<Patient>[] = [
    {
      key: "code",
      label: "Código",
      width: 130,
      render: (_v, p) => (
        <span
          style={{
            color: "var(--arco-primary)",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {p.code}
        </span>
      ),
    },
    {
      key: "fullName",
      label: "Nombre completo",
      render: (_v, p) => (
        <PatientNameButton
          name={p.fullName}
          onClick={() => navigate(`/patients/profile/${p.id}`)}
        />
      ),
    },
    { key: "phone", label: "Teléfono", width: 140 },
    {
      key: "lastVisit",
      label: "Última visita",
      width: 150,
      render: (_v, p) =>
        p.lastVisit ? formatDate(p.lastVisit) : "Sin visitas",
    },
  ];

  // Grid de filtros: 1 col en móvil, 2 en tablet, 4 en desktop
  const filterCols = isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(4, 1fr)";
  const showCards = isMobile || isTablet;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 24,
        width: "100%",
      }}
    >
      {error && (
        <Alert variant="error" message={error} onClose={() => setError("")} />
      )}

      {/* Header con título y botón crear */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              color: "var(--arco-navy)",
              fontSize: 15,
              fontWeight: 600,
              margin: "0 0 2px",
            }}
          >
            Filtros de búsqueda
          </h3>
          <p style={{ color: "var(--arco-gray-500)", fontSize: 12, margin: 0 }}>
            Ingresa al menos un criterio para buscar
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onCreatePatient ?? (() => navigate("/patients/new"))}
          style={{ width: isMobile ? "100%" : undefined }}
        >
          <Plus size={16} /> Crear nuevo paciente
        </Button>
      </div>

      {/* Filtros de búsqueda */}
      <Card style={{ paddingTop: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: filterCols,
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Input
            label="Nombre"
            placeholder="Ej: María López"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            icon={<User size={15} />}
          />
          <Input
            label="Identidad"
            placeholder="Ej: 0801-1990-12345"
            value={searchIdentity}
            onChange={(e) => setSearchIdentity(e.target.value)}
            icon={<IdCard size={15} />}
          />
          <Input
            label="Teléfono"
            placeholder="Ej: 9876-5432"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            icon={<Phone size={15} />}
          />
          <Input
            label="Código"
            placeholder="Ej: PAC-000124"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            icon={<Hash size={15} />}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 10,
          }}
        >
          <Button
            variant="primary"
            onClick={handleSearch}
            disabled={!hasAnyFilter || isLoading}
            style={{
              flex: isMobile ? undefined : "1 1 0",
              width: isMobile ? "100%" : undefined,
            }}
          >
            <Search size={16} />
            {isLoading && hasSearched ? "Buscando..." : "Buscar paciente"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleClear}
            disabled={isLoading}
            style={{ width: isMobile ? "100%" : undefined }}
          >
            <X size={16} /> Limpiar
          </Button>
        </div>
      </Card>

      {/* Contenido: cards en móvil/tablet, DataTable en desktop */}
      {showCards ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isLoading ? (
            <p
              style={{
                textAlign: "center",
                color: "#888F94",
                fontSize: 14,
                padding: 24,
              }}
            >
              Cargando pacientes...
            </p>
          ) : searchResults.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#888F94",
                fontSize: 14,
                padding: 24,
              }}
            >
              No hay pacientes para mostrar.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 12, color: "#888F94", margin: 0 }}>
                {hasSearched
                  ? `${pagination.total} resultado${
                      pagination.total === 1 ? "" : "s"
                    } encontrados`
                  : `Total de ${pagination.total} pacientes registrados`}
              </p>
              {searchResults.map((p) => (
                <PatientCard
                  key={p.id}
                  patient={p}
                  onEdit={() => handleEditPatient(p.id)}
                  onView={() => handleViewPatient(p)}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <DataTable<Patient>
          key={hasSearched ? JSON.stringify(activeFilters) : "all-patients"}
          columns={columns}
          data={isLoading ? [] : searchResults}
          title={
            hasSearched ? "Resultados de búsqueda" : "Listado de pacientes"
          }
          description={
            isLoading
              ? "Cargando pacientes registrados..."
              : hasSearched
              ? `${pagination.total} resultado${
                  pagination.total === 1 ? "" : "s"
                } encontrados`
              : `Total de ${pagination.total} pacientes registrados`
          }
          emptyMessage={
            isLoading
              ? "Cargando pacientes..."
              : "No hay pacientes para mostrar."
          }
          getRowKey={(p) => String(p.id)}
          isServerSide
          onServerParamsChange={handleTableParamsChange}
          pageSize={DEFAULT_PAGE_SIZE}
          totalRecords={pagination.total}
          searchable={false}
          rowActions={(p) => [
            {
              icon: <Pencil size={14} />,
              label: "Editar paciente",
              onClick: () => handleEditPatient(p.id),
            },
            {
              icon: <FileText size={14} />,
              label: "Ver información médica",
              onClick: () => handleViewPatient(p),
            },
          ]}
        />
      )}

      {selectedMedicalPatient && (
        <MedicalInfoModal
          patient={selectedMedicalPatient}
          onClose={() => setSelectedMedicalPatient(null)}
        />
      )}
    </div>
  );
}

// ─── Modal información médica ─────────────────────────────────────────────────
function MedicalInfoModal({
  onClose,
  patient,
}: {
  onClose: () => void;
  patient: Patient;
}) {
  const { isMobile } = useResponsive();

  const enfermedadesStr = patient.enfermedades as string | null;
  let enfermedadesList: string[] = [];
  try {
    if (enfermedadesStr) enfermedadesList = JSON.parse(enfermedadesStr);
  } catch {
    /* fail-safe */
  }

  const otrasEnfermedades = patient.otras_enfermedades as string | null;
  const medicamentos = patient.medicamentos as string | null;
  const alergias = patient.alergias as string | null;
  const reaccionAnestesia = patient.reaccion_anestesia as string | null;
  const hasMedicalInfo =
    enfermedadesList.length > 0 ||
    otrasEnfermedades ||
    medicamentos ||
    alergias ||
    reaccionAnestesia;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(32,63,73,0.35)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 24,
        zIndex: Z.MODAL_OVERLAY,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #D3D7DA",
          borderRadius: isMobile ? "16px 16px 0 0" : 12,
          boxShadow: "0 24px 70px rgba(32,63,73,0.18)",
          maxWidth: isMobile ? "100%" : 720,
          width: "100%",
          maxHeight: isMobile ? "90vh" : undefined,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Handle móvil */}
        {isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 4px",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 9999,
                background: "#D3D7DA",
              }}
            />
          </div>
        )}

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: isMobile ? "12px 20px 16px" : 20,
            borderBottom: "1px solid #F1F3F4",
          }}
        >
          <div>
            <h3
              style={{
                color: "#203F49",
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Información médica
            </h3>
            <p style={{ color: "#888F94", fontSize: 12, margin: "4px 0 0" }}>
              {patient.fullName} · {patient.code}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              alignItems: "center",
              background: "#fff",
              border: "1px solid #D3D7DA",
              borderRadius: 6,
              color: "#888F94",
              cursor: "pointer",
              display: "flex",
              height: 32,
              justifyContent: "center",
              width: 32,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            padding: isMobile ? "16px 20px" : 20,
          }}
        >
          {hasMedicalInfo ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {enfermedadesList.length > 0 && (
                <div>
                  <strong
                    style={{
                      color: "#203F49",
                      fontSize: 13,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Enfermedades sistémicas:
                  </strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {enfermedadesList.map((disease) => {
                      const matched = PATIENT_SYSTEMIC_DISEASES.find(
                        (d) => d.id === disease
                      );
                      return (
                        <span
                          key={disease}
                          style={{
                            background: "var(--arco-primary-light)",
                            color: "var(--arco-primary)",
                            fontSize: 12,
                            fontWeight: 500,
                            padding: "4px 10px",
                            borderRadius: 20,
                          }}
                        >
                          {matched?.label || disease}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {otrasEnfermedades && (
                <div>
                  <strong
                    style={{
                      color: "#203F49",
                      fontSize: 13,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Otras enfermedades:
                  </strong>
                  <p
                    style={{
                      color: "#5F656A",
                      fontSize: 13,
                      margin: 0,
                      background: "#F8F9FA",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #D3D7DA",
                    }}
                  >
                    {otrasEnfermedades}
                  </p>
                </div>
              )}
              {medicamentos && (
                <div>
                  <strong
                    style={{
                      color: "#203F49",
                      fontSize: 13,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Medicamentos actuales:
                  </strong>
                  <p
                    style={{
                      color: "#5F656A",
                      fontSize: 13,
                      margin: 0,
                      background: "#F8F9FA",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #D3D7DA",
                    }}
                  >
                    {medicamentos}
                  </p>
                </div>
              )}
              {alergias && (
                <div>
                  <strong
                    style={{
                      color: "#203F49",
                      fontSize: 13,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Alergias a medicamentos:
                  </strong>
                  <p
                    style={{
                      color: "#5F656A",
                      fontSize: 13,
                      margin: 0,
                      background: "#F8F9FA",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #D3D7DA",
                    }}
                  >
                    {alergias}
                  </p>
                </div>
              )}
              {reaccionAnestesia && (
                <div>
                  <strong
                    style={{
                      color: "#203F49",
                      fontSize: 13,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Historial de anestesia:
                  </strong>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 6,
                      background:
                        reaccionAnestesia === "si"
                          ? "var(--arco-danger-soft)"
                          : "var(--arco-success-soft)",
                      color:
                        reaccionAnestesia === "si"
                          ? "var(--arco-danger)"
                          : "var(--arco-success)",
                    }}
                  >
                    {reaccionAnestesia === "si"
                      ? "Sí, ha tenido reacciones a la anestesia"
                      : "No ha tenido reacciones a la anestesia"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                background: "#F8F9FA",
                border: "1px solid #D3D7DA",
                borderRadius: 8,
                color: "#888F94",
                fontSize: 13,
                padding: "24px 16px",
                textAlign: "center",
              }}
            >
              Sin información médica registrada para este paciente.
            </div>
          )}
          <p style={{ color: "#888F94", fontSize: 12, margin: "16px 0 0" }}>
            Los antecedentes médicos iniciales se guardan en el perfil del
            paciente.
          </p>
        </div>
      </div>
    </div>
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
