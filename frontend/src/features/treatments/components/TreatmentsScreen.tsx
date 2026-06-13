import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, X } from "lucide-react";
import { Button, Alert } from "../../../context";
import { ConfirmModal, DataTable } from "../../../components";
import { formatCurrency } from "../../../utils/formatters";
import { treatmentService, especialidadService } from "../services/treatmentService";
import { type Treatment, type Especialidad } from "../types";

const C = {
  primary: "#0BC5DF",
  navy: "#203F49",
  success: "#1D9E75",
  gray300: "#D3D7DA",
  gray500: "#888F94",
  gray700: "#5F656A",
};

function getEstadoColor(estado: string) {
  const map: Record<string, { bg: string; color: string }> = {
    Sano: { bg: "#d6efe1", color: "#4a8c68" },
    Caries: { bg: "#fce4e4", color: "#b85755" },
    Obturación: { bg: "#d4edf7", color: "#3a88aa" },
    Extracción: { bg: "#fce4e4", color: "#b85755" },
    Ausente: { bg: "#E8EBED", color: "#5F656A" },
    Endodoncia: { bg: "#fdf0d0", color: "#9a7020" },
    Corona: { bg: "#d4edf7", color: "#3a88aa" },
    Prótesis: { bg: "#d4edf7", color: "#3a88aa" },
    Implante: { bg: "#d6efe1", color: "#4a8c68" },
    Puente: { bg: "#d4edf7", color: "#3a88aa" },
  };
  return map[estado] ?? { bg: "#E8EBED", color: "#5F656A" };
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ treatment, onClose }: { treatment: Treatment | null; onClose: () => void }) {
  if (!treatment) return null;
  const ec = getEstadoColor(treatment.impactoOdontograma);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 16, width: "100%", maxWidth: 480,
          maxHeight: "90vh", overflow: "auto", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "20px 24px 16px", borderBottom: `1px solid ${C.gray300}`,
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: C.navy, margin: 0 }}>
              {treatment.nombre}
            </h3>
            <p style={{ fontSize: 12, color: C.gray500, margin: "4px 0 0" }}>
              ID: {treatment.id}
            </p>
          </div>
          <button onClick={onClose} style={{
            padding: 6, border: "none", background: "none", cursor: "pointer",
            color: C.gray500, display: "flex", borderRadius: 6,
          }}>
            <X size={20} />
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
              Impacto en Odontograma
            </span>
            <div style={{ marginTop: 6 }}>
              <span style={{
                display: "inline-flex", padding: "4px 12px", borderRadius: 9999,
                fontSize: 13, fontWeight: 500, background: ec.bg, color: ec.color,
              }}>
                {treatment.impactoOdontograma}
              </span>
            </div>
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

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [detailTreatment, setDetailTreatment] = useState<Treatment | null>(null);

  useEffect(() => {
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
  }, []);

  function handleDelete() {
    if (confirmId === null) return;
    treatmentService.delete(confirmId)
      .then(() => {
        setTreatments((prev) => prev.filter((t) => t.id !== confirmId));
        setAlert({ variant: "success", message: "Tratamiento eliminado correctamente." });
      })
      .catch(() => setAlert({ variant: "error", message: "Error al eliminar el tratamiento." }))
      .finally(() => {
        setConfirmId(null);
        setTimeout(() => setAlert(null), 4000);
      });
  }

  const columns = [
    {
      key: "especialidad",
      label: "Especialidad",
      render: (_: unknown, row: TreatmentRow) => (
        <span style={{ fontSize: 13, color: C.gray700 }}>{row.especialidad as string}</span>
      ),
    },
    {
      key: "nombre",
      label: "Nombre del Tratamiento",
      render: (_: unknown, row: TreatmentRow) => (
        <span style={{ fontSize: 14, fontWeight: 500, color: C.navy }}>{row.nombre as string}</span>
      ),
    },
    {
      key: "impactoOdontograma",
      label: "Impacto en Odontograma",
      render: (_: unknown, row: TreatmentRow) => {
        const ec = getEstadoColor(row.impactoOdontograma as string);
        return (
          <span style={{
            display: "inline-flex", padding: "4px 10px", borderRadius: 9999,
            fontSize: 12, fontWeight: 500, background: ec.bg, color: ec.color,
            whiteSpace: "nowrap",
          }}>
            {row.impactoOdontograma as string}
          </span>
        );
      },
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
            isAdmin
              ? {
                  label: "Nuevo Tratamiento",
                  icon: <Plus size={16} />,
                  onClick: () => navigate("/treatments/new"),
                }
              : undefined
          }
          rowActions={(row) => [
            {
              icon: <Eye size={16} />,
              label: "Ver detalle",
              onClick: (r) => setDetailTreatment(r as Treatment),
            },
            ...(isAdmin
              ? [
                  { icon: <Edit size={16} />, label: "Editar", onClick: (r) => navigate(`/treatments/edit/${r.id}`) },
                  { icon: <Trash2 size={16} />, label: "Eliminar", danger: true as const, onClick: (r) => setConfirmId(r.id as number) },
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
