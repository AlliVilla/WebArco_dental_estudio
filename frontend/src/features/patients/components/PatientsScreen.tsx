import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Eye,
  Hash,
  IdCard,
  Phone,
  Plus,
  Search,
  User,
  X,
} from "lucide-react";
import { DataTable } from "../../../components";
import type { Column } from "../../../components";
import { Alert, Button, Card, Input } from "../../../context";
import { DEFAULT_PAGE_SIZE } from "../../../config/constants";
import api from "../../../services/api";
import { formatDate } from "../../../utils/formatters";

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
  };
};

export function PatientsScreen({
  onCreatePatient,
  onEditPatient,
  onViewPatient,
}: PatientsScreenProps) {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState("");
  const [searchIdentity, setSearchIdentity] = useState("");
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

  const hasAnyFilter = Boolean(
    searchName.trim() || searchIdentity.trim() || searchPhone.trim() || searchCode.trim(),
  );

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError("");

    api.get<PersonasListResponse>("/persona", {
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
        setPagination(response.data?.pagination ?? {
          total: patients.length,
          page: currentPage,
          limit: DEFAULT_PAGE_SIZE,
          pages: Math.max(1, Math.ceil(patients.length / DEFAULT_PAGE_SIZE)),
        });
      })
      .catch((requestError: { message?: string }) => {
        if (ignore) return;
        setError(requestError.message ?? "No se pudieron cargar los pacientes.");
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
      nombre: searchName.trim(),
      identidad: searchIdentity.replace(/\D/g, ""),
      telefono: searchPhone.replace(/\D/g, ""),
      codigo: searchCode.replace(/^PAC-/i, "").replace(/\D/g, ""),
    });
    setSearchVersion((v) => v + 1);
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

  const handleTableParamsChange = useCallback(({ page }: { page: number }) => {
    if (page === currentPage) return;
    setIsLoading(true);
    setError("");
    setCurrentPage(page);
  }, [currentPage]);

  const columns: Column<Patient>[] = [
    {
      key: "code",
      label: "Código del paciente",
      width: 160,
      render: (_value, patient) => (
        <span style={{ color: "var(--arco-primary)", fontSize: 13, fontWeight: 500 }}>
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
      label: "Fecha última visita",
      width: 170,
      render: (_value, patient) => patient.lastVisit ? formatDate(patient.lastVisit) : "Sin visitas",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
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
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Button
            variant="primary"
            onClick={handleSearch}
            disabled={!hasAnyFilter || isLoading}
            style={{ flex: "1 1 220px" }}
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

      <DataTable<Patient>
        key={`patients-table-${searchVersion}`}
        columns={columns}
        data={isLoading ? [] : searchResults}
        description={
          isLoading
            ? "Cargando pacientes registrados..."
            : hasSearched
              ? `${pagination.total} resultado${pagination.total === 1 ? "" : "s"} encontrados`
              : `Total de ${pagination.total} pacientes registrados`
        }
        emptyMessage={isLoading ? "Cargando pacientes..." : "No hay pacientes para mostrar."}
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
        title={hasSearched ? "Resultados de búsqueda" : "Listado de pacientes"}
        totalRecords={pagination.total}
      />

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
