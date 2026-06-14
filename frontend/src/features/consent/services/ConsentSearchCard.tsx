import { CheckCircle2, Clock3, FileText } from "lucide-react";
import { Card } from "../../../context";
import { useResponsive } from "../../../hooks/useWindowWidth";

interface ConsentSearchCardProps {
  totalConsents: number;
  totalFirmados: number;
  totalPendientesDoctor: number;
}

function ConsentSummaryCard({
  label,
  value,
  icon,
  color,
  background,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  background: string;
}) {
  return (
    <Card>
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
            {label}
          </p>
          <p
            style={{
              fontSize: 24,
              fontWeight: 700,
              color,
              margin: 0,
              lineHeight: 1,
            }}
          >
            {value}
          </p>
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background,
            color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function ConsentSearchCard({
  totalConsents,
  totalFirmados,
  totalPendientesDoctor,
}: ConsentSearchCardProps) {
  const { isMobile } = useResponsive();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
        gap: 16,
      }}
    >
      <ConsentSummaryCard
        label="Total"
        value={totalConsents}
        icon={<FileText size={20} />}
        color="#0BC5DF"
        background="#E6F8FB"
      />
      <ConsentSummaryCard
        label="Firmados"
        value={totalFirmados}
        icon={<CheckCircle2 size={20} />}
        color="#1D9E75"
        background="#ECFDF5"
      />
      <ConsentSummaryCard
        label="Pendientes doctor"
        value={totalPendientesDoctor}
        icon={<Clock3 size={20} />}
        color="#EF9F27"
        background="#FFFBEB"
      />
    </div>
  );
}
