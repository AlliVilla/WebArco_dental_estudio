import { CheckCircle2, Clock3, FileText } from "lucide-react";
import { Card } from "../../../context";
import { useResponsive } from "../../../hooks/useWindowWidth";
import { StatsDrawer } from "../../../components";
import { useState } from "react";
import type { ConsentRecord } from "../types";
import { getStatusMeta } from "../services/consentUtils";

interface ConsentSearchCardProps {
  totalConsents: number;
  totalFirmados: number;
  totalPendientesDoctor: number;
  consents: ConsentRecord[];
}

function StatusBadge({ estado }: { estado: string }) {
  const meta = getStatusMeta(estado as Parameters<typeof getStatusMeta>[0]);
  return (
    <span
      style={{
        background: meta.background,
        color: meta.color,
        borderRadius: 20,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {meta.label}
    </span>
  );
}

function DrawerItem({ row }: { row: ConsentRecord }) {
  return (
    <div style={{ padding: 14, borderRadius: 10, border: "1px solid #D3D7DA" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 13,
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
            {row.procedimiento}
          </p>
        </div>
        <StatusBadge estado={row.estado} />
      </div>
      <p style={{ fontSize: 11, color: "#888F94", margin: 0 }}>
        {row.doctor} · {row.fecha}
      </p>
    </div>
  );
}

export function ConsentSearchCard({
  totalConsents,
  totalFirmados,
  totalPendientesDoctor,
  consents,
}: ConsentSearchCardProps) {
  const { isMobile } = useResponsive();
  const [openDrawer, setOpenDrawer] = useState<
    "total" | "firmados" | "pendientes" | null
  >(null);

  const kpis = [
    {
      key: "total" as const,
      label: "Total",
      value: totalConsents,
      icon: <FileText size={20} />,
      color: "#0BC5DF",
      bg: "#E6F8FB",
      items: consents,
    },
    {
      key: "firmados" as const,
      label: "Firmados",
      value: totalFirmados,
      icon: <CheckCircle2 size={20} />,
      color: "#1D9E75",
      bg: "#ECFDF5",
      items: consents.filter((c) => c.estado === "firmado"),
    },
    {
      key: "pendientes" as const,
      label: "Pendientes doctor",
      value: totalPendientesDoctor,
      icon: <Clock3 size={20} />,
      color: "#EF9F27",
      bg: "#FFFBEB",
      items: consents.filter((c) => c.estado === "pendiente_doctor"),
    },
  ];

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
          gap: 16,
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
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
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
            <Card style={{ border: "none", boxShadow: "none" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 56,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#888F94",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      margin: "0 0 8px 0",
                    }}
                  >
                    {kpi.label}
                  </p>
                  <p
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: kpi.color,
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {kpi.value}
                  </p>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: kpi.bg,
                    color: kpi.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {kpi.icon}
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>

      {kpis.map(({ key, label, items }) => (
        <StatsDrawer
          key={key}
          open={openDrawer === key}
          title={label}
          subtitle={`${items.length} consentimiento${
            items.length !== 1 ? "s" : ""
          }`}
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
              items.map((row) => <DrawerItem key={row.id} row={row} />)
            )}
          </div>
        </StatsDrawer>
      ))}
    </>
  );
}
