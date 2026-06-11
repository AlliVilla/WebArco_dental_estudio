import type { ReactNode } from "react";
import {
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { Button, Card, Input, Select } from "../../../context";
import { statusOptions } from "./consentData";

interface ConsentSearchCardProps {
  searchPatient: string;
  searchProcedure: string;
  searchDoctor: string;
  searchStatus: string;
  totalConsents: number;
  totalFirmados: number;
  totalPendientesDoctor: number;
  hasAnyConsentFilter: boolean;
  hasSearchedConsents: boolean;
  onPatientChange: (value: string) => void;
  onProcedureChange: (value: string) => void;
  onDoctorChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  onNewConsent: () => void;
}

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "primary" | "success" | "warning";
}) {
  const map = {
    primary: {
      bg: "#E6F8FB",
      color: "#0BC5DF",
      valueColor: "#0BC5DF",
    },
    success: {
      bg: "#ECFDF5",
      color: "#1D9E75",
      valueColor: "#1D9E75",
    },
    warning: {
      bg: "#FFFBEB",
      color: "#EF9F27",
      valueColor: "#EF9F27",
    },
  };

  const selected = map[tone];

  return (
    <Card
      style={{
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        minHeight: 88,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#888F94",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: selected.valueColor,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
      </div>

      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: selected.bg,
          color: selected.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    </Card>
  );
}

export function ConsentSearchCard({
  searchPatient,
  searchProcedure,
  searchDoctor,
  searchStatus,
  totalConsents,
  totalFirmados,
  totalPendientesDoctor,
  hasAnyConsentFilter,
  hasSearchedConsents,
  onPatientChange,
  onProcedureChange,
  onDoctorChange,
  onStatusChange,
  onSearch,
  onClear,
  onNewConsent,
}: ConsentSearchCardProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <MetricCard
          label="Total"
          value={totalConsents}
          icon={<FileText size={22} />}
          tone="primary"
        />
        <MetricCard
          label="Firmados"
          value={totalFirmados}
          icon={<CheckCircle2 size={22} />}
          tone="success"
        />
        <MetricCard
          label="Pendientes doctor"
          value={totalPendientesDoctor}
          icon={<Clock3 size={22} />}
          tone="warning"
        />
      </div>

      <Card style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h3
              style={{
                margin: 0,
                color: "#203F49",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Filtros de búsqueda
            </h3>

            <p
              style={{
                margin: 0,
                color: "#888F94",
                fontSize: 12,
                lineHeight: "18px",
              }}
            >
              Busca consentimientos por paciente, procedimiento, doctor o estado
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <Input
              label="Búsqueda por paciente"
              badge="optional"
              placeholder="Ej: María López"
              value={searchPatient}
              onChange={(event) => onPatientChange(event.target.value)}
              icon={<UserRound size={15} />}
            />

            <Input
              label="Búsqueda por procedimiento"
              badge="optional"
              placeholder="Ej: Extracción de molar"
              value={searchProcedure}
              onChange={(event) => onProcedureChange(event.target.value)}
              icon={<FileText size={15} />}
            />

            <Input
              label="Búsqueda por doctor"
              badge="optional"
              placeholder="Ej: Dr. Carlos Medina"
              value={searchDoctor}
              onChange={(event) => onDoctorChange(event.target.value)}
              icon={<ShieldCheck size={15} />}
            />

            <Select
              label="Estado del consentimiento"
              badge="optional"
              placeholder="Todos los estados"
              value={searchStatus}
              onChange={onStatusChange}
              options={statusOptions}
            />
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Button
              variant="primary"
              type="button"
              onClick={onSearch}
              disabled={!hasAnyConsentFilter}
              style={{ flex: "1 1 320px" }}
            >
              <Search size={16} />
              Buscar consentimiento
            </Button>

            <Button
              variant="secondary"
              type="button"
              onClick={onClear}
              disabled={!hasAnyConsentFilter && !hasSearchedConsents}
            >
              <X size={16} />
              Limpiar filtros
            </Button>

            <Button variant="primary" type="button" onClick={onNewConsent}>
              <Plus size={16} />
              Nuevo Consentimiento
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}