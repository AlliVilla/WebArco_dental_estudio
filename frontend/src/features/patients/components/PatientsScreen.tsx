import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FileText, Pencil, Plus, Search, X } from "lucide-react";

import { DataTable } from "../../../components";
import type { Column } from "../../../components";
import { Alert, Button, Card, Input } from "../../../context";
import { DEFAULT_PAGE_SIZE, PATIENT_SYSTEMIC_DISEASES } from "../../../config/constants";
import api from "../../../services/api";
import { formatDate } from "../../../utils/formatters";

type Patient = {
  id: number;
  code: string;
  fullName: string;
  identity: string;
  phone: string;
  lastVisit: string | null;
  enfermedades?: string | null;
  otras_enfermedades?: string | null;
  medicamentos?: string | null;
  alergias?: string | null;
  reaccion_anestesia?: string | null;
};

type PersonaApi = {
  id_persona: number;
  primer_nombre?: string | null;
  segundo_nombre?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
  numero_identidad: string;
  telefono: string;
  ultima_visita?: string | null;
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
    lastVisit: persona.ultima_visita ?? null,
    enfermedades: persona.enfermedades || null,
    otras_enfermedades: persona.otras_enfermedades || null,
    medicamentos: persona.medicamentos || null,
    alergias: persona.alergias || null,
    reaccion_anestesia: persona.reaccion_anestesia || null,
  };
};

function PatientNameButton({
  name,
  onClick,
}: {
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        color: "var(--arco-primary)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 500,
        padding: 0,
        textAlign: "left",
      }}
      type="button"
    >
      {name || "Sin nombre registrado"}
    </button>
  );
}

