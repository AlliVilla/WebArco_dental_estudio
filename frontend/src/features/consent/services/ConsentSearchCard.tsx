import { FileText, Plus, Search, ShieldCheck, UserRound, X } from "lucide-react";
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

function SummaryChip({ label, value, variant }: { label: string; value: number; variant: "primary" | "success" | "warning" }) {
  const styles = {
    primary: { background: "var(--arco-primary-light)", color: "var(--arco-primary)" },
    success: { background: "var(--arco-success-soft)", color: "var(--arco-success)" },
    warning: { background: "var(--arco-warning-soft)", color: "var(--arco-warning)" },
  }[variant];

  return (
    <div style={{ alignItems: "center", background: styles.background, borderRadius: 12, color: styles.color, display: "flex", gap: 10, padding: "10px 12px" }}>
      <span style={{ fontSize: 18, fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
    </div>
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
    <Card>
      <div style={{ alignItems: "flex-start", display: "flex", gap: 16, justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ color: "var(--arco-navy)", fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>Filtros de búsqueda</h3>
          <p style={{ color: "var(--arco-gray-500)", fontSize: 12, margin: 0 }}>Busca consentimientos por paciente, procedimiento, doctor o estado</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
          <SummaryChip label="Total" value={totalConsents} variant="primary" />
          <SummaryChip label="Firmados" value={totalFirmados} variant="success" />
          <SummaryChip label="Pendientes doctor" value={totalPendientesDoctor} variant="warning" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }}>
        <Input label="Búsqueda por paciente" badge="optional" placeholder="Ej: María López" value={searchPatient} onChange={(event) => onPatientChange(event.target.value)} icon={<UserRound size={15} />} />
        <Input label="Búsqueda por procedimiento" badge="optional" placeholder="Ej: Extracción de molar" value={searchProcedure} onChange={(event) => onProcedureChange(event.target.value)} icon={<FileText size={15} />} />
        <Input label="Búsqueda por doctor" badge="optional" placeholder="Ej: Dr. Carlos Medina" value={searchDoctor} onChange={(event) => onDoctorChange(event.target.value)} icon={<ShieldCheck size={15} />} />
        <Select label="Estado del consentimiento" badge="optional" placeholder="Todos los estados" value={searchStatus} onChange={onStatusChange} options={statusOptions} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Button variant="primary" type="button" onClick={onSearch} disabled={!hasAnyConsentFilter} style={{ flex: "1 1 220px" }}>
          <Search size={16} />
          Buscar consentimiento
        </Button>
        <Button variant="secondary" type="button" onClick={onClear} disabled={!hasAnyConsentFilter && !hasSearchedConsents}>
          <X size={16} />
          Limpiar filtros
        </Button>
        <Button variant="primary" type="button" onClick={onNewConsent}>
          <Plus size={16} />
          Nuevo Consentimiento
        </Button>
      </div>
    </Card>
  );
}
