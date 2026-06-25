import { useState, useMemo, useEffect, useCallback } from "react";
import { Send, RotateCcw, Clock, RefreshCw, Plus, Trash2 } from "lucide-react";
import { DataTable, StatsDrawer, ConfirmModal } from "../../../components";
import { Avatar, Alert } from "../../../context";
import { ReminderService } from "../services/ReminderService";
import {
  formatDate,
  formatInitials,
  matchesNormalizedSearch,
} from "../../../utils/formatters";
import { useResponsive } from "../../../hooks/useWindowWidth";
import type { RecordatorioRow, CanalRecordatorio, EstadoEnvio } from "../types";
import { CANAL_CONFIG, ESTADO_CONFIG } from "../utils/badgeConfigs";
import { NuevoRecordatorioForm } from "./NuevoRecordatorioForm";

const AUTO_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;

export interface RecordatoriosScreenProps { }

function formatHoraCita(iso: string) {
  return new Date(iso).toLocaleTimeString("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Badges ───────────────────────────────────────────────────────────────────
function CanalBadge({ canal }: { canal: CanalRecordatorio }) {
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

function EstadoEnvioBadge({ estado }: { estado: EstadoEnvio }) {
  const cfg = ESTADO_CONFIG[estado];
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
      {estado}
    </span>
  );
}

function UrgenteBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#FEF2F2",
        color: "#E24B4A",
        padding: "2px 7px",
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.3px",
      }}
    >
      <Clock size={10} /> 24 h
    </span>
  );
}
// ─── Card para móvil ──────────────────────────────────────────────────────────
type Row = RecordatorioRow & Record<string, unknown>;

