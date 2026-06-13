import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { History, Download, RefreshCw } from "lucide-react";
import { DataTable, StatsDrawer } from "../../../components";
import { ReminderService } from "../services/ReminderService";
import {
  formatDate,
  formatInitials,
  normalizeSearch,
} from "../../../utils/formatters";
import { useResponsive } from "../../../hooks/useWindowWidth";
import type {
  HistorialConfirmacionRow,
  CanalRecordatorio,
  RespuestaPaciente,
} from "../types";
import { CANAL_CONFIG, RESPUESTA_CONFIG } from "../utils/badgeConfigs";

export interface HistorialConfirmacionesScreenProps {}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFechaHora(iso: string | null) {
  if (!iso) return "—";
  return `${formatDate(iso)} · ${new Date(iso).toLocaleTimeString("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function RespuestaBadge({ respuesta }: { respuesta: RespuestaPaciente }) {
  const cfg = RESPUESTA_CONFIG[respuesta];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: cfg.bg,
        color: cfg.color,
        padding: "3px 10px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

function CanalBadge({ canal }: { canal: CanalRecordatorio | null }) {
  if (!canal) return <span style={{ fontSize: 12, color: "#D3D7DA" }}>—</span>;
  const cfg = CANAL_CONFIG[canal];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: cfg.bg,
        color: cfg.color,
        padding: "3px 8px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {cfg.icon} {canal}
    </span>
  );
}

// ─── Card para móvil ──────────────────────────────────────────────────────────
function HistorialCard({ row }: { row: HistorialConfirmacionRow }) {
  const initials = formatInitials(row.paciente);
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
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#E6F8FB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            color: "#0BC5DF",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
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
            {row.paciente}
          </p>
        </div>
        <RespuestaBadge respuesta={row.respuesta} />
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
          <span style={{ fontSize: 12, color: "#888F94" }}>Canal</span>
          <CanalBadge canal={row.canal} />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94", flexShrink: 0 }}>
            Envío
          </span>
          <span style={{ fontSize: 12, color: "#5F656A", textAlign: "right" }}>
            {formatFechaHora(row.fecha_envio)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "7px 0",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94", flexShrink: 0 }}>
            Respuesta
          </span>
          <span
            style={{
              fontSize: 12,
              color: row.fecha_respuesta ? "#5F656A" : "#D3D7DA",
              textAlign: "right",
            }}
          >
            {formatFechaHora(row.fecha_respuesta)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export function HistorialConfirmacionesScreen(
  _props: HistorialConfirmacionesScreenProps
) {
  const { isMobile, isTablet } = useResponsive();
  const mountedRef = useRef(true);

  const [rows, setRows] = useState<HistorialConfirmacionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDrawer, setOpenDrawer] = useState<
    "total" | "confirmados" | "cancelados" | "sin_respuesta" | null
  >(null);

  // Filtros móvil
  const [mobileSearch, setMobileSearch] = useState("");
  const [mobileFilterRespuesta, setMobileFilterRespuesta] = useState("");
  const [mobileFilterCanal, setMobileFilterCanal] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchHistorial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ReminderService.getHistorial();
      if (!mountedRef.current) return;
      if (response.success) {
        setRows(response.data ?? []);
      } else {
        setError(response.message ?? "Error al cargar el historial");
        setRows([]);
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV)
        console.error("[HistorialConfirmacionesScreen]", err);
      if (mountedRef.current) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el historial"
        );
        setRows([]);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistorial();
  }, [fetchHistorial]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      confirmados: rows.filter((r) => r.respuesta === "Confirmó").length,
      cancelados: rows.filter((r) => r.respuesta === "Canceló").length,
      sin_respuesta: rows.filter((r) => r.respuesta === "Sin respuesta").length,
    }),
    [rows]
  );

  const tasaConfirmacion =
    stats.total > 0 ? Math.round((stats.confirmados / stats.total) * 100) : 0;

  // Filtrado compartido móvil
  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        const matchSearch =
          !mobileSearch ||
          normalizeSearch(r.paciente).includes(normalizeSearch(mobileSearch));
        const matchResp =
          !mobileFilterRespuesta || r.respuesta === mobileFilterRespuesta;
        const matchCanal = !mobileFilterCanal || r.canal === mobileFilterCanal;
        return matchSearch && matchResp && matchCanal;
      }),
    [rows, mobileSearch, mobileFilterRespuesta, mobileFilterCanal]
  );

  // Fix 6: cards en móvil Y tablet — DataTable solo en desktop
  const showCards = isMobile || isTablet;

  type Row = HistorialConfirmacionRow & Record<string, unknown>;

  const columns = useMemo(
    () => [
      {
        key: "paciente",
        label: "Paciente",
        width: "22%",
        render: (_: unknown, row: Row) => (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#E6F8FB",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "#0BC5DF",
              }}
            >
              {formatInitials(row.paciente as string)}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>
              {row.paciente as string}
            </span>
          </div>
        ),
      },
      {
        key: "fecha_envio",
        label: "Fecha / hora de envío",
        width: "20%",
        render: (_: unknown, row: Row) => (
          <span style={{ fontSize: 13, color: "#5F656A" }}>
            {formatFechaHora(row.fecha_envio as string)}
          </span>
        ),
      },
      {
        key: "fecha_respuesta",
        label: "Fecha / hora de respuesta",
        width: "20%",
        render: (_: unknown, row: Row) => (
          <span
            style={{
              fontSize: 13,
              color: row.fecha_respuesta ? "#5F656A" : "#D3D7DA",
            }}
          >
            {formatFechaHora(row.fecha_respuesta as string | null)}
          </span>
        ),
      },
      {
        key: "respuesta",
        label: "Respuesta del paciente",
        width: "18%",
        render: (_: unknown, row: Row) => (
          <RespuestaBadge respuesta={row.respuesta as RespuestaPaciente} />
        ),
      },
      {
        key: "canal",
        label: "Canal utilizado",
        width: "14%",
        render: (_: unknown, row: Row) => (
          <CanalBadge canal={row.canal as CanalRecordatorio | null} />
        ),
      },
    ],
    []
  );

  const kpis = [
    {
      key: "total" as const,
      label: "Total registros",
      value: stats.total,
      color: "#0BC5DF",
      bg: "#E6F8FB",
    },
    {
      key: "confirmados" as const,
      label: "Confirmaciones",
      value: stats.confirmados,
      color: "#1D9E75",
      bg: "#ECFDF5",
    },
    {
      key: "cancelados" as const,
      label: "Cancelaciones",
      value: stats.cancelados,
      color: "#E24B4A",
      bg: "#FEF2F2",
    },
    {
      key: "sin_respuesta" as const,
      label: "Sin respuesta",
      value: stats.sin_respuesta,
      color: "#888F94",
      bg: "#F1F3F4",
    },
  ];

  const kpiCols = isMobile || isTablet ? "1fr 1fr" : "repeat(4, 1fr)";

  return (
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
          gap: isMobile ? 10 : 12,
        }}
      >
        {kpis.map((kpi) => (
          <button
            key={kpi.key}
            onClick={() => setOpenDrawer(kpi.key)}
            style={{
              background: "#fff",
              border: "1px solid #D3D7DA",
              borderRadius: 12,
              padding: isMobile ? "12px 14px" : "14px 18px",
              textAlign: "left",
              cursor: "pointer",
              transition: "box-shadow 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
              e.currentTarget.style.borderColor = kpi.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.borderColor = "#D3D7DA";
            }}
          >
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 11,
                fontWeight: 600,
                color: "#888F94",
                textTransform: "uppercase",
                letterSpacing: "0.6px",
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: isMobile ? 22 : 26,
                fontWeight: 600,
                color: kpi.color,
              }}
            >
              {kpi.value}
            </p>
          </button>
        ))}
      </div>

      {/* Barra de tasa de confirmación */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #D3D7DA",
          borderRadius: 12,
          padding: isMobile ? "12px 14px" : "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <History size={15} style={{ color: "#0BC5DF" }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>
            Tasa de confirmación
          </span>
        </div>
        <div
          style={{
            flex: 1,
            background: "#F1F3F4",
            borderRadius: 99,
            height: 8,
          }}
        >
          <div
            style={{
              width: `${tasaConfirmacion}%`,
              height: "100%",
              background: "#1D9E75",
              borderRadius: 99,
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#203F49",
            minWidth: 38,
            textAlign: "right",
          }}
        >
          {tasaConfirmacion}%
        </span>
      </div>

      {/* Móvil+Tablet: cards / Desktop: DataTable */}
      {showCards ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Búsqueda */}
          <input
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            placeholder="Buscar paciente..."
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
          {/* Filtros */}
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={mobileFilterRespuesta}
              onChange={(e) => setMobileFilterRespuesta(e.target.value)}
              style={{
                flex: 1,
                height: 42,
                padding: "0 10px",
                border: "1px solid #D3D7DA",
                borderRadius: 8,
                background: "#fff",
                fontSize: 12,
                color: mobileFilterRespuesta ? "#203F49" : "#888F94",
                outline: "none",
              }}
            >
              <option value="">Respuesta</option>
              <option value="Confirmó">Confirmó</option>
              <option value="Canceló">Canceló</option>
              <option value="Sin respuesta">Sin respuesta</option>
            </select>
            <select
              value={mobileFilterCanal}
              onChange={(e) => setMobileFilterCanal(e.target.value)}
              style={{
                flex: 1,
                height: 42,
                padding: "0 10px",
                border: "1px solid #D3D7DA",
                borderRadius: 8,
                background: "#fff",
                fontSize: 12,
                color: mobileFilterCanal ? "#203F49" : "#888F94",
                outline: "none",
              }}
            >
              <option value="">Canal</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="Correo">Correo</option>
            </select>
          </div>
          {/* Acciones */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => void fetchHistorial()}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 40,
                borderRadius: 8,
                border: "1px solid #D3D7DA",
                background: "#fff",
                fontSize: 13,
                color: "#203F49",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} /> Actualizar
            </button>
            <button
              onClick={() => ReminderService.exportCsv()}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 40,
                borderRadius: 8,
                border: "1px solid #D3D7DA",
                background: "#fff",
                fontSize: 13,
                color: "#203F49",
                cursor: "pointer",
              }}
            >
              <Download size={14} /> Exportar
            </button>
          </div>
          {/* Cards */}
          {loading ? (
            <p
              style={{
                textAlign: "center",
                color: "#888F94",
                fontSize: 14,
                padding: 24,
              }}
            >
              Cargando historial...
            </p>
          ) : error ? (
            <p
              style={{
                textAlign: "center",
                color: "#E24B4A",
                fontSize: 14,
                padding: 24,
              }}
            >
              {error}
            </p>
          ) : filteredRows.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                color: "#888F94",
                fontSize: 14,
                padding: 24,
              }}
            >
              No hay registros que coincidan.
            </p>
          ) : (
            filteredRows.map((row) => <HistorialCard key={row.id} row={row} />)
          )}
        </div>
      ) : (
        <DataTable<Row>
          columns={columns}
          data={filteredRows as Row[]}
          title="Historial de confirmaciones"
          description="Registro de todos los recordatorios enviados y sus respuestas"
          searchable
          searchPlaceholder="Buscar paciente..."
          searchKeys={["paciente"]}
          filters={[
            {
              key: "respuesta",
              placeholder: "Respuesta",
              options: [
                { value: "Confirmó", label: "Confirmó" },
                { value: "Canceló", label: "Canceló" },
                { value: "Sin respuesta", label: "Sin respuesta" },
              ],
            },
            {
              key: "canal",
              placeholder: "Canal",
              options: [
                { value: "WhatsApp", label: "WhatsApp" },
                { value: "SMS", label: "SMS" },
                { value: "Correo", label: "Correo" },
              ],
            },
          ]}
          secondaryActions={[
            {
              label: loading ? "Cargando..." : "Actualizar",
              icon: <RefreshCw size={14} />,
              onClick: fetchHistorial,
            },
            {
              label: "Exportar CSV",
              icon: <Download size={14} />,
              onClick: () => ReminderService.exportCsv(),
            },
          ]}
          getRowKey={(row) => String(row.id)}
          pageSize={15}
          emptyMessage={
            loading
              ? "Cargando historial..."
              : error ?? "No hay registros en el historial."
          }
        />
      )}

      {/* Drawers de KPIs */}
      {[
        {
          key: "total" as const,
          title: "Total registros",
          subtitle: "Todos los recordatorios enviados",
          filter: (_: HistorialConfirmacionRow) => true,
        },
        {
          key: "confirmados" as const,
          title: "Confirmaciones",
          subtitle: "Pacientes que confirmaron su cita",
          filter: (r: HistorialConfirmacionRow) => r.respuesta === "Confirmó",
        },
        {
          key: "cancelados" as const,
          title: "Cancelaciones",
          subtitle: "Pacientes que cancelaron su cita",
          filter: (r: HistorialConfirmacionRow) => r.respuesta === "Canceló",
        },
        {
          key: "sin_respuesta" as const,
          title: "Sin respuesta",
          subtitle: "Pacientes que no respondieron",
          filter: (r: HistorialConfirmacionRow) =>
            r.respuesta === "Sin respuesta",
        },
      ].map(({ key, title, subtitle, filter }) => {
        const drawerRows = rows.filter(filter);
        return (
          <StatsDrawer
            key={key}
            open={openDrawer === key}
            title={title}
            subtitle={subtitle}
            onClose={() => setOpenDrawer(null)}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {drawerRows.length === 0 ? (
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
                drawerRows.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #D3D7DA",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: "#E6F8FB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#0BC5DF",
                            flexShrink: 0,
                          }}
                        >
                          {formatInitials(row.paciente)}
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#203F49",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.paciente}
                        </span>
                      </div>
                      <RespuestaBadge respuesta={row.respuesta} />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <CanalBadge canal={row.canal} />
                      <span style={{ fontSize: 11, color: "#888F94" }}>
                        {formatFechaHora(row.fecha_envio)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </StatsDrawer>
        );
      })}
    </div>
  );
}
