import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Card, StatusBadge, Avatar, Alert } from "../context";
import { useResponsive } from "../hooks/useWindowWidth";
import { useAuthStore } from "../features/auth/hooks/useAuthStore";
import { dashboardService } from "../features/dashboard/services/dashboardService";
import type {
  DashboardAppointment,
  DashboardFinancialSummary,
  DashboardGeneralSummary,
  DashboardRevenueData,
  DashboardWeekData,
} from "../features/dashboard/types";

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-HN").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 2,
  }).format(value);
}

function BarChartSVG({ data }: { data: DashboardWeekData[] }) {
  const W = 420,
    H = 160,
    padL = 28,
    padB = 24,
    padR = 12,
    padT = 8;
  const maxVal = Math.max(1, ...data.map((d) => d.citas));
  const chartW = W - padL - padR;
  const chartH = H - padB - padT;
  const groupW = chartW / Math.max(1, data.length);
  const barW = Math.floor(groupW * 0.28);
  const gap = 3;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 160 }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padT + chartH * (1 - t);
        return (
          <g key={`grid-${t}`}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              stroke="#F1F3F4"
              strokeWidth={1}
            />
            <text
              x={padL - 4}
              y={y + 4}
              textAnchor="end"
              fontSize={9}
              fill="#888F94"
            >
              {Math.round(maxVal * t)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = padL + groupW * i + groupW / 2;
        const hCitas = (d.citas / maxVal) * chartH;
        const hAten = (d.atendidas / maxVal) * chartH;
        return (
          <g key={`bar-group-${i}`}>
            <rect
              x={cx - barW - gap / 2}
              y={padT + chartH - hCitas}
              width={barW}
              height={hCitas}
              fill="#B2EDF5"
              rx={3}
            />
            <rect
              x={cx + gap / 2}
              y={padT + chartH - hAten}
              width={barW}
              height={hAten}
              fill="#0BC5DF"
              rx={3}
            />
            <text
              x={cx}
              y={H - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#888F94"
            >
              {d.day}
            </text>
          </g>
        );
      })}
      <rect x={padL} y={H - 8} width={8} height={8} fill="#B2EDF5" rx={2} />
      <text x={padL + 11} y={H - 1} fontSize={9} fill="#888F94">
        Programadas
      </text>
      <rect
        x={padL + 80}
        y={H - 8}
        width={8}
        height={8}
        fill="#0BC5DF"
        rx={2}
      />
      <text x={padL + 91} y={H - 1} fontSize={9} fill="#888F94">
        Atendidas
      </text>
    </svg>
  );
}