export function PatientsScreen({
  onViewProfile,
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
  const [selectedMedicalPatient, setSelectedMedicalPatient] = useState<Patient | null>(null);
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

  const hasAnyFilter = Boolean(
    searchName || searchIdentity || searchPhone || searchCode,
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
          },
        );
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

  const handleCreatePatient = () => {
    if (onCreatePatient) {
      onCreatePatient();
      return;
    }

    navigate("/patients/new");
  };

  const handleEditPatient = (id: number) => {
    if (onEditPatient) {
      onEditPatient(id);
      return;
    }

    navigate(`/patients/edit/${id}`);
  };

  const handleViewProfile = (patient: Patient) => {
    if (onViewProfile) {
      onViewProfile();
      return;
    }

    navigate(`/patients/profile/${patient.id}`);
  };

  const handleViewMedicalInfo = (patient: Patient) => {
    onViewPatient?.(patient.id);
    setSelectedMedicalPatient(patient);
  };

  const handleTableParamsChange = useCallback(
    ({ page }: { page: number }) => {
      if (page === currentPage) return;

      setIsLoading(true);
      setError("");
      setCurrentPage(page);
    },
    [currentPage],
  );

  const columns: Column<Patient>[] = [
    { key: "code", label: "Código del paciente", width: 150 },
    {
      key: "fullName",
      label: "Nombre completo",
      render: (_value, patient) => (
        <PatientNameButton
          name={patient.fullName}
          onClick={() => handleViewProfile(patient)}
        />
      ),
    },
    { key: "identity", label: "Identidad", width: 160 },
    { key: "phone", label: "Teléfono", width: 160 },
    {
      key: "lastVisit",
      label: "Fecha última visita",
      width: 170,
      render: (_value, patient) =>
        patient.lastVisit ? formatDate(patient.lastVisit) : "Sin visitas",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h3
              style={{
                color: "var(--arco-navy)",
                fontSize: 18,
                fontWeight: 600,
                margin: 0,
              }}
            >
              Búsqueda de pacientes
            </h3>
            <p
              style={{
                color: "var(--arco-gray-500)",
                fontSize: 13,
                margin: "6px 0 0",
              }}
            >
              Busca pacientes por nombre, identidad, teléfono o código interno.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            <Input
              label="Nombre"
              placeholder="Nombre del paciente"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
            />
            <Input
              label="Identidad"
              placeholder="0801199012345"
              value={searchIdentity}
              onChange={(event) => setSearchIdentity(event.target.value)}
            />
            <Input
              label="Teléfono"
              placeholder="98765432"
              value={searchPhone}
              onChange={(event) => setSearchPhone(event.target.value)}
            />
            <Input
              label="Código"
              placeholder="PAC-000001"
              value={searchCode}
              onChange={(event) => setSearchCode(event.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button
              disabled={!hasAnyFilter && !hasSearched}
              onClick={handleClear}
              type="button"
              variant="secondary"
            >
              Limpiar
            </Button>
            <Button
              disabled={!hasAnyFilter}
              onClick={handleSearch}
              type="button"
              variant="primary"
            >
              <Search size={16} />
              Buscar
            </Button>
          </div>
        </div>
      </Card>

      {error ? <Alert variant="error" message={error} /> : null}

      <DataTable<Patient>
        key={hasSearched ? JSON.stringify(activeFilters) : "all-patients"}
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
        primaryAction={{
          label: "Crear nuevo paciente",
          icon: <Plus size={16} />,
          onClick: handleCreatePatient,
        }}
        rowActions={(patient) => [
          {
            icon: <Eye size={16} />,
            label: "Ver perfil",
            onClick: () => handleViewProfile(patient),
          },
          {
            icon: <Pencil size={16} />,
            label: "Editar paciente",
            onClick: () => handleEditPatient(patient.id),
          },
          {
            icon: <FileText size={16} />,
            label: "Ver información médica",
            onClick: () => handleViewMedicalInfo(patient),
          },
        ]}
        searchable={false}
        title={hasSearched ? "Resultados de búsqueda" : "Listado de pacientes"}
        totalRecords={pagination.total}
      />

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
  const enfermedadesStr = patient.enfermedades;
  let enfermedadesList: string[] = [];

  try {
    if (enfermedadesStr) {
      enfermedadesList = JSON.parse(enfermedadesStr) as string[];
    }
  } catch {
    enfermedadesList = [];
  }

  const otrasEnfermedades = patient.otras_enfermedades;
  const medicamentos = patient.medicamentos;
  const alergias = patient.alergias;
  const reaccionAnestesia = patient.reaccion_anestesia;

  const hasMedicalInfo = Boolean(
    enfermedadesList.length > 0 ||
      otrasEnfermedades ||
      medicamentos ||
      alergias ||
      reaccionAnestesia,
  );

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
          background: "var(--card)",
          border: "1px solid var(--border)",
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
                color: "var(--foreground)",
                fontSize: 18,
                fontWeight: 600,
                margin: 0,
              }}
            >
              Información médica
            </h3>
            <p
              style={{
                color: "var(--arco-gray-500)",
                fontSize: 13,
                margin: "4px 0 0",
              }}
            >
              {patient.fullName} · {patient.code}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              alignItems: "center",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
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

        {hasMedicalInfo ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxHeight: "60vh",
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {enfermedadesList.length > 0 ? (
              <div>
                <strong
                  style={{
                    color: "var(--foreground)",
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Enfermedades sistémicas:
                </strong>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {enfermedadesList.map((disease) => {
                    const matched = PATIENT_SYSTEMIC_DISEASES.find(
                      (item) => item.id === disease,
                    );

                    return (
                      <span
                        key={disease}
                        style={{
                          background: "var(--arco-primary-light)",
                          borderRadius: 20,
                          color: "var(--arco-primary)",
                          fontSize: 12,
                          fontWeight: 500,
                          padding: "4px 10px",
                        }}
                      >
                        {matched?.label || disease}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {otrasEnfermedades ? (
              <MedicalInfoText title="Otras enfermedades" value={otrasEnfermedades} />
            ) : null}

            {medicamentos ? (
              <MedicalInfoText title="Medicamentos actuales" value={medicamentos} />
            ) : null}

            {alergias ? (
              <MedicalInfoText title="Alergias a medicamentos" value={alergias} />
            ) : null}

            {reaccionAnestesia ? (
              <div>
                <strong
                  style={{
                    color: "var(--foreground)",
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Historial de anestesia:
                </strong>
                <span
                  style={{
                    background:
                      reaccionAnestesia === "si"
                        ? "var(--arco-primary-light)"
                        : "var(--arco-gray-100)",
                    borderRadius: 8,
                    color:
                      reaccionAnestesia === "si"
                        ? "var(--arco-danger)"
                        : "var(--arco-success)",
                    display: "inline-block",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                  }}
                >
                  {reaccionAnestesia === "si"
                    ? "Sí, ha tenido reacciones a la anestesia"
                    : "No ha tenido reacciones a la anestesia"}
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          <div
            style={{
              background: "var(--arco-gray-50)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--arco-gray-500)",
              fontSize: 13,
              padding: "24px 16px",
              textAlign: "center",
            }}
          >
            Sin información médica registrada para este paciente.
          </div>
        )}

        <p
          style={{
            color: "var(--arco-gray-500)",
            fontSize: 12,
            margin: "16px 0 0",
          }}
        >
          Los antecedentes médicos iniciales se guardan en el perfil del paciente.
        </p>
      </div>
    </div>
  );
}

function MedicalInfoText({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>
      <strong
        style={{
          color: "var(--foreground)",
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {title}:
      </strong>
      <p
        style={{
          background: "var(--arco-gray-50)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          color: "var(--arco-gray-700)",
          fontSize: 13,
          margin: 0,
          padding: "8px 12px",
        }}
      >
        {value}
      </p>
    </div>
  );
}