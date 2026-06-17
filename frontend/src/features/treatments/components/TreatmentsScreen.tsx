import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2, X } from "lucide-react";
import { Alert, Button, Toggle } from "../../../context";
import { DataTable, type Column, ConfirmModal } from "../../../components";
import {
  treatmentService,
  especialidadService,
} from "../services/treatmentService";
import { type Treatment, type Especialidad } from "../types";
import { useAuthStore } from "../../../features/auth/hooks/useAuthStore";
import { useResponsive } from "../../../hooks/useWindowWidth";
import { matchesNormalizedSearch, formatCurrency } from "../../../utils/formatters";
import { Z } from "../../../utils/zIndex";

function useHasPrivilege(privilegeIds: number[]) {
  const user = useAuthStore((state) => state.user);
  return useMemo(() => {
    if (!user?.privilegios) return false;
    return privilegeIds.some((id) => user.privilegios?.includes(id));
  }, [user?.privilegios]);
}

// ─── Card móvil ───────────────────────────────────────────────────────────────
function TreatmentCard({
  treatment,
  canManage,
  onView,
  onEdit,
  onDelete,
  onToggle,
}: {
  treatment: Treatment;
  canManage: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
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
      {/* Header: nombre + especialidad + botón editar */}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
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
              {treatment.nombre}
            </p>
            {!treatment.activo && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "#FEF2F2",
                  color: "#E24B4A",
                }}
              >
                Inactivo
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
            {treatment.especialidad}
          </p>
        </div>
        {canManage && (
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
        )}
      </div>

      {/* Filas de datos */}
      <div style={{ borderTop: "1px solid #F8F9FA", paddingTop: 4 }}>
        <div
          style={{
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Precio</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#203F49" }}>
            {formatCurrency(treatment.precio)}
          </span>
        </div>
        <div
          style={{
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Especialidad</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: 12,
              background: "var(--primary-light, #E6F8FB)",
              color: "var(--primary, #0BC5DF)",
            }}
          >
            {treatment.especialidad}
          </span>
        </div>
        <div
          style={{
            padding: "7px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Estado</span>
          {canManage ? (
            <Toggle checked={treatment.activo} onChange={onToggle} />
          ) : (
            <span
              style={{
                fontSize: 12,
                color: treatment.activo ? "#1D9E75" : "#E24B4A",
              }}
            >
              {treatment.activo ? "Activo" : "Inactivo"}
            </span>
          )}
        </div>

        {/* Botones Ver + Eliminar */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #F8F9FA",
          }}
        >
          <button
            onClick={onView}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "7px 0",
              borderRadius: 8,
              border: "1px solid #D3D7DA",
              background: "#fff",
              fontSize: 12,
              color: "#203F49",
              cursor: "pointer",
            }}
          >
            <Eye size={13} /> Ver detalle
          </button>
          {canManage && (
            <button
              onClick={onDelete}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                padding: "7px 0",
                borderRadius: 8,
                border: "1px solid #E24B4A",
                background: "#FEF2F2",
                fontSize: 12,
                color: "#E24B4A",
                cursor: "pointer",
              }}
            >
              <Trash2 size={13} /> Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({
  treatment,
  onClose,
}: {
  treatment: Treatment | null;
  onClose: () => void;
}) {
  const { isMobile } = useResponsive();
  if (!treatment) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: Z.MODAL_OVERLAY,
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        padding: isMobile ? 0 : 20,
        overscrollBehavior: "contain",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: isMobile ? "16px 16px 0 0" : 16,
          width: "100%",
          maxWidth: isMobile ? "100%" : 480,
          maxHeight: isMobile ? "85vh" : "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
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
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "12px 20px 16px" : "20px 24px 0",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 600,
              color: "#203F49",
            }}
          >
            {treatment.nombre}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "#F8F9FA",
              border: "none",
              cursor: "pointer",
              color: "#888F94",
              display: "flex",
              padding: 6,
              borderRadius: 8,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div
          style={{
            padding: isMobile ? "16px 20px 32px" : "16px 24px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {[
            { label: "Especialidad", value: treatment.especialidad },
            { label: "Precio", value: formatCurrency(treatment.precio) },
            {
              label: "Estado",
              value: treatment.activo ? "Activo" : "Inactivo",
              color: treatment.activo ? "#1D9E75" : "#E24B4A",
            },
            {
              label: "Descripción",
              value: treatment.descripcion || "Sin descripción",
            },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <span
                style={{
                  fontSize: 11,
                  color: "#888F94",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.04em",
                }}
              >
                {label}
              </span>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: color ?? "#203F49",
                  margin: "4px 0 0",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap" as const,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export interface TreatmentsScreenProps {
  userRole?: "Administrador" | "Doctor" | "Especialista" | "Contador";
}

type TreatmentRow = Treatment & Record<string, unknown>;

export function TreatmentsScreen({
  userRole = "Administrador",
}: TreatmentsScreenProps) {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const hasViewPrivilege = useHasPrivilege([65]);
  const hasManagePrivilege = useHasPrivilege([66]);

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [detailTreatment, setDetailTreatment] = useState<Treatment | null>(
    null
  );
  const [mobileSearch, setMobileSearch] = useState("");
  const [mobileFilterEsp, setMobileFilterEsp] = useState("");

  // Fix: timer ref para cleanup
  const alertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (alertTimer.current) clearTimeout(alertTimer.current);
    };
  }, []);

  function showAlert(variant: "success" | "error", message: string) {
    setAlert({ variant, message });
    if (alertTimer.current) clearTimeout(alertTimer.current);
    alertTimer.current = setTimeout(() => {
      if (mountedRef.current) setAlert(null);
    }, 4000);
  }

  useEffect(() => {
    if (!hasViewPrivilege) navigate("/dashboard");
  }, [hasViewPrivilege, navigate]);

  // Fix: isMounted local para evitar setState en desmontado
  const loadData = useCallback(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([treatmentService.getAll(), especialidadService.getAll()])
      .then(([treatmentsRes, espRes]) => {
        if (!isMounted) return;
        const tData = treatmentsRes.data?.data ?? treatmentsRes.data ?? [];
        const eData = espRes.data?.data ?? espRes.data ?? [];
        setTreatments(Array.isArray(tData) ? tData : []);
        setEspecialidades(Array.isArray(eData) ? eData : []);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        if (import.meta.env.DEV) console.error("[TreatmentsScreen]", err);
        showAlert("error", "Error al cargar tratamientos.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleDelete() {
    if (confirmId === null) return;
    treatmentService
      .delete(confirmId)
      .then(() => {
        setTreatments((prev) => prev.filter((t) => t.id !== confirmId));
        showAlert("success", "Tratamiento eliminado correctamente.");
      })
      .catch((err: unknown) => {
        if (import.meta.env.DEV) console.error("[TreatmentsScreen]", err);
        showAlert(
          "error",
          err instanceof Error
            ? err.message
            : "Error al eliminar el tratamiento."
        );
      })
      .finally(() => setConfirmId(null));
  }

  function handleToggleActivo(t: Treatment) {
    treatmentService
      .toggleActivo(t.id)
      .then((res) => {
        const updated = res.data?.data ?? res.data;
        if (updated)
          setTreatments((prev) =>
            prev.map((p) =>
              p.id === updated.id ? { ...p, activo: updated.activo } : p
            )
          );
      })
      .catch((err: unknown) => {
        if (import.meta.env.DEV) console.error("[TreatmentsScreen]", err);
        showAlert(
          "error",
          err instanceof Error ? err.message : "Error al cambiar estado."
        );
      });
  }

  // Filtrado para cards móvil/tablet
  const filteredTreatments = useMemo(
    () =>
      treatments.filter((t) => {
        const matchSearch =
          !mobileSearch ||
          matchesNormalizedSearch(t.nombre, mobileSearch);
        const matchEsp = !mobileFilterEsp || t.especialidad === mobileFilterEsp;
        return matchSearch && matchEsp;
      }),
    [treatments, mobileSearch, mobileFilterEsp]
  );

  const showCards = isMobile || isTablet;

  const columns: Column<TreatmentRow>[] = [
    {
      key: "nombre",
      label: "Nombre del Tratamiento",
      render: (_: unknown, row: TreatmentRow) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--foreground)",
            }}
          >
            {row.nombre as string}
          </span>
          {!row.activo && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                padding: "1px 6px",
                borderRadius: 4,
                background: "var(--arco-danger-soft)",
                color: "var(--arco-danger)",
                border: "0.5px solid var(--arco-danger)",
              }}
            >
              Inactivo
            </span>
          )}
        </div>
      ),
    },
    {
      key: "especialidad",
      label: "Especialidad",
      render: (_: unknown, row: TreatmentRow) => (
        <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
          {row.especialidad as string}
        </span>
      ),
    },
    {
      key: "precio",
      label: "Precio",
      align: "right" as const,
      render: (_: unknown, row: TreatmentRow) => (
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--foreground)",
            whiteSpace: "nowrap",
          }}
        >
          {formatCurrency(row.precio as number)}
        </span>
      ),
    },
    ...(hasManagePrivilege
      ? [
          {
            key: "activo" as string,
            label: "Activo",
            align: "center" as const,
            render: (_: unknown, row: TreatmentRow) => (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Toggle
                  checked={row.activo as boolean}
                  onChange={() => handleToggleActivo(row as Treatment)}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 24,
      }}
    >
      {alert && (
        <Alert
          variant={alert.variant}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {loading ? (
        <p
          style={{
            padding: 48,
            textAlign: "center",
            fontSize: 14,
            color: "var(--muted-foreground)",
          }}
        >
          Cargando tratamientos...
        </p>
      ) : showCards ? (
        // ── Vista móvil/tablet ────────────────────────────────────────────────
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Búsqueda + Nuevo en la misma fila */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              placeholder="Buscar tratamiento..."
              style={{
                flex: 1,
                height: 42,
                padding: "0 12px",
                border: "1px solid #D3D7DA",
                borderRadius: 8,
                background: "#F5F7FA",
                fontSize: 13,
                color: "#203F49",
                outline: "none",
                boxSizing: "border-box" as const,
              }}
            />
            {hasManagePrivilege && (
              <Button
                variant="primary"
                onClick={() => navigate("/treatments/new")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexShrink: 0,
                }}
              >
                <Plus size={15} /> Nuevo
              </Button>
            )}
          </div>
          {/* Filtro especialidad */}
          <select
            value={mobileFilterEsp}
            onChange={(e) => setMobileFilterEsp(e.target.value)}
            style={{
              width: "100%",
              height: 42,
              padding: "0 10px",
              border: "1px solid #D3D7DA",
              borderRadius: 8,
              background: "#fff",
              fontSize: 13,
              color: mobileFilterEsp ? "#203F49" : "#888F94",
              outline: "none",
            }}
          >
            <option value="">Todas las especialidades</option>
            {especialidades.map((e) => (
              <option key={e.id} value={e.nombre}>
                {e.nombre}
              </option>
            ))}
          </select>
          {/* Cards */}
          {filteredTreatments.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "var(--muted-foreground)",
                fontSize: 14,
                padding: 24,
              }}
            >
              No hay tratamientos para mostrar.
            </p>
          ) : (
            filteredTreatments.map((t) => (
              <TreatmentCard
                key={t.id}
                treatment={t}
                canManage={hasManagePrivilege}
                onView={() => setDetailTreatment(t)}
                onEdit={() => navigate(`/treatments/edit/${t.id}`)}
                onDelete={() => setConfirmId(t.id)}
                onToggle={() => handleToggleActivo(t)}
              />
            ))
          )}
        </div>
      ) : (
        // ── Vista desktop ─────────────────────────────────────────────────────
        <DataTable<TreatmentRow>
          columns={columns}
          data={treatments as TreatmentRow[]}
          title="Catálogo de Tratamientos"
          description="Gestiona los tratamientos disponibles en la clínica."
          searchable
          searchPlaceholder="Buscar por nombre de tratamiento..."
          searchKeys={["nombre"]}
          filters={[
            {
              key: "especialidad",
              placeholder: "Todas las especialidades",
              options: especialidades.map((e) => ({
                value: e.nombre,
                label: e.nombre,
              })),
            },
          ]}
          primaryAction={
            hasManagePrivilege
              ? {
                  label: "Nuevo Tratamiento",
                  icon: <Plus size={16} />,
                  onClick: () => navigate("/treatments/new"),
                }
              : undefined
          }
          rowActions={(_row: TreatmentRow) => [
            {
              icon: <Eye size={16} />,
              label: "Ver detalle",
              onClick: (r: TreatmentRow) => setDetailTreatment(r as Treatment),
            },
            ...(hasManagePrivilege
              ? [
                  {
                    icon: <Edit size={16} />,
                    label: "Editar",
                    onClick: (r: TreatmentRow) =>
                      navigate(`/treatments/edit/${r.id}`),
                  },
                  {
                    icon: <Trash2 size={16} />,
                    label: "Eliminar",
                    danger: true as const,
                    onClick: (r: TreatmentRow) => setConfirmId(r.id as number),
                  },
                ]
              : []),
          ]}
          getRowKey={(row) => String(row.id)}
          emptyMessage="No hay tratamientos registrados."
          pageSize={10}
        />
      )}

      <ConfirmModal
        open={confirmId !== null}
        variant="danger"
        title="Eliminar tratamiento"
        description="¿Estás seguro de que deseas eliminar este tratamiento? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onClose={() => setConfirmId(null)}
      />

      <DetailModal
        treatment={detailTreatment}
        onClose={() => setDetailTreatment(null)}
      />
    </div>
  );
}

export default TreatmentsScreen;