function LineChartSVG({ data }: { data: DashboardRevenueData[] }) {
  const W = 420,
    H = 160,
    padL = 48,
    padB = 24,
    padR = 12,
    padT = 8;
  const safeData = data.length > 0 ? data : [{ month: "", monto: 0 }];
  const chartW = W - padL - padR;
  const chartH = H - padB - padT;
  const minVal = Math.min(0, ...safeData.map((d) => d.monto));
  const maxVal = Math.max(1, ...safeData.map((d) => d.monto));
  const range = maxVal - minVal || 1;
  const divisor = Math.max(1, safeData.length - 1);
  const px = (i: number) => padL + (i / divisor) * chartW;
  const py = (v: number) => padT + chartH - ((v - minVal) / range) * chartH;
  const pathD = safeData
    .map((d, i) => `${i === 0 ? "M" : "L"}${px(i)},${py(d.monto)}`)
    .join(" ");
  const areaD = `${pathD} L${px(safeData.length - 1)},${padT + chartH} L${px(0)},${
    padT + chartH
  } Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 160 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0BC5DF" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#0BC5DF" stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => {
        const y = padT + chartH * (1 - t);
        const val = minVal + range * t;
        return (
          <g key={`lg-${t}`}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              stroke="#F1F3F4"
              strokeWidth={1}
            />
            <text
              x={padL - 4}
              y={y + 4}
              textAnchor="end"
              fontSize={9}
              fill="#888F94"
            >
              L {Math.round(val / 1000)}k
            </text>
          </g>
        );
      })}
      <path d={areaD} fill="url(#lineGrad)" />
      <path
        d={pathD}
        fill="none"
        stroke="#0BC5DF"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {safeData.map((d, i) => (
        <g key={`dot-${i}`}>
          <circle cx={px(i)} cy={py(d.monto)} r={4} fill="#0BC5DF" />
          <text
            x={px(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            fill="#888F94"
          >
            {d.month}
          </text>
        </g>
      ))}
    </svg>
  );
}

function AppointmentCard({ appt }: { appt: DashboardAppointment }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "0.5px solid #D3D7DA",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            initials={appt.avatar}
            size={36}
            color={appt.status === "atendida" ? "#888F94" : "#0BC5DF"}
          />
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#203F49",
                margin: 0,
              }}
            >
              {appt.patient}
            </p>
            <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
              {appt.treatment}
            </p>
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          fontWeight: 500,
          color: "#203F49",
        }}
      >
        <Clock size={13} style={{ color: "#0BC5DF" }} />
        {appt.time}
      </div>
    </div>
  );
}

export function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const user = useAuthStore((s) => s.user);
  const canViewFinancial = user?.privilegios?.includes(2) ?? false;
  const [generalSummary, setGeneralSummary] = useState<DashboardGeneralSummary | null>(null);
  const [financialSummary, setFinancialSummary] = useState<DashboardFinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<{
    message: string;
    type: "info" | "warning" | "error";
  } | null>(null);

  useEffect(() => {
    const state = location.state as Record<string, unknown> | null;
    if (state?.noPermission) {
      const section = (state.section as string) || "esta sección";
      setAlert({
        message: `No tienes permisos suficientes para acceder a ${section}.`,
        type: "warning",
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const generalResponse = await dashboardService.getGeneralSummary();
        if (!cancelled && generalResponse.success) {
          setGeneralSummary(generalResponse.data);
        }

        if (canViewFinancial) {
          try {
            const financialResponse = await dashboardService.getFinancialSummary();
            if (!cancelled && financialResponse.success) {
              setFinancialSummary(financialResponse.data);
            }
          } catch {
            if (!cancelled) {
              setFinancialSummary(null);
            }
          }
        } else if (!cancelled) {
          setFinancialSummary(null);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          const message =
            error && typeof error === "object" && "message" in error
              ? String((error as { message: string }).message)
              : "No se pudo cargar el dashboard.";
          setAlert({ message, type: "error" });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [canViewFinancial]);

  const kpis = useMemo(() => {
    if (!generalSummary) return [];

    const items = [
      {
        label: "Citas hoy",
        value: formatNumber(generalSummary.kpis.citasHoy.value),
        sub: generalSummary.kpis.citasHoy.sub,
        icon: Calendar,
        color: "#0BC5DF",
        bg: "#E6F8FB",
      },
      {
        label: "Pacientes activos",
        value: formatNumber(generalSummary.kpis.pacientesActivos.value),
        sub: generalSummary.kpis.pacientesActivos.sub,
        icon: Users,
        color: "#1D9E75",
        bg: "#ECFDF5",
      },
      canViewFinancial && financialSummary
        ? {
            label: "Ingresos del mes",
            value: formatCurrency(financialSummary.kpis.ingresosMes.value),
            sub: financialSummary.kpis.ingresosMes.sub,
            icon: TrendingUp,
            color: "#EF9F27",
            bg: "#FFFBEB",
          }
        : {
            label: "Consultas del mes",
            value: formatNumber(generalSummary.kpis.consultasMes.value),
            sub: generalSummary.kpis.consultasMes.sub,
            icon: FileText,
            color: "#EF9F27",
            bg: "#FFFBEB",
          },
      {
        label: "Pendientes hoy",
        value: formatNumber(generalSummary.kpis.pendientesHoy.value),
        sub: generalSummary.kpis.pendientesHoy.sub,
        icon: AlertCircle,
        color: "#E24B4A",
        bg: "#FEF2F2",
      },
    ];

    return items;
  }, [canViewFinancial, financialSummary, generalSummary]);

  const kpiCols = isMobile
    ? "1fr 1fr"
    : isTablet
    ? "repeat(2, 1fr)"
    : "repeat(4, 1fr)";
  const chartCols = isMobile || isTablet || !canViewFinancial ? "1fr" : "1fr 1fr";
  const agendaHoy = generalSummary?.agendaHoy ?? [];
  const citasSemana = generalSummary?.citasSemana ?? [];
  const ingresosPorMes = financialSummary?.ingresosPorMes ?? [];

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
          variant={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {isLoading ? (
        <Card>
          <div style={{ fontSize: 13, color: "#888F94" }}>
            Cargando información del dashboard...
          </div>
        </Card>
      ) : null}

      {!isLoading && !generalSummary ? (
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#203F49" }}>
            No se pudo cargar la información del dashboard.
          </div>
          <div style={{ fontSize: 12, color: "#888F94", marginTop: 4 }}>
            Verifica tu conexión o tus permisos e intenta nuevamente.
          </div>
        </Card>
      ) : null}

      {generalSummary ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: kpiCols,
              gap: isMobile ? 10 : 16,
            }}
          >
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: "#888F94",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 6,
                        }}
                      >
                        {kpi.label}
                      </div>
                      <div
                        style={{
                          fontSize: isMobile ? 22 : 26,
                          fontWeight: 600,
                          color: "#203F49",
                          lineHeight: 1,
                        }}
                      >
                        {kpi.value}
                      </div>
                      <div style={{ fontSize: 11, color: "#888F94", marginTop: 4 }}>
                        {kpi.sub}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: kpi.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      <Icon size={16} style={{ color: kpi.color }} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: chartCols,
              gap: isMobile ? 10 : 16,
            }}
          >
            <Card>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#203F49",
                  marginBottom: 4,
                }}
              >
                Citas — Esta semana
              </div>
              <div style={{ fontSize: 11, color: "#888F94", marginBottom: 16 }}>
                Programadas vs. atendidas
              </div>
              <BarChartSVG data={citasSemana} />
            </Card>

            {canViewFinancial && financialSummary ? (
              <Card>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#203F49",
                    marginBottom: 4,
                  }}
                >
                  Ingresos — {new Date().getFullYear()}
                </div>
                <div style={{ fontSize: 11, color: "#888F94", marginBottom: 16 }}>
                  Facturación mensual en lempiras
                </div>
                <LineChartSVG data={ingresosPorMes} />
              </Card>
            ) : null}
          </div>

          <Card>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#203F49" }}>
                  Agenda de hoy
                </div>
                <div style={{ fontSize: 11, color: "#888F94", marginTop: 2 }}>
                  {new Date()
                    .toLocaleDateString("es-HN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                    .replace(/^\w/, (c) => c.toUpperCase())}
                </div>
              </div>
              <button
                onClick={() => navigate("/agenda")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#0BC5DF",
                  fontWeight: 500,
                }}
              >
                Ver agenda <ChevronRight size={13} />
              </button>
            </div>

            {agendaHoy.length === 0 ? (
              <div
                style={{
                  border: "0.5px dashed #D3D7DA",
                  borderRadius: 10,
                  padding: 18,
                  color: "#888F94",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                No hay citas programadas para hoy.
              </div>
            ) : isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {agendaHoy.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  overflowX: "auto",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isTablet
                      ? "60px 1fr 1fr 130px"
                      : "70px 1fr 200px 140px",
                    padding: "8px 12px",
                    background: "#F8F9FA",
                    borderRadius: "8px 8px 0 0",
                    borderBottom: "0.5px solid #D3D7DA",
                    minWidth: isTablet ? 400 : "unset",
                  }}
                >
                  {["Hora", "Paciente", "Tratamiento", "Estado"].map((h) => (
                    <span
                      key={h}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#888F94",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {agendaHoy.map((appt, i) => (
                  <div
                    key={appt.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: isTablet
                        ? "60px 1fr 1fr 130px"
                        : "70px 1fr 200px 140px",
                      padding: "12px 12px",
                      alignItems: "center",
                      background: i % 2 === 0 ? "#FFFFFF" : "#F8F9FA",
                      borderBottom:
                        i < agendaHoy.length - 1 ? "0.5px solid #F1F3F4" : "none",
                      cursor: "pointer",
                      transition: "background 0.1s",
                      borderRadius: i === agendaHoy.length - 1 ? "0 0 8px 8px" : 0,
                      minWidth: isTablet ? 400 : "unset",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#E6F8FB")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        i % 2 === 0 ? "#FFFFFF" : "#F8F9FA")
                    }
                    onClick={() => navigate(`/agenda/${appt.id}`)}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#203F49",
                      }}
                    >
                      <Clock size={12} style={{ color: "#0BC5DF" }} />
                      {appt.time}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar
                        initials={appt.avatar}
                        size={30}
                        color={appt.status === "atendida" ? "#888F94" : "#0BC5DF"}
                      />
                      <span style={{ fontSize: 13, color: "#203F49" }}>
                        {appt.patient}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, color: "#5F656A" }}>
                      {appt.treatment}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}
