/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NuevaVisita } from "./NewVisit";
import {
  Plus,
  ArrowLeft,
  Paperclip,
  CheckCircle,
  DollarSign,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { DataTable, StatsDrawer } from "../../../../../components";
import type { Column } from "../../../../../components";
import { Alert, Card, Button, useTheme } from "../../../../../context";
import { expedientService } from "../services/expedientService";
import { calcularEdad } from "../services/miscelaneousService";
import type { ExpedientePaciente } from "../types/index";
import { useResponsive } from "../../../../../hooks/useWindowWidth";
import { normalizeSearch } from "../../../../../utils/formatters";

const C: Record<string, string> = {};

// ─── Card de paciente para móvil ──────────────────────────────────────────────
function PatientCard({
  exp,
  onClick,
}: {
  exp: ExpedientePaciente;
  onClick: () => void;
}) {
  const hasPending = exp.consultas.some(
    (c) => !c.firma_paciente || !c.firma_doctor_snapshot
  );
  const nombre = [
    exp.primer_nombre,
    exp.segundo_nombre,
    exp.primer_apellido,
    exp.segundo_apellido,
  ]
    .filter(Boolean)
    .join(" ");
  const initials = `${exp.primer_nombre?.[0] ?? ""}${
    exp.primer_apellido?.[0] ?? ""
  }`.toUpperCase();
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #D3D7DA",
        padding: 16,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#0BC5DF",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#203F49",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nombre}
            </p>
            <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
              {exp.numero_identidad}
            </p>
          </div>
        </div>
        <ChevronRight
          size={16}
          style={{ color: "#888F94", flexShrink: 0, marginTop: 2 }}
        />
      </div>
      <div
        style={{
          borderTop: "1px solid #F8F9FA",
          paddingTop: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "#888F94" }}>
          {exp.consultas.length} visita{exp.consultas.length !== 1 ? "s" : ""}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 12,
            background: hasPending ? "#FFFBEB" : "#E8F7F2",
            color: hasPending ? "#D97706" : "#1D9E75",
          }}
        >
          {hasPending ? "Firma pendiente" : "Al día"}
        </span>
      </div>
    </div>
  );
}

export function ExpedienteScreen() {
  useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const mountedRef = useRef(true);

  const [viewState, setViewState] = useState<"list" | "detail" | "new-visit">(
    "list"
  );
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null
  );
  const [expedientes, setExpedientes] = useState<ExpedientePaciente[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [openDrawer, setOpenDrawer] = useState<
    "visitas" | "completadas" | "firmas" | null
  >(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const selectedPatientFromQuery = useMemo(() => {
    const queryPatientId = new URLSearchParams(location.search).get(
      "patientId"
    );
    const parsedId = Number(queryPatientId);
    return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
  }, [location.search]);

  // Fix: try/catch + isMounted
  const loadPatients = useCallback(async () => {
    let isMounted = true;
    setLoading(true);
    setError("");
    try {
      const res = await expedientService.getAll({
        page: 1,
        limit: 1000,
        search: "",
        includeConsulta: true,
      });
      if (!isMounted) return;
      if (res.success) {
        setExpedientes(res.data.data);
      } else {
        setError(res.message);
      }
    } catch (err: unknown) {
      if (!isMounted) return;
      if (import.meta.env.DEV) console.error("[ExpedienteScreen]", err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los expedientes."
      );
    } finally {
      if (isMounted) setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (!selectedPatientFromQuery || expedientes.length === 0) return;
    const exists = expedientes.some(
      (p) => p.id_persona === selectedPatientFromQuery
    );
    if (exists) {
      setSelectedPatientId(selectedPatientFromQuery);
      setViewState("detail");
    }
  }, [expedientes, selectedPatientFromQuery]);

  const totalVisitas = useMemo(
    () => expedientes.reduce((acc, e) => acc + (e.consultas.length ?? 0), 0),
    [expedientes]
  );
  const completadas = useMemo(
    () => expedientes.reduce((acc, e) => acc + (e.consultas?.length ?? 0), 0),
    [expedientes]
  );
  const firmasDigitales = useMemo(
    () =>
      expedientes.reduce(
        (acc, e) =>
          acc +
          (e.consultas?.filter(
            (c) => c.firma_paciente && c.firma_doctor_snapshot
          ).length ?? 0),
        0
      ),
    [expedientes]
  );

  const activePatient = expedientes.find(
    (e) => e.id_persona === selectedPatientId
  );

  const [expandedVisits, setExpandedVisits] = useState<Record<number, boolean>>(
    {}
  );
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  useEffect(() => {
    if (activePatient && activePatient.consultas.length > 0) {
      setExpandedVisits({ [activePatient.consultas[0].id_consulta]: true });
    } else {
      setExpandedVisits({});
    }
  }, [selectedPatientId, activePatient]);

  const toggleVisit = (id: number) =>
    setExpandedVisits((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSelectPatient = (id: number) => {
    setSelectedPatientId(id);
    setViewState("detail");
  };
  const handleNewVisitSave = () => setViewState("detail");
  const handleNewVisitBack = () => setViewState("detail");

  const columns: Column<ExpedientePaciente>[] = [
    {
      key: "nombre",
      label: "Paciente",
      render: (_, row) => (
        <span
          onClick={() => handleSelectPatient(row.id_persona)}
          style={{
            fontWeight: 600,
            color: "var(--arco-primary, #0BC5DF)",
            cursor: "pointer",
          }}
        >
          {[
            row.primer_nombre,
            row.segundo_nombre,
            row.primer_apellido,
            row.segundo_apellido,
          ]
            .filter(Boolean)
            .join(" ")}
        </span>
      ),
    },
    { key: "numero_identidad", label: "Identidad" },
    { key: "telefono", label: "Teléfono" },
    {
      key: "ultimaVisita",
      label: "Última Visita",
      render: (_, row) => {
        const uc = row.consultas?.[0];
        return (
          <span
            style={{ fontWeight: 600, color: "var(--foreground, #203F49)" }}
          >
            {uc ? (
              new Date(uc.fecha_fin ?? uc.fecha_inicio).toLocaleDateString(
                "es-HN"
              )
            ) : (
              <span style={{ color: "#888F94", fontWeight: 400 }}>
                Sin visitas
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "totalVisitas",
      label: "Visitas",
      align: "center",
      render: (_, row) => (
        <span style={{ fontWeight: 600, color: "var(--foreground, #203F49)" }}>
          {row.consultas.length}
        </span>
      ),
    },
    {
      key: "firmas",
      label: "Firmas",
      render: (_, row) => {
        const hasPending = row.consultas.some(
          (c) => !c.firma_paciente || !c.firma_doctor_snapshot
        );
        return hasPending ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 500,
              background: "rgba(239,159,39,0.12)",
              color: "var(--arco-warning, #EF9F27)",
            }}
          >
            Pendientes
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 500,
              background: "#E8F7F2",
              color: "var(--arco-success, #1D9E75)",
            }}
          >
            <CheckCircle size={10} /> Al día
          </span>
        );
      },
    },
  ];

  const getRowActions = (row: ExpedientePaciente) => [
    {
      icon: <ChevronRight size={16} />,
      label: "Ver Expediente",
      onClick: () => handleSelectPatient(row.id_persona),
    },
  ];

  const kpiCols = isMobile || isTablet ? "1fr 1fr" : "repeat(3, 1fr)";
  const showCards = isMobile || isTablet;

  // Búsqueda para vista móvil/tablet
  const [mobileSearch, setMobileSearch] = useState("");
  const filteredExps = useMemo(
    () =>
      !mobileSearch
        ? expedientes
        : expedientes.filter((e) => {
            const nombre = [
              e.primer_nombre,
              e.segundo_nombre,
              e.primer_apellido,
              e.segundo_apellido,
            ]
              .filter(Boolean)
              .join(" ");
            return (
              normalizeSearch(nombre).includes(normalizeSearch(mobileSearch)) ||
              e.numero_identidad.includes(mobileSearch) ||
              e.telefono.includes(mobileSearch)
            );
          }),
    [expedientes, mobileSearch]
  );

  // Datos para drawers
  const drawerConfigs = [
    {
      key: "visitas" as const,
      title: "Total Visitas",
      subtitle: "Todas las visitas registradas",
      value: totalVisitas,
      color: "#0BC5DF",
      border: "rgba(11,197,223,0.24)",
      items: expedientes.filter((e) => e.consultas.length > 0),
    },
    {
      key: "completadas" as const,
      title: "Completadas",
      subtitle: "Consultas completadas",
      value: completadas,
      color: "#1D9E75",
      border: "rgba(29,158,117,0.24)",
      items: expedientes.filter((e) => e.consultas.length > 0),
    },
    {
      key: "firmas" as const,
      title: "Firmas Digitales",
      subtitle: "Consultas con firma completa",
      value: firmasDigitales,
      color: "#EF9F27",
      border: "rgba(239,159,39,0.24)",
      items: expedientes.filter((e) =>
        e.consultas.some((c) => c.firma_paciente && c.firma_doctor_snapshot)
      ),
    },
  ];

  return (
    <div
      style={{
        background: "#F8F9FA",
        minHeight: "calc(100vh - 110px)",
        boxSizing: "border-box",
      }}
    >
      {error && (
        <Alert variant="error" message={error} onClose={() => setError("")} />
      )}

      {/* ── VISTA 1: Lista ── */}
      {viewState === "list" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 16 : 20,
          }}
        >
          {/* KPIs clicables */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: kpiCols,
              gap: isMobile ? 10 : 16,
            }}
          >
            {drawerConfigs.map((kpi) => (
              <button
                key={kpi.key}
                onClick={() => setOpenDrawer(kpi.key)}
                style={{
                  border: `1.5px solid ${kpi.border}`,
                  background: "#fff",
                  borderRadius: 12,
                  padding: isMobile ? "14px 16px" : "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: kpi.color,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  {kpi.title}
                </span>
                <span
                  style={{
                    fontSize: isMobile ? 22 : 28,
                    fontWeight: 700,
                    color: "#203F49",
                    marginTop: 8,
                    lineHeight: 1,
                  }}
                >
                  {kpi.value}
                </span>
              </button>
            ))}
          </div>

          {/* Tabla / Cards */}
          {showCards ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Buscador móvil */}
              <input
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                placeholder="Buscar por nombre, identidad o teléfono..."
                style={{
                  width: "100%",
                  height: 42,
                  padding: "0 12px",
                  border: "1px solid #D3D7DA",
                  borderRadius: 8,
                  background: "#F5F7FA",
                  fontSize: 13,
                  color: "#203F49",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {loading ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "#888F94",
                    fontSize: 14,
                    padding: 24,
                  }}
                >
                  Cargando expedientes...
                </p>
              ) : filteredExps.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "#888F94",
                    fontSize: 14,
                    padding: 24,
                  }}
                >
                  {mobileSearch
                    ? "No hay resultados."
                    : "No hay expedientes registrados."}
                </p>
              ) : (
                filteredExps.map((exp) => (
                  <PatientCard
                    key={exp.id_persona}
                    exp={exp}
                    onClick={() => handleSelectPatient(exp.id_persona)}
                  />
                ))
              )}
            </div>
          ) : (
            <DataTable<ExpedientePaciente>
              title="Expedientes Clínicos"
              description={
                loading
                  ? "Cargando pacientes..."
                  : `Total de ${expedientes.length} pacientes registrados`
              }
              emptyMessage={
                loading
                  ? "Cargando pacientes..."
                  : "No hay pacientes para mostrar."
              }
              columns={columns}
              data={expedientes}
              searchable
              searchPlaceholder="Buscar por nombre, identidad o teléfono..."
              searchKeys={[
                "primer_nombre",
                "segundo_nombre",
                "primer_apellido",
                "segundo_apellido",
                "numero_identidad",
                "telefono",
              ]}
              getRowKey={(row) => String(row.id_persona)}
              rowActions={getRowActions}
            />
          )}
        </div>
      )}

      {/* ── VISTA 2: Detalle ── */}
      {viewState === "detail" && activePatient && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 16 : 20,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Button
              onClick={() => {
                selectedPatientFromQuery
                  ? navigate(`/patients/profile/${selectedPatientFromQuery}`)
                  : setViewState("list");
              }}
              variant="ghost"
              size="sm"
              style={{ color: C.gray500 }}
            >
              <ArrowLeft size={16} />{" "}
              {selectedPatientFromQuery
                ? "Volver al perfil"
                : "Volver a expedientes"}
            </Button>
            <Button
              onClick={() => setViewState("new-visit")}
              variant="primary"
              size="sm"
            >
              <Plus size={16} />{" "}
              {isMobile ? "Nueva visita" : "Registrar Nueva Visita"}
            </Button>
          </div>

          {/* Info del paciente */}
          <Card
            style={{
              padding: isMobile ? 16 : 24,
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: isMobile ? 12 : 24,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: isMobile ? 52 : 72,
                  height: isMobile ? 52 : 72,
                  borderRadius: "50%",
                  background: "#0BC5DF",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? 18 : 22,
                  fontWeight: 700,
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(11,197,223,0.16)",
                }}
              >
                {`${activePatient.primer_nombre?.[0] ?? ""}${
                  activePatient.primer_apellido?.[0] ?? ""
                }`.toUpperCase() || "P"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: isMobile ? 16 : 20,
                      fontWeight: 700,
                      color: "#203F49",
                    }}
                  >
                    {[
                      activePatient.primer_nombre,
                      activePatient.segundo_nombre,
                      activePatient.primer_apellido,
                      activePatient.segundo_apellido,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </h2>
                  <span
                    style={{
                      background: "#E6F8FB",
                      border: "1px solid rgba(11,197,223,0.4)",
                      color: "#0BC5DF",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 10px",
                      borderRadius: 20,
                    }}
                  >
                    # PAC-{String(activePatient.id_persona).padStart(6, "0")}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px 14px",
                    fontSize: 13,
                    color: "#5F656A",
                    marginTop: 8,
                  }}
                >
                  <span>
                    {calcularEdad(activePatient.fecha_nacimiento)} años ·{" "}
                    {activePatient.sexo === "F" ? "Femenino" : "Masculino"}
                  </span>
                  <span>+504 {activePatient.telefono}</span>
                  {activePatient.correo_electronico && (
                    <span>{activePatient.correo_electronico}</span>
                  )}
                  <span>
                    {activePatient.municipio.nombre},{" "}
                    {activePatient.municipio.departamento.nombre}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#5F656A", marginTop: 6 }}>
                  Última visita:{" "}
                  {activePatient.consultas?.[0]
                    ? new Date(
                        activePatient.consultas[0].fecha_fin ??
                          activePatient.consultas[0].fecha_inicio
                      ).toLocaleString("es-HN")
                    : "Sin visitas registradas"}
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline de visitas */}
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: C.navy,
                marginBottom: 16,
              }}
            >
              Historial de Visitas y Consultas
            </h3>
            {activePatient.consultas.length === 0 ? (
              <div
                style={{
                  border: "2px dashed rgb(11,197,223)",
                  borderRadius: 12,
                  padding: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 8,
                  background: "rgba(11,197,223,0.03)",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgb(11,197,223)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Sin Visitas Registradas
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "rgb(136,143,148)",
                    textAlign: "center",
                  }}
                >
                  El cliente no tiene ninguna visita realizada
                </span>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {activePatient.consultas.map((visit) => {
                  const isExpanded = !!expandedVisits[visit.id_consulta];
                  const totalCosto = visit.tratamientos.reduce(
                    (sum, t) => sum + Number(t.precio),
                    0
                  );
                  return (
                    <div
                      key={visit.id_consulta}
                      style={{
                        background: C.white,
                        borderRadius: 12,
                        border: `1.5px solid ${
                          isExpanded
                            ? "#0BC5DF"
                            : hoveredCardId === visit.id_consulta
                            ? "rgba(11,197,223,0.4)"
                            : C.gray300
                        }`,
                        padding: isMobile ? "14px 16px" : "20px 24px",
                        display: "flex",
                        flexDirection: "column",
                        transition:
                          "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
                        boxShadow: isExpanded
                          ? "0 10px 20px -5px rgba(11,197,223,0.08)"
                          : hoveredCardId === visit.id_consulta
                          ? "0 4px 12px rgba(0,0,0,0.04)"
                          : "none",
                        transform:
                          hoveredCardId === visit.id_consulta
                            ? "translateY(-2px)"
                            : "none",
                      }}
                      onMouseEnter={() => setHoveredCardId(visit.id_consulta)}
                      onMouseLeave={() => setHoveredCardId(null)}
                    >
                      {/* Header del acordeón */}
                      <div
                        onClick={() => toggleVisit(visit.id_consulta)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                          userSelect: "none",
                          paddingBottom: isExpanded ? 16 : 0,
                          borderBottom: isExpanded
                            ? `1.5px solid ${C.gray100}`
                            : "1.5px solid transparent",
                          transition:
                            "padding-bottom 0.25s, border-bottom-color 0.25s",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: isMobile ? 8 : 12,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: isExpanded ? "#0BC5DF" : "#D3D7DA",
                              flexShrink: 0,
                              boxShadow: isExpanded
                                ? "0 0 8px #0BC5DF"
                                : "none",
                            }}
                          />
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: C.navy,
                            }}
                          >
                            {new Date(
                              visit.fecha_fin ?? visit.fecha_inicio
                            ).toLocaleDateString("es-HN")}
                          </span>
                          {!isMobile && (
                            <span style={{ fontSize: 13, color: C.gray500 }}>
                              · Atendido por:{" "}
                              <strong
                                style={{ color: C.navy, fontWeight: 600 }}
                              >
                                {visit.id_usuario}
                              </strong>
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: isMobile ? 6 : 12,
                            flexShrink: 0,
                          }}
                        >
                          {visit.firma_paciente &&
                          visit.firma_doctor_snapshot ? (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "4px 10px",
                                borderRadius: 12,
                                background: "#E6F8FB",
                                color: "#0BC5DF",
                                border: "1px solid rgba(11,197,223,0.2)",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Firmado
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "4px 10px",
                                borderRadius: 12,
                                background: "#FFFBEB",
                                color: "#D97706",
                                border: "1px solid rgba(217,119,6,0.2)",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              Firma Pendiente
                            </span>
                          )}
                          <div
                            style={{
                              transform: isExpanded
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                              transition:
                                "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
                              color: isExpanded ? "#0BC5DF" : C.gray500,
                              display: "flex",
                            }}
                          >
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </div>

                      {/* Contenido expandible */}
                      <div
                        style={{
                          maxHeight: isExpanded ? "1200px" : "0px",
                          opacity: isExpanded ? 1 : 0,
                          overflow: "hidden",
                          transition:
                            "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s, padding-top 0.4s",
                          display: "flex",
                          flexDirection: "column",
                          gap: 20,
                          paddingTop: isExpanded ? 16 : 0,
                        }}
                      >
                        {isMobile && (
                          <div style={{ fontSize: 12, color: C.gray500 }}>
                            Atendido por:{" "}
                            <strong style={{ color: C.navy }}>
                              {visit.id_usuario}
                            </strong>
                          </div>
                        )}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: isMobile
                              ? "1fr"
                              : "repeat(auto-fit, minmax(280px, 1fr))",
                            gap: 16,
                            background: "#F8F9FA",
                            borderRadius: 10,
                            padding: isMobile ? 14 : 20,
                            border: `1px solid ${C.gray100}`,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                color: C.gray500,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.8px",
                                marginBottom: 6,
                              }}
                            >
                              Motivo de consulta
                            </div>
                            <div
                              style={{
                                fontSize: 13.5,
                                color: C.navy,
                                fontWeight: 500,
                                lineHeight: 1.5,
                              }}
                            >
                              {visit.motivo}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                color: C.gray500,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.8px",
                                marginBottom: 6,
                              }}
                            >
                              Diagnóstico de evolución
                            </div>
                            <div
                              style={{
                                fontSize: 13.5,
                                color: C.navy,
                                lineHeight: 1.5,
                              }}
                            >
                              {visit.diagnostico}
                            </div>
                          </div>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <div
                              style={{
                                fontSize: 11,
                                color: C.gray500,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.8px",
                                marginBottom: 6,
                              }}
                            >
                              Notas clínicas
                            </div>
                            <div
                              style={{
                                fontSize: 13.5,
                                color: C.gray700,
                                lineHeight: 1.5,
                                whiteSpace: "pre-line",
                              }}
                            >
                              {visit.notas}
                            </div>
                          </div>
                        </div>

                        {visit.tratamientos.length > 0 && (
                          <div
                            style={{
                              background: "#fff",
                              borderRadius: 10,
                              padding: isMobile ? 14 : 18,
                              border: "1.5px solid rgba(11,197,223,0.15)",
                              boxShadow: "0 2px 8px rgba(11,197,223,0.03)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                color: "#0BC5DF",
                                fontWeight: 700,
                                marginBottom: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}
                            >
                              <DollarSign size={14} /> Tratamientos y Cobros
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                              }}
                            >
                              {visit.tratamientos.map((t, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 13,
                                    color: C.navy,
                                    paddingBottom: 8,
                                    borderBottom: `1px solid ${C.gray100}`,
                                  }}
                                >
                                  <span style={{ fontWeight: 500 }}>
                                    {t.tratamiento.nombre}
                                  </span>
                                  <span style={{ fontWeight: 600 }}>
                                    L.{" "}
                                    {t.precio.toLocaleString("es-HN", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              ))}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  color: C.navy,
                                  paddingTop: 6,
                                }}
                              >
                                <span>Total de la visita</span>
                                <span
                                  style={{ color: "#0BC5DF", fontSize: 14.5 }}
                                >
                                  L.{" "}
                                  {totalCosto.toLocaleString("es-HN", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {visit?.archivos?.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                color: C.gray500,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.8px",
                                marginBottom: 10,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              Archivos y Radiografías
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                flexWrap: "wrap",
                              }}
                            >
                              {visit.archivos.map((archivo, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    background: "#fff",
                                    border: `1.5px solid ${C.gray100}`,
                                    borderRadius: 8,
                                    padding: "8px 14px",
                                    fontSize: 12.5,
                                    color: C.navy,
                                    cursor: "pointer",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.borderColor =
                                      "#0BC5DF")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.borderColor =
                                      C.gray100)
                                  }
                                >
                                  <Paperclip size={13} color={C.gray500} />
                                  <span style={{ fontWeight: 500 }}>
                                    {archivo.nombre}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      background: "#E6F8FB",
                                      color: "#0BC5DF",
                                      padding: "2px 8px",
                                      borderRadius: 4,
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {archivo.categoria.split(" ")[1] ||
                                      archivo.categoria}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VISTA 3: Nueva visita ── */}
      {viewState === "new-visit" && activePatient && (
        <NuevaVisita
          patient={activePatient}
          onBack={handleNewVisitBack}
          onSave={handleNewVisitSave}
        />
      )}

      {/* ── Drawers de KPIs ── */}
      {drawerConfigs.map(({ key, title, subtitle, items }) => (
        <StatsDrawer
          key={key}
          open={openDrawer === key}
          title={title}
          subtitle={subtitle}
          onClose={() => setOpenDrawer(null)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#888F94",
                  fontSize: 14,
                  padding: 24,
                }}
              >
                No hay registros en esta categoría.
              </p>
            ) : (
              items.map((exp) => {
                const nombre = [
                  exp.primer_nombre,
                  exp.segundo_nombre,
                  exp.primer_apellido,
                  exp.segundo_apellido,
                ]
                  .filter(Boolean)
                  .join(" ");
                const initials = `${exp.primer_nombre?.[0] ?? ""}${
                  exp.primer_apellido?.[0] ?? ""
                }`.toUpperCase();
                return (
                  <div
                    key={exp.id_persona}
                    onClick={() => {
                      handleSelectPatient(exp.id_persona);
                      setOpenDrawer(null);
                    }}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #D3D7DA",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: "#E6F8FB",
                        color: "#0BC5DF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#203F49",
                          margin: 0,
                        }}
                      >
                        {nombre}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#888F94",
                          margin: "2px 0 0",
                        }}
                      >
                        {exp.consultas.length} visita
                        {exp.consultas.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronRight
                      size={14}
                      style={{ color: "#888F94", flexShrink: 0 }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </StatsDrawer>
      ))}
    </div>
  );
}
