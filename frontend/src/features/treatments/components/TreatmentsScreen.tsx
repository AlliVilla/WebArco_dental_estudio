import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  TrendingUp,
  Layers,
} from "lucide-react";
import { Input, Select, Button, Alert } from "../../../context";
import { ConfirmModal } from "../../../components";
import { formatCurrency } from "../../../utils/formatters";
import { ESPECIALIDADES, MOCK_TREATMENTS, type Treatment } from "../types";

const COLORS = {
  primary: "#0BC5DF",
  navy: "#203F49",
  success: "#1D9E75",
  warning: "#EF9F27",
  danger: "#E24B4A",
  gray50: "#F8F9FA",
  gray300: "#D3D7DA",
  gray500: "#888F94",
  gray700: "#5F656A",
};

function getEstadoColor(estado: string): { bg: string; color: string } {
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

export interface TreatmentsScreenProps {
  userRole?: "Administrador" | "Doctor" | "Especialista" | "Contador";
}

export function TreatmentsScreen({
  userRole = "Administrador",
}: TreatmentsScreenProps) {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState<Treatment[]>(MOCK_TREATMENTS);
  const [search, setSearch] = useState("");
  const [filterEsp, setFilterEsp] = useState("all");
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const isAdmin = userRole === "Administrador";

  const filtered = useMemo(
    () =>
      treatments.filter((t) => {
        const matchSearch = t.nombre
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchEsp = filterEsp === "all" || t.especialidad === filterEsp;
        return matchSearch && matchEsp;
      }),
    [treatments, search, filterEsp]
  );

  const stats = useMemo(() => {
    const porEsp = treatments.reduce<Record<string, number>>((acc, t) => {
      acc[t.especialidad] = (acc[t.especialidad] || 0) + 1;
      return acc;
    }, {});
    const principal = Object.entries(porEsp).sort((a, b) => b[1] - a[1])[0];
    return [
      {
        label: "Total de Tratamientos",
        value: treatments.length.toString(),
        subtitle: "En el catálogo",
        icon: FileText,
        bg: "rgba(11,197,223,0.08)",
        iconColor: COLORS.primary,
      },
      {
        label: "Especialidad Principal",
        value: principal ? principal[1].toString() : "0",
        subtitle: principal ? principal[0] : "N/A",
        icon: TrendingUp,
        bg: "rgba(29,158,117,0.08)",
        iconColor: COLORS.success,
      },
      {
        label: "Categorías Activas",
        value: Object.keys(porEsp).length.toString(),
        subtitle: `de ${ESPECIALIDADES.length} disponibles`,
        icon: Layers,
        bg: "rgba(239,159,39,0.08)",
        iconColor: COLORS.warning,
      },
    ];
  }, [treatments]);

  function handleDelete() {
    if (confirmId === null) return;
    setTreatments((prev) => prev.filter((t) => t.id !== confirmId));
    setAlert({
      variant: "success",
      message: "Tratamiento eliminado correctamente.",
    });
    setConfirmId(null);
    setTimeout(() => setAlert(null), 4000);
  }

  const thStyle: React.CSSProperties = {
    padding: "12px 20px",
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.gray500,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {alert && (
        <Alert
          variant={alert.variant}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Tarjetas de estadísticas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              borderRadius: 12,
              border: `1px solid ${COLORS.gray300}`,
              padding: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 12,
                  color: COLORS.gray500,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  margin: "0 0 8px",
                  fontWeight: 400,
                }}
              >
                {s.label}
              </p>
              <p
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: COLORS.navy,
                  margin: "0 0 4px",
                }}
              >
                {s.value}
              </p>
              <p style={{ fontSize: 12, color: COLORS.gray500, margin: 0 }}>
                {s.subtitle}
              </p>
            </div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <s.icon size={24} style={{ color: s.iconColor }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filtros y botón nuevo */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: `1px solid ${COLORS.gray300}`,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: 36,
                color: COLORS.gray500,
                pointerEvents: "none",
              }}
            />
            <Input
              label="Buscar"
              placeholder="Buscar por nombre de tratamiento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <div style={{ width: 280 }}>
            <Select
              label="Especialidad"
              value={filterEsp}
              onChange={setFilterEsp}
              options={[
                { value: "all", label: "Todas las especialidades" },
                ...ESPECIALIDADES.map((e) => ({ value: e, label: e })),
              ]}
            />
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/treatments/new")}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={16} /> Nuevo Tratamiento
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: `1px solid ${COLORS.gray300}`,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: COLORS.gray50 }}>
            <tr>
              <th style={{ ...thStyle, textAlign: "left" }}>Especialidad</th>
              <th style={{ ...thStyle, textAlign: "left" }}>
                Nombre del Tratamiento
              </th>
              <th style={{ ...thStyle, textAlign: "left" }}>
                Impacto en Odontograma
              </th>
              <th style={{ ...thStyle, textAlign: "right" }}>Precio</th>
              {isAdmin && (
                <th style={{ ...thStyle, textAlign: "right" }}>Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 5 : 4}
                  style={{
                    padding: 40,
                    textAlign: "center",
                    fontSize: 14,
                    color: COLORS.gray500,
                  }}
                >
                  No hay tratamientos que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const ec = getEstadoColor(t.impactoOdontograma);
                return (
                  <tr
                    key={t.id}
                    style={{ borderTop: `1px solid ${COLORS.gray300}` }}
                  >
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: 14,
                        color: COLORS.gray700,
                      }}
                    >
                      {t.especialidad}
                    </td>
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: 14,
                        fontWeight: 500,
                        color: COLORS.navy,
                      }}
                    >
                      {t.nombre}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "4px 12px",
                          borderRadius: 9999,
                          fontSize: 13,
                          fontWeight: 500,
                          background: ec.bg,
                          color: ec.color,
                        }}
                      >
                        {t.impactoOdontograma}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "16px 20px",
                        textAlign: "right",
                        fontSize: 14,
                        fontWeight: 500,
                        color: COLORS.navy,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(t.precio)}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: "16px 20px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 4,
                          }}
                        >
                          <button
                            onClick={() => navigate(`/treatments/edit/${t.id}`)}
                            title="Editar"
                            style={{
                              padding: 8,
                              borderRadius: 8,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              color: COLORS.gray700,
                              display: "flex",
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => setConfirmId(t.id)}
                            title="Eliminar"
                            style={{
                              padding: 8,
                              borderRadius: 8,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              color: COLORS.danger,
                              display: "flex",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}

export default TreatmentsScreen;
