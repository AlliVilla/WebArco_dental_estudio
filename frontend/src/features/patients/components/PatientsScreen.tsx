import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Eye, Hash, Phone, Plus, User, X } from "lucide-react";
import { DataTable } from "../../../components";
import type { Column } from "../../../components";
import { Alert, Button, Card, Input } from "../../../context";
import { DEFAULT_PAGE_SIZE } from "../../../config/constants";
import api from "../../../services/api";
import { formatDate } from "../../../utils/formatters";
import { useResponsive } from "../../../hooks/useWindowWidth";

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
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

type PatientSearchFilters = {
  nombre?: string;
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
  };
};

// ─── Card móvil/tablet ──────────────────────────────────────────────────────
function PatientCard({
  patient,
  onEdit,
  onView,
}: {
  patient: Patient;
  onEdit: () => void;
  onView: () => void;
}) {
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
          <button
            onClick={onView}
            type="button"
            style={{
              background: "transparent",
              border: "none",
              color: "#0BC5DF",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              padding: 0,
              textAlign: "left",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
              width: "100%",
            }}
          >
            {patient.fullName}
          </button>
          <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
            {patient.code}
          </p>
        </div>
        <button
          onClick={onEdit}
          style={{
            padding: 6,
            borderRadius: 8,
            border: "none",
            background: "#F8F9FA",
            cursor: "pointer",
            color: "#203F49",
            display: "flex",
            flexShrink: 0,
          }}
        >
          <Edit size={15} />
        </button>
      </div>
      <div style={{ borderTop: "1px solid #F8F9FA", paddingTop: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Teléfono</span>
          <span style={{ fontSize: 13, color: "#203F49" }}>
            {patient.phone || "N/A"}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>
            Última consulta
          </span>
          <span style={{ fontSize: 13, color: "#203F49" }}>
            {patient.lastVisit
              ? formatDate(patient.lastVisit)
              : "Sin consultas"}
          </span>
        </div>
        <button
          onClick={onView}
          style={{
            width: "100%",
            marginTop: 8,
            padding: "8px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            border: "1px solid #D3D7DA",
            borderRadius: 8,
            background: "#fff",
            fontSize: 13,
            color: "#203F49",
            cursor: "pointer",
          }}
        >
          <Eye size={14} /> Ver información médica
        </button>
      </div>
    </div>
  );
}

export function PatientsScreen({
  onCreatePatient,
  onEditPatient,
  onViewPatient,
}: PatientsScreenProps) {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const showCards = isMobile || isTablet;

  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
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
  const [searchVersion, setSearchVersion] = useState(0);
  const activeFilterKeyRef = useRef(
    JSON.stringify({ nombre: "", telefono: "", codigo: "" })
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
          telefono: activeFilters.telefono || undefined,
          codigo: activeFilters.codigo || undefined,
          includeConsulta: false,
        },
      })
      .then((response: { data: PersonasListResponse }) => {
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
        if (import.meta.env.DEV) console.error("[PatientsScreen]", err);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los pacientes."
        );
        setSearchResults([]);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [activeFilters, currentPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextFilters: PatientSearchFilters = {
        nombre: searchName.trim(),
        telefono: searchPhone.replace(/\D/g, ""),
        codigo: searchCode.replace(/^PAC-/i, "").replace(/\D/g, ""),
      };
      const nextFilterKey = JSON.stringify(nextFilters);

      if (activeFilterKeyRef.current === nextFilterKey) return;

      activeFilterKeyRef.current = nextFilterKey;
      setHasSearched(
        Boolean(
          nextFilters.nombre || nextFilters.telefono || nextFilters.codigo
        )
      );
      setActiveFilters(nextFilters);
      setSearchVersion((v) => v + 1);
      setCurrentPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchName, searchPhone, searchCode]);

  const handleClear = () => {
    setIsLoading(true);
    setError("");
    setSearchName("");
    setSearchPhone("");
    setSearchCode("");
    activeFilterKeyRef.current = JSON.stringify({
      nombre: "",
      telefono: "",
      codigo: "",
    });
    setHasSearched(false);
    setActiveFilters({});
    setSearchVersion((v) => v + 1);
    setCurrentPage(1);
  };

  const handleEditPatient = (id: number) => {
    onEditPatient?.(id);
    if (!onEditPatient) navigate(`/patients/edit/${id}`);
  };

  const handleViewMedicalInfo = (patientId: number) => {
    onViewPatient?.(patientId);
    navigate(`/patients/profile/${patientId}`);
  };

  const handleTableParamsChange = useCallback(
    ({ page }: { page: number }) => {
      if (page === currentPage) return;
      setIsLoading(true);
      setError("");
      setCurrentPage(page);
    },
    [currentPage]
  );

  const columns: Column<Patient>[] = useMemo(
    () => [
      {
        key: "code",
        label: "Código del paciente",
        width: 160,
        render: (_value, patient) => (
          <span
            style={{
              color: "var(--arco-primary)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {patient.code}
          </span>
        ),
      },
      {
        key: "fullName",
        label: "Nombre completo",
        render: (_value, patient) => (
          <PatientNameButton
            name={patient.fullName}
            onClick={() => handleViewMedicalInfo(patient.id)}
          />
        ),
      },
      { key: "phone", label: "Teléfono", width: 160 },
      {
        key: "lastVisit",
        label: "Fecha última consulta",
        width: 170,
        render: (_value, patient) =>
          patient.lastVisit ? formatDate(patient.lastVisit) : "Sin consultas",
      },
    ],
    []
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 24,
        width: "100%",
      }}
    >
      {error ? (
        <Alert variant="error" message={error} onClose={() => setError("")} />
      ) : null}

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
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <Input
            label="Búsqueda por nombre"
            placeholder="Ej: María López"
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
            icon={<User size={15} />}
          />
          <Input
            label="Búsqueda por teléfono"
            placeholder="Ej: 9876-5432"
            value={searchPhone}
            onChange={(event) => setSearchPhone(event.target.value)}
            icon={<Phone size={15} />}
          />
          <Input
            label="Búsqueda por código autogenerado"
            placeholder="Ej: PAC-000124"
            value={searchCode}
            onChange={(event) => setSearchCode(event.target.value)}
            icon={<Hash size={15} />}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="secondary"
            onClick={handleClear}
            disabled={isLoading}
            style={{ width: isMobile ? "100%" : undefined }}
          >
            <X size={16} />
            Limpiar filtros
          </Button>
          <Button
            variant="primary"
            onClick={onCreatePatient ?? (() => navigate("/patients/new"))}
            style={{ width: isMobile ? "100%" : undefined }}
          >
            <Plus size={16} />
            Crear nuevo paciente
          </Button>
        </div>
      </Card>

      {showCards ? (
        // ── Vista móvil/tablet: cards ────────────────────────────────────────
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "#888F94", margin: 0 }}>
            {isLoading
              ? "Cargando pacientes registrados..."
              : hasSearched
              ? `${pagination.total} resultado${
                  pagination.total === 1 ? "" : "s"
                } encontrados`
              : `Total de ${pagination.total} pacientes registrados`}
          </p>

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
            searchResults.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onEdit={() => handleEditPatient(patient.id)}
                onView={() => handleViewMedicalInfo(patient.id)}
              />
            ))
          )}

          {/* Paginación simple en móvil */}
          {pagination.pages > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() =>
                  handleTableParamsChange({
                    page: Math.max(1, currentPage - 1),
                  })
                }
                style={{ flex: 1 }}
              >
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage >= pagination.pages}
                onClick={() =>
                  handleTableParamsChange({ page: currentPage + 1 })
                }
                style={{ flex: 1 }}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      ) : (
        // ── Vista desktop: tabla ───────────────────────────────────────────────
        <DataTable<Patient>
          key={`patients-table-${searchVersion}`}
          columns={columns}
          data={isLoading ? [] : searchResults}
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
          getRowKey={(patient) => String(patient.id)}
          isServerSide
          onServerParamsChange={handleTableParamsChange}
          pageSize={DEFAULT_PAGE_SIZE}
          rowActions={(patient) => [
            {
              icon: <Edit size={14} />,
              label: "Editar paciente",
              onClick: () => handleEditPatient(patient.id),
            },
            {
              icon: <Eye size={14} />,
              label: "Ver información médica",
              onClick: () => handleViewMedicalInfo(patient.id),
            },
          ]}
          searchable={false}
          title={
            hasSearched ? "Resultados de búsqueda" : "Listado de pacientes"
          }
          totalRecords={pagination.total}
        />
      )}
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
      }}
      title="Abrir perfil del paciente"
    >
      {name}
    </button>
  );
}