function ReminderCard({
  row,
  onSend,
  onRetry,
  onDiscard,
  isLoading,
}: {
  row: RecordatorioRow;
  onSend: () => void;
  onRetry: () => void;
  onDiscard: () => void;
  isLoading: boolean;
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
          gap: 8,
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
          <Avatar initials={formatInitials(row.paciente)} size={36} />
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
              {row.paciente}
            </p>
            <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
              {row.contacto}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {row.es_proximas_24h && <UrgenteBadge />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDiscard();
            }}
            disabled={isLoading}
            style={{
              background: "transparent",
              border: "none",
              color: "#888F94",
              cursor: isLoading ? "not-allowed" : "pointer",
              padding: 4,
              display: "flex",
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
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
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Hora de cita</span>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#203F49",
                margin: 0,
              }}
            >
              {formatHoraCita(row.hora_cita)}
            </p>
            <p style={{ fontSize: 11, color: "#888F94", margin: "1px 0 0" }}>
              {formatDate(row.hora_cita)}
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Estado</span>
          <EstadoEnvioBadge estado={row.estado_envio} />
        </div>
        {row.estado_envio === "Pendiente" && (
          <div style={{ paddingTop: 10 }}>
            <button
              onClick={onSend}
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                padding: "8px 0",
                borderRadius: 8,
                border: "none",
                background: "#0BC5DF",
                color: "#fff",
                fontSize: 13,
                fontWeight: 500,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <RefreshCw
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <Send size={14} />
              )}
              Enviar recordatorio
            </button>
          </div>
        )}
        {row.estado_envio === "Error" && (
          <div style={{ paddingTop: 10 }}>
            <button
              onClick={onRetry}
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                width: "100%",
                padding: "8px 0",
                borderRadius: 8,
                border: "1px solid #E24B4A",
                background: "#FEF2F2",
                color: "#E24B4A",
                fontSize: 13,
                fontWeight: 500,
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <RefreshCw
                  size={14}
                  style={{ animation: "spin 1s linear infinite" }}
                />
              ) : (
                <RotateCcw size={14} />
              )}
              Reintentar envío
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export function RecordatoriosScreen(_props: RecordatoriosScreenProps) {
  const { isMobile, isTablet } = useResponsive();

  const [rows, setRows] = useState<RecordatorioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [openDrawer, setOpenDrawer] = useState<
    "pendientes" | "enviados" | "errores" | "urgentes" | null
  >(null);
  const [discardRow, setDiscardRow] = useState<RecordatorioRow | null>(null);

  useEffect(() => {
    const id = "reminders-spin-keyframe";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent =
        "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
      document.head.appendChild(style);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    let isMounted = true;
    try {
      setLoading(true);
      setError(null);
      const res = await ReminderService.getQueue();
      if (!isMounted) return;
      if (res.success) {
        const sorted = [...res.data].sort((a, b) => {
          if (a.es_proximas_24h !== b.es_proximas_24h)
            return a.es_proximas_24h ? -1 : 1;
          return (
            new Date(a.hora_cita).getTime() - new Date(b.hora_cita).getTime()
          );
        });
        setRows(sorted);
        setLastSync(new Date());
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error("[RecordatoriosScreen]", err);
      if (isMounted) {
        setError("No se pudo cargar la lista de recordatorios.");
        setRows([]);
      }
    } finally {
      if (isMounted) setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    const interval = setInterval(fetchQueue, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Acciones de fila
  async function handleSend(row: RecordatorioRow) {
    setActionLoadingId(row.id);
    setActionError(null);
    try {
      const res = await ReminderService.send({ id_cita: row.id_cita, canal: row.canal });
      
      if (row.canal === "WhatsApp" && res.data && (res.data as any).whatsappMessage) {
        const cleanPhone = row.contacto.replace(/\D/g, "");
        const phoneWithCountry = cleanPhone.startsWith("504") ? cleanPhone : `504${cleanPhone}`;
        const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent((res.data as any).whatsappMessage)}`;
        window.open(url, "_blank");
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, estado_envio: "Enviado" } : r
        )
      );
    } catch (err: any) {
      setActionError(err?.message || "Ocurrió un error al enviar el recordatorio.");
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, estado_envio: "Error" } : r
        )
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRetry(row: RecordatorioRow) {
    setActionLoadingId(row.id);
    setActionError(null);
    try {
      const realId = parseInt(row.id.replace('rec-', ''), 10);
      const res = await ReminderService.retry(realId);

      if (row.canal === "WhatsApp" && res.data && (res.data as any).whatsappMessage) {
        const cleanPhone = row.contacto.replace(/\D/g, "");
        const phoneWithCountry = cleanPhone.startsWith("504") ? cleanPhone : `504${cleanPhone}`;
        const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent((res.data as any).whatsappMessage)}`;
        window.open(url, "_blank");
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, estado_envio: "Enviado" } : r
        )
      );
    } catch (err: any) {
      setActionError(err?.message || "Ocurrió un error al reintentar el envío.");
      /* estado permanece en Error */
    } finally {
      setActionLoadingId(null);
    }
  }

  function initiateDiscard(row: RecordatorioRow) {
    setDiscardRow(row);
  }

  async function confirmDiscard() {
    if (!discardRow) return;
    console.log("🟢 Inicia confirmDiscard para:", discardRow.id);
    setActionLoadingId(discardRow.id);
    try {
      console.log("🟠 Llamando a ReminderService.discardReminder...");
      const res = await ReminderService.discardReminder(discardRow.id);
      console.log("✅ Promesa resuelta:", res);
      setRows((prev) => prev.filter((r) => r.id !== discardRow.id));
      setDiscardRow(null);
      console.log("✅ Estado actualizado para cerrar modal");
    } catch (e) {
      console.error("❌ Error en discardReminder:", e);
      setDiscardRow(null);
    } finally {
      console.log("🏁 Bloque finally ejecutado");
      setActionLoadingId(null);
    }
  }

  const stats = useMemo(
    () => ({
      total: rows.length,
      pendientes: rows.filter((r) => r.estado_envio === "Pendiente").length,
      enviados: rows.filter((r) => r.estado_envio === "Enviado").length,
      errores: rows.filter((r) => r.estado_envio === "Error").length,
      urgentes: rows.filter((r) => r.es_proximas_24h).length,
    }),
    [rows]
  );

  // Filtros compartidos entre móvil y DataTable
  const [mobileSearch, setMobileSearch] = useState("");
  const [mobileFilterEstado, setMobileFilterEstado] = useState("");
  const [mobileFilterCanal, setMobileFilterCanal] = useState("");

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        const matchSearch =
          !mobileSearch ||
          matchesNormalizedSearch(`${r.paciente} ${r.contacto}`, mobileSearch);
        const matchEstado =
          !mobileFilterEstado || r.estado_envio === mobileFilterEstado;
        const matchCanal = !mobileFilterCanal || r.canal === mobileFilterCanal;
        return matchSearch && matchEstado && matchCanal;
      }),
    [rows, mobileSearch, mobileFilterEstado, mobileFilterCanal]
  );

  // Fix 6: cards en móvil Y tablet — DataTable solo en desktop
  const showCards = isMobile || isTablet;

  const columns = useMemo(
    () => [
      {
        key: "paciente",
        label: "Paciente",
        width: "25%",
        render: (_: unknown, row: Row) => (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar
              initials={formatInitials(row.paciente as string)}
              size={32}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>
                {row.paciente as string}
              </span>
              {row.es_proximas_24h && <UrgenteBadge />}
            </div>
          </div>
        ),
      },
      {
        key: "contacto",
        label: "Contacto",
        width: "18%",
        render: (_: unknown, row: Row) => (
          <span style={{ fontSize: 13, color: "#5F656A" }}>
            {row.contacto as string}
          </span>
        ),
      },
      {
        key: "canal",
        label: "Canal",
        width: "12%",
        render: (_: unknown, row: Row) => (
          <CanalBadge canal={row.canal as CanalRecordatorio} />
        ),
      },
      {
        key: "hora_cita",
        label: "Hora de cita",
        width: "16%",
        render: (_: unknown, row: Row) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>
              {formatHoraCita(row.hora_cita as string)}
            </span>
            <span style={{ fontSize: 11, color: "#888F94" }}>
              {formatDate(row.hora_cita as string)}
            </span>
          </div>
        ),
      },
      {
        key: "estado_envio",
        label: "Estado",
        width: "14%",
        render: (_: unknown, row: Row) => (
          <EstadoEnvioBadge estado={row.estado_envio as EstadoEnvio} />
        ),
      },
    ],
    []
  );

  // Grid de KPIs: 4 en desktop, 2x2 en tablet/móvil
  const kpiCols = isMobile || isTablet ? "1fr 1fr" : "repeat(4, 1fr)";

  const kpis = [
    {
      key: "pendientes" as const,
      label: "Pendientes",
      value: stats.pendientes,
      color: "#EF9F27",
      bg: "#FFF8EC",
    },
    {
      key: "enviados" as const,
      label: "Enviados",
      value: stats.enviados,
      color: "#1D9E75",
      bg: "#ECFDF5",
    },
    {
      key: "errores" as const,
      label: "Con error",
      value: stats.errores,
      color: "#E24B4A",
      bg: "#FEF2F2",
    },
    {
      key: "urgentes" as const,
      label: "Próximas 24 h",
      value: stats.urgentes,
      color: "#0BC5DF",
      bg: "#E6F8FB",
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 20,
      }}
    >
      {actionError && (
        <Alert
          variant="error"
          message={actionError}
          onClose={() => setActionError(null)}
        />
      )}

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: kpiCols,
          gap: isMobile ? 10 : 12,
        }}
      >
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
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

      {/* Última sincronización */}
      {lastSync && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "#888F94",
          }}
        >
          <RefreshCw size={11} />
          Última actualización:{" "}
          {lastSync.toLocaleTimeString("es-HN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {!isMobile && " · Se actualiza automáticamente cada 24 horas"}
        </div>
      )}

      {/* Móvil+Tablet: cards / Desktop: DataTable */}
      {showCards ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Botón nuevo */}
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: "#0BC5DF",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Nuevo recordatorio
          </button>
          {/* Búsqueda */}
          <input
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
            placeholder="Buscar paciente o contacto..."
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
              value={mobileFilterEstado}
              onChange={(e) => setMobileFilterEstado(e.target.value)}
              style={{
                flex: 1,
                height: 42,
                padding: "0 10px",
                border: "1px solid #D3D7DA",
                borderRadius: 8,
                background: "#fff",
                fontSize: 12,
                color: mobileFilterEstado ? "#203F49" : "#888F94",
                outline: "none",
              }}
            >
              <option value="">Estado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Enviado">Enviado</option>
              <option value="Error">Error</option>
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
              <option value="Correo">Correo</option>
            </select>
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
              Cargando recordatorios...
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
              No hay recordatorios que coincidan.
            </p>
          ) : (
            filteredRows.map((row) => (
              <ReminderCard
                key={row.id}
                row={row as Row}
                isLoading={actionLoadingId === row.id}
                onSend={() => handleSend(row)}
                onRetry={() => handleRetry(row)}
                onDiscard={() => initiateDiscard(row as unknown as RecordatorioRow)}
              />
            ))
          )}
        </div>
      ) : (
        <DataTable<Row>
          columns={columns}
          data={filteredRows as Row[]}
          title="Cola de recordatorios"
          description="Citas con recordatorio pendiente de envío"
          searchable
          searchPlaceholder="Buscar paciente o contacto..."
          searchKeys={["paciente", "contacto"]}
          primaryAction={{
            label: "Nuevo recordatorio",
            icon: <Plus size={16} />,
            onClick: () => setModalOpen(true),
          }}
          filters={[
            {
              key: "estado_envio",
              placeholder: "Estado de envío",
              options: [
                { value: "Pendiente", label: "Pendiente" },
                { value: "Enviado", label: "Enviado" },
                { value: "Error", label: "Error" },
              ],
            },
            {
              key: "canal",
              placeholder: "Canal",
              options: [
                { value: "WhatsApp", label: "WhatsApp" },
                { value: "Correo", label: "Correo" },
              ],
            },
          ]}
          secondaryActions={[
            {
              label: loading ? "Actualizando..." : "Actualizar",
              icon: <RefreshCw size={14} />,
              onClick: fetchQueue,
            },
          ]}
          rowActions={(row) => {
            const isLoading = actionLoadingId === row.id;
            const actions = [];

            if (row.estado_envio === "Pendiente") {
              actions.push({
                icon: isLoading ? (
                  <RefreshCw
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <Send size={16} />
                ),
                label: "Enviar recordatorio",
                onClick: (r: any) =>
                  handleSend(r as RecordatorioRow),
              });
            } else if (row.estado_envio === "Error") {
              actions.push({
                icon: isLoading ? (
                  <RefreshCw
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  <RotateCcw size={16} />
                ),
                label: "Reintentar envío",
                onClick: (r: any) =>
                  handleRetry(r as RecordatorioRow),
                danger: false,
              });
            }

            actions.push({
              icon: <Trash2 size={16} />,
              label: "Descartar",
              onClick: (r: any) =>
                initiateDiscard(r as RecordatorioRow),
              danger: true,
            });

            return actions;
          }}
          getRowKey={(row) => String(row.id)}
          pageSize={15}
          emptyMessage={
            loading
              ? "Cargando recordatorios..."
              : error ?? "No hay recordatorios pendientes."
          }
        />
      )}

      <NuevoRecordatorioForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchQueue}
      />

      {/* Drawers de KPIs */}
      {(
        [
          {
            key: "pendientes",
            title: "Pendientes",
            subtitle: "Recordatorios aún no enviados",
            filter: (r: RecordatorioRow) => r.estado_envio === "Pendiente",
          },
          {
            key: "enviados",
            title: "Enviados",
            subtitle: "Recordatorios enviados correctamente",
            filter: (r: RecordatorioRow) => r.estado_envio === "Enviado",
          },
          {
            key: "errores",
            title: "Con error",
            subtitle: "Recordatorios que fallaron al enviar",
            filter: (r: RecordatorioRow) => r.estado_envio === "Error",
          },
          {
            key: "urgentes",
            title: "Próximas 24 h",
            subtitle: "Citas que ocurren en las próximas 24 horas",
            filter: (r: RecordatorioRow) => r.es_proximas_24h,
          },
        ] as const
      ).map(({ key, title, subtitle, filter }) => {
        const drawerRows = rows.filter(filter);
        return (
          <StatsDrawer
            key={key}
            open={openDrawer === key}
            onClose={() => setOpenDrawer(null)}
            title={title}
            subtitle={subtitle}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {drawerRows.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    color: "#888F94",
                    fontSize: 14,
                    padding: 24,
                    margin: 0,
                  }}
                >
                  No hay recordatorios en esta categoría.
                </p>
              ) : (
                drawerRows.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      padding: 14,
                      border: "1px solid #F0F2F4",
                      borderRadius: 8,
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#203F49",
                          }}
                        >
                          {row.paciente}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color: "#888F94",
                          }}
                        >
                          {row.contacto}
                        </p>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 4,
                        }}
                      >
                        {row.es_proximas_24h && <UrgenteBadge />}
                        <CanalBadge canal={row.canal} />
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: 8,
                        borderTop: "1px solid #F8F9FA",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#888F94" }}>
                        {formatHoraCita(row.hora_cita)} •{" "}
                        {formatDate(row.hora_cita)}
                      </span>
                      <EstadoEnvioBadge estado={row.estado_envio} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </StatsDrawer>
        );
      })}

      <ConfirmModal
        open={!!discardRow}
        onClose={() => setDiscardRow(null)}
        onConfirm={confirmDiscard}
        variant="danger"
        title="Descartar Recordatorio"
        description={`¿Estás seguro que deseas eliminar este recordatorio de la cola de envío para ${discardRow?.paciente}?`}
        confirmLabel="Descartar"
        cancelLabel="Cancelar"
        loading={!!discardRow && actionLoadingId === discardRow.id}
      />
    </div>
  );
}
