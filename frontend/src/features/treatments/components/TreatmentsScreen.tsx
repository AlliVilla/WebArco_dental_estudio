import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Alert, Toggle } from "../../../context";
import { DataTable, type Column, ConfirmModal } from "../../../components";
import { treatmentService, especialidadService } from "../services/treatmentService";
import { type Treatment, type Especialidad } from "../types";
import { useAuthStore } from "../../../features/auth/hooks/useAuthStore";

const C = {
  primary: "#0BC5DF",
  navy: "#203F49",
  danger: "#E24B4A",
  gray50: "#F8F9FA",
  gray300: "#D3D7DA",
  gray500: "#888F94",
  gray700: "#5F656A",
};

function useHasPrivilege(privilegeIds: number[]) {
  const user = useAuthStore((state) => state.user);
  return useMemo(() => {
    if (!user?.privilegios) return false;
    return privilegeIds.some(id => user.privilegios?.includes(id));
  }, [user?.privilegios]);
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-HN", { style: "currency", currency: "HNL", minimumFractionDigits: 2 }).format(n);
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ treatment, onClose }: { treatment: Treatment | null; onClose: () => void }) {
  if (!treatment) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.4)", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 0",
        }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: C.navy }}>
            {treatment.nombre}
          </h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.gray500, padding: "0 4px" }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, color: C.gray500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Especialidad
            </span>
            <p style={{ fontSize: 14, fontWeight: 500, color: C.navy, margin: "4px 0 0" }}>
              {treatment.especialidad}
            </p>
          </div>

          <div>
            <span style={{ fontSize: 11, color: C.gray500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Precio
            </span>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.navy, margin: "4px 0 0" }}>
              {formatCurrency(treatment.precio)}
            </p>
          </div>

          <div>
            <span style={{ fontSize: 11, color: C.gray500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Estado
            </span>
            <p style={{ fontSize: 13, fontWeight: 500, color: treatment.activo ? "#1D9E75" : C.danger, margin: "4px 0 0" }}>
              {treatment.activo ? "Activo" : "Inactivo"}
            </p>
          </div>

          <div>
            <span style={{ fontSize: 11, color: C.gray500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Descripción
            </span>
            <p style={{ fontSize: 13, color: C.gray700, margin: "4px 0 0", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {treatment.descripcion || "Sin descripción"}
            </p>
          </div>
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

export function TreatmentsScreen({ userRole = "Administrador" }: TreatmentsScreenProps) {
  const navigate = useNavigate();
  const isAdmin = userRole === "Administrador";
  const hasViewPrivilege = useHasPrivilege([65]);
  const hasManagePrivilege = useHasPrivilege([66]);

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [detailTreatment, setDetailTreatment] = useState<Treatment | null>(null);

  useEffect(() => {
    if (!hasViewPrivilege) {
      navigate("/dashboard");
    }
  }, [hasViewPrivilege, navigate]);

  function loadData() {
    setLoading(true);
    Promise.all([
      treatmentService.getAll(),
      especialidadService.getAll(),
    ])
      .then(([treatmentsRes, espRes]) => {
        const tData = treatmentsRes.data?.data ?? treatmentsRes.data ?? [];
        const eData = espRes.data?.data ?? espRes.data ?? [];
        setTreatments(Array.isArray(tData) ? tData : []);
        setEspecialidades(Array.isArray(eData) ? eData : []);
      })
      .catch(() => setAlert({ variant: "error", message: "Error al cargar tratamientos." }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  function handleDelete() {
    if (confirmId === null) return;
    treatmentService.delete(confirmId)
      .then(() => {
        setTreatments((prev) => prev.filter((t) => t.id !== confirmId));
        setAlert({ variant: "success", message: "Tratamiento eliminado correctamente." });
      })
      .catch((err) => setAlert({ variant: "error", message: err?.message || "Error al eliminar el tratamiento." }))
      .finally(() => {
        setConfirmId(null);
        setTimeout(() => setAlert(null), 4000);
      });
  }

  function handleToggleActivo(t: Treatment) {
    treatmentService.toggleActivo(t.id)
      .then((res) => {
        const updated = res.data?.data ?? res.data;
        if (updated) {
          setTreatments((prev) => prev.map((p) => (p.id === updated.id ? { ...p, activo: updated.activo } : p)));
        }
      })
      .catch((err) => setAlert({ variant: "error", message: err?.message || "Error al cambiar estado." }))
      .finally(() => setTimeout(() => setAlert(null), 4000));
  }

  const columns: Column<TreatmentRow>[] = [
    {
      key: "nombre",
      label: "Nombre del Tratamiento",
      render: (_: unknown, row: TreatmentRow) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: C.navy }}>{row.nombre as string}</span>
          {!row.activo && (
            <span style={{
              fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 4,
              background: "#FEF2F2", color: C.danger, border: "0.5px solid #FECACA",
            }}>
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
        <span style={{ fontSize: 13, color: C.gray700 }}>{row.especialidad as string}</span>
      ),
    },
    {
      key: "precio",
      label: "Precio",
      align: "right" as const,
      render: (_: unknown, row: TreatmentRow) => (
        <span style={{ fontSize: 14, fontWeight: 500, color: C.navy, whiteSpace: "nowrap" }}>
          {formatCurrency(row.precio as number)}
        </span>
      ),
    },
    ...(hasManagePrivilege
      ? [{
          key: "activo" as string,
          label: "Activo",
          align: "center" as const,
          render: (_: unknown, row: TreatmentRow) => (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Toggle
                checked={row.activo as boolean}
                onChange={() => handleToggleActivo(row as Treatment)}
              />
            </div>
          ),
        }]
      : []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {alert && (
        <Alert variant={alert.variant} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", fontSize: 14, color: C.gray500 }}>
          Cargando tratamientos...
        </div>
      ) : (
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
              options: especialidades.map((e) => ({ value: e.nombre, label: e.nombre })),
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
                  { icon: <Edit size={16} />, label: "Editar", onClick: (r: TreatmentRow) => navigate(`/treatments/edit/${r.id}`) },
                  { icon: <Trash2 size={16} />, label: "Eliminar", danger: true as const, onClick: (r: TreatmentRow) => setConfirmId(r.id as number) },
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
