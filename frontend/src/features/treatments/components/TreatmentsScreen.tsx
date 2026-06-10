import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  TrendingUp,
  Layers,
  X,
} from "lucide-react";
import { Input, Select, Button, Alert } from "../../../context";
import { ConfirmModal } from "../../../components";
import { formatCurrency } from "../../../utils/formatters";
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

function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return width;
}

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

// ─── Card view para móvil ─────────────────────────────────────────────────────
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
      {/* Header de la card */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{ fontSize: 15, fontWeight: 600, color: C.navy, margin: 0 }}
          >
            {t.nombre}
          </p>
          <p style={{ fontSize: 12, color: C.gray500, margin: "2px 0 0" }}>
            ID: {t.id}
          </p>
        </div>
        {isAdmin && (
          <div
            style={{ display: "flex", gap: 4, flexShrink: 0, marginLeft: 8 }}
          >
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

      {/* Filas de datos */}
      {[
        {
          label: "Especialidad",
          value: (
            <span style={{ fontSize: 13, color: C.navy }}>
              {t.especialidad}
            </span>
          ),
        },
        {
          label: "Impacto Odontograma",
          value: (
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                padding: "3px 10px",
                borderRadius: 9999,
                background: ec.bg,
                color: ec.color,
                whiteSpace: "nowrap",
              }}
            >
              {t.impactoOdontograma}
            </span>
          ),
        },
        {
          label: "Precio",
          value: (
            <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
              {formatCurrency(t.precio)}
            </span>
          ),
        },
      ].map(({ label, value }) => (
        <div
          key={label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderTop: `1px solid ${C.gray50}`,
          }}
        >
          <span style={{ fontSize: 13, color: C.gray500 }}>{label}</span>
          {value}
        </div>
      ))}
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
  const w = useWindowWidth();
  const isMobile = w <= 640;
  const drawerWidth = isMobile ? w : Math.min(w - 32, 420);

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 40,
          }}
        />
      )}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: drawerWidth,
          background: "#fff",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "20px 24px",
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

export function TreatmentsScreen({
  userRole = "Administrador",
}: TreatmentsScreenProps) {
  const navigate = useNavigate();
  const w = useWindowWidth();
  const isMobile = w <= 640;
  const isTablet = w > 640 && w <= 1024;
  const isDesktop = w > 1024;

  const [treatments, setTreatments] = useState<Treatment[]>(MOCK_TREATMENTS);
  const [search, setSearch] = useState("");
  const [filterEsp, setFilterEsp] = useState("all");
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [openDrawer, setOpenDrawer] = useState<
    "total" | "principal" | "categorias" | null
  >(null);

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

  const thStyle: React.CSSProperties = {
    padding: isTablet ? "10px 14px" : "12px 20px",
    fontSize: 12,
    fontWeight: 600,
    color: C.gray500,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  // Grid de tarjetas de stats
  const statsGridCols = isMobile
    ? "1fr"
    : isTablet
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

      {/* ── Tarjetas de estadísticas ── */}
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
              padding: isMobile ? 14 : isTablet ? 16 : 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              gridColumn: isTablet && i === 2 ? "1 / -1" : undefined,
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
                  fontSize: isMobile ? 20 : isTablet ? 20 : 24,
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

      {/* ── Filtros ── */}
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: `1px solid ${C.gray300}`,
          padding: isMobile ? 14 : 20,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : isTablet ? "column" : "row",
            alignItems: "flex-end",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 12,
              flex: 1,
              width: "100%",
            }}
          >
            <div style={{ flex: 1, position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 36,
                  color: C.gray500,
                  pointerEvents: "none",
                }}
              />
              <Input
                label="Buscar"
                placeholder={
                  isMobile
                    ? "Buscar tratamiento..."
                    : "Buscar por nombre de tratamiento..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
            <div
              style={{
                width: isMobile ? "100%" : isTablet ? 200 : 260,
                flexShrink: 0,
              }}
            >
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
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/treatments/new")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: isMobile || isTablet ? "100%" : undefined,
            }}
          >
            <Plus size={16} /> Nuevo Tratamiento
          </Button>
        </div>
      </div>

      {/* ── Contenido: Cards en móvil, Tabla en tablet/desktop ── */}
      {isMobile ? (
        // CARDS para móvil
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
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
              No hay tratamientos que coincidan.
            </div>
          ) : (
            filtered.map((t) => (
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
        // TABLA para tablet y desktop
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            border: `1px solid ${C.gray300}`,
            overflow: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: isTablet ? 500 : "unset",
            }}
          >
            <thead style={{ background: C.gray50 }}>
              <tr>
                {isDesktop && (
                  <th style={{ ...thStyle, textAlign: "left" }}>
                    Especialidad
                  </th>
                )}
                <th style={{ ...thStyle, textAlign: "left" }}>
                  Nombre del Tratamiento
                </th>
                <th style={{ ...thStyle, textAlign: "left" }}>Impacto</th>
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
                    colSpan={isAdmin ? (isDesktop ? 5 : 4) : isDesktop ? 4 : 3}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      fontSize: 14,
                      color: C.gray500,
                    }}
                  >
                    No hay tratamientos que coincidan.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const ec = getEstadoColor(t.impactoOdontograma);
                  const tdPad = isTablet ? "12px 14px" : "16px 20px";
                  return (
                    <tr
                      key={t.id}
                      style={{ borderTop: `1px solid ${C.gray300}` }}
                    >
                      {isDesktop && (
                        <td
                          style={{
                            padding: tdPad,
                            fontSize: 13,
                            color: C.gray700,
                          }}
                        >
                          {t.especialidad}
                        </td>
                      )}
                      <td
                        style={{
                          padding: tdPad,
                          fontSize: 14,
                          fontWeight: 500,
                          color: C.navy,
                        }}
                      >
                        {t.nombre}
                        {isTablet && (
                          <p
                            style={{
                              fontSize: 12,
                              color: C.gray500,
                              margin: "2px 0 0",
                              fontWeight: 400,
                            }}
                          >
                            {t.especialidad}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: tdPad }}>
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
                          {t.impactoOdontograma}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: tdPad,
                          textAlign: "right",
                          fontSize: 14,
                          fontWeight: 500,
                          color: C.navy,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(t.precio)}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: tdPad }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 4,
                            }}
                          >
                            <button
                              onClick={() =>
                                navigate(`/treatments/edit/${t.id}`)
                              }
                              title="Editar"
                              style={{
                                padding: 8,
                                borderRadius: 8,
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                color: C.gray700,
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
                                color: C.danger,
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

      {/* Drawer: Total de Tratamientos */}
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
