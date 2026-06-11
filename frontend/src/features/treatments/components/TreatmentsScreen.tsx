import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  TrendingUp,
  Layers,
  X,
} from "lucide-react";
import { Button, Alert } from "../../../context";
import { ConfirmModal, DataTable } from "../../../components";
import { formatCurrency } from "../../../utils/formatters";
import { useResponsive } from "../../../hooks/useWindowWidth";
import { ESPECIALIDADES, MOCK_TREATMENTS, type Treatment } from "../types";

const C = {
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

// ─── Card para móvil ──────────────────────────────────────────────────────────
interface TreatmentCardProps {
  t: Treatment;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function TreatmentCard({ t, isAdmin, onEdit, onDelete }: TreatmentCardProps) {
  const ec = getEstadoColor(t.impactoOdontograma);
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: `1px solid ${C.gray300}`,
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
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: C.navy,
              margin: 0,
              wordBreak: "break-word",
            }}
          >
            {t.nombre}
          </p>
          <p style={{ fontSize: 12, color: C.gray500, margin: "2px 0 0" }}>
            ID: {t.id}
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button
              onClick={onEdit}
              title="Editar"
              style={{
                padding: 6,
                borderRadius: 8,
                border: "none",
                background: C.gray50,
                cursor: "pointer",
                color: C.gray700,
                display: "flex",
              }}
            >
              <Edit size={16} />
            </button>
            <button
              onClick={onDelete}
              title="Eliminar"
              style={{
                padding: 6,
                borderRadius: 8,
                border: "none",
                background: "#FEF2F2",
                cursor: "pointer",
                color: C.danger,
                display: "flex",
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      <div style={{ borderTop: `1px solid ${C.gray50}`, paddingTop: 4 }}>
        <div
          style={{ padding: "8px 0", borderBottom: `1px solid ${C.gray50}` }}
        >
          <span
            style={{
              fontSize: 12,
              color: C.gray500,
              display: "block",
              marginBottom: 2,
            }}
          >
            Especialidad
          </span>
          <span
            style={{ fontSize: 13, color: C.navy, wordBreak: "break-word" }}
          >
            {t.especialidad}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: `1px solid ${C.gray50}`,
          }}
        >
          <span style={{ fontSize: 12, color: C.gray500 }}>
            Impacto Odontograma
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "3px 10px",
              borderRadius: 9999,
              background: ec.bg,
              color: ec.color,
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            {t.impactoOdontograma}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
          }}
        >
          <span style={{ fontSize: 12, color: C.gray500 }}>Precio</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
            {formatCurrency(t.precio)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
interface DrawerProps {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Drawer({ open, title, subtitle, onClose, children }: DrawerProps) {
  const { isMobile, width: w } = useResponsive();

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "85vh",
        background: "#fff",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
        zIndex: 201,
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease",
      }
    : {
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: Math.min(w - 32, 420),
        background: "#fff",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        zIndex: 201,
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease",
      };

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 200,
          }}
        />
      )}
      <div style={panelStyle}>
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
                background: C.gray300,
              }}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: isMobile ? "12px 20px 16px" : "20px 24px",
            borderBottom: `1px solid ${C.gray300}`,
            flexShrink: 0,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: C.navy,
                margin: 0,
              }}
            >
              {title}
            </h3>
            <p style={{ fontSize: 13, color: C.gray500, margin: "4px 0 0" }}>
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 6,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: C.gray500,
              display: "flex",
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export interface TreatmentsScreenProps {
  userRole?: "Administrador" | "Doctor" | "Especialista" | "Contador";
}

// Tipo compatible con DataTable (Record<string, unknown>)
type TreatmentRow = Treatment & Record<string, unknown>;

export function TreatmentsScreen({
  userRole = "Administrador",
}: TreatmentsScreenProps) {
  const navigate = useNavigate();
  const { isMobile, isTablet, width: w } = useResponsive();

  const [treatments, setTreatments] = useState<Treatment[]>(MOCK_TREATMENTS);
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [openDrawer, setOpenDrawer] = useState<
    "total" | "principal" | "categorias" | null
  >(null);

  const isAdmin = userRole === "Administrador";

  const { porEsp, principal } = useMemo(() => {
    const porEsp = treatments.reduce<Record<string, number>>((acc, t) => {
      acc[t.especialidad] = (acc[t.especialidad] || 0) + 1;
      return acc;
    }, {});
    const principal = Object.entries(porEsp).sort((a, b) => b[1] - a[1])[0];
    return { porEsp, principal };
  }, [treatments]);

  const stats = [
    {
      key: "total" as const,
      label: "Total de Tratamientos",
      value: treatments.length.toString(),
      subtitle: "En el catálogo",
      icon: FileText,
      bg: "rgba(11,197,223,0.08)",
      iconColor: C.primary,
    },
    {
      key: "principal" as const,
      label: "Especialidad Principal",
      value: principal ? principal[1].toString() : "0",
      subtitle: principal ? principal[0] : "N/A",
      icon: TrendingUp,
      bg: "rgba(29,158,117,0.08)",
      iconColor: C.success,
    },
    {
      key: "categorias" as const,
      label: "Categorías Activas",
      value: Object.keys(porEsp).length.toString(),
      subtitle: `de ${ESPECIALIDADES.length} disponibles`,
      icon: Layers,
      bg: "rgba(239,159,39,0.08)",
      iconColor: C.warning,
    },
  ];

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

  // Columnas para DataTable
  const columns = [
    {
      key: "especialidad",
      label: "Especialidad",
      render: (_: unknown, row: TreatmentRow) => (
        <span style={{ fontSize: 13, color: C.gray700 }}>
          {row.especialidad as string}
        </span>
      ),
    },
    {
      key: "nombre",
      label: "Nombre del Tratamiento",
      render: (_: unknown, row: TreatmentRow) => (
        <span style={{ fontSize: 14, fontWeight: 500, color: C.navy }}>
          {row.nombre as string}
        </span>
      ),
    },
    {
      key: "impactoOdontograma",
      label: "Impacto en Odontograma",
      render: (_: unknown, row: TreatmentRow) => {
        const ec = getEstadoColor(row.impactoOdontograma as string);
        return (
          <span
            style={{
              display: "inline-flex",
              padding: "4px 10px",
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 500,
              background: ec.bg,
              color: ec.color,
              whiteSpace: "nowrap",
            }}
          >
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
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: C.navy,
            whiteSpace: "nowrap",
          }}
        >
          {formatCurrency(row.precio as number)}
        </span>
      ),
    },
  ];

  const statsGridCols = isMobile
    ? "1fr"
    : w <= 1024
    ? "1fr 1fr"
    : "repeat(3, 1fr)";

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

      {/* Tarjetas de estadísticas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: statsGridCols,
          gap: isMobile ? 10 : 16,
        }}
      >
        {stats.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setOpenDrawer(s.key)}
            style={{
              background: "#fff",
              borderRadius: 12,
              border: `1px solid ${C.gray300}`,
              padding: isMobile ? 14 : 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              gridColumn:
                w <= 1024 && w > 640 && i === 2 ? "1 / -1" : undefined,
              transition: "box-shadow 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = C.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = C.gray300;
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 11,
                  color: C.gray500,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  margin: "0 0 6px",
                  fontWeight: 400,
                }}
              >
                {s.label}
              </p>
              <p
                style={{
                  fontSize: isMobile ? 20 : 24,
                  fontWeight: 600,
                  color: C.navy,
                  margin: "0 0 4px",
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: C.gray500,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.subtitle}
              </p>
            </div>
            <div
              style={{
                width: isMobile ? 36 : 44,
                height: isMobile ? 36 : 44,
                borderRadius: 10,
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginLeft: 12,
              }}
            >
              <s.icon
                size={isMobile ? 18 : 22}
                style={{ color: s.iconColor }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Cards en móvil / DataTable en tablet+desktop */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/treatments/new")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                justifyContent: "center",
              }}
            >
              <Plus size={16} /> Nuevo Tratamiento
            </Button>
          </div>
          {treatments.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                fontSize: 14,
                color: C.gray500,
                background: "#fff",
                borderRadius: 12,
                border: `1px solid ${C.gray300}`,
              }}
            >
              No hay tratamientos registrados.
            </div>
          ) : (
            treatments.map((t) => (
              <TreatmentCard
                key={t.id}
                t={t}
                isAdmin={isAdmin}
                onEdit={() => navigate(`/treatments/edit/${t.id}`)}
                onDelete={() => setConfirmId(t.id)}
              />
            ))
          )}
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
              options: ESPECIALIDADES.map((e) => ({ value: e, label: e })),
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
          secondaryActions={[]}
          rowActions={
            isAdmin
              ? (row) => [
                  {
                    icon: <Edit size={16} />,
                    label: "Editar",
                    onClick: (r) => navigate(`/treatments/edit/${r.id}`),
                  },
                  {
                    icon: <Trash2 size={16} />,
                    label: "Eliminar",
                    danger: true,
                    onClick: (r) => setConfirmId(r.id as number),
                  },
                ]
              : undefined
          }
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

      {/* Drawer: Total */}
      <Drawer
        open={openDrawer === "total"}
        title="Total de Tratamientos"
        subtitle="Lista completa de tratamientos registrados"
        onClose={() => setOpenDrawer(null)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {treatments.map((t) => {
            const ec = getEstadoColor(t.impactoOdontograma);
            return (
              <div
                key={t.id}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: `1px solid ${C.gray300}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: C.navy,
                      flex: 1,
                    }}
                  >
                    {t.nombre}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "3px 10px",
                      borderRadius: 9999,
                      background: ec.bg,
                      color: ec.color,
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.impactoOdontograma}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: C.gray500, margin: 0 }}>
                  {t.especialidad}
                </p>
              </div>
            );
          })}
        </div>
      </Drawer>

      {/* Drawer: Especialidad Principal */}
      <Drawer
        open={openDrawer === "principal"}
        title="Especialidad Principal"
        subtitle="Distribución por especialidad"
        onClose={() => setOpenDrawer(null)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Object.entries(porEsp)
            .sort((a, b) => b[1] - a[1])
            .map(([esp, count]) => {
              const pct = Math.round((count / treatments.length) * 100);
              return (
                <div key={esp}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: C.navy,
                        flex: 1,
                        paddingRight: 8,
                      }}
                    >
                      {esp}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: C.primary,
                        flexShrink: 0,
                      }}
                    >
                      {count}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 9999,
                      background: C.gray50,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: 9999,
                        background: C.success,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      color: C.gray500,
                      margin: "4px 0 0",
                    }}
                  >
                    {pct}% del total
                  </p>
                </div>
              );
            })}
        </div>
      </Drawer>

      {/* Drawer: Categorías Activas */}
      <Drawer
        open={openDrawer === "categorias"}
        title="Categorías Activas"
        subtitle="Estado de las especialidades disponibles"
        onClose={() => setOpenDrawer(null)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ESPECIALIDADES.map((esp) => {
            const count = porEsp[esp] || 0;
            const isActive = count > 0;
            return (
              <div
                key={esp}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: `1px solid ${isActive ? C.success : C.gray300}`,
                  background: isActive ? "rgba(29,158,117,0.05)" : "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: C.navy,
                      flex: 1,
                    }}
                  >
                    {esp}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: 9999,
                      background: isActive ? `${C.success}20` : C.gray50,
                      color: isActive ? C.success : C.gray500,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {count} {count !== 1 ? "tratamientos" : "tratamiento"}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: C.gray500, margin: 0 }}>
                  {isActive
                    ? "Categoría activa"
                    : "Sin tratamientos registrados"}
                </p>
              </div>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
}

export default TreatmentsScreen;
