import { useState, useMemo } from "react";
import { Download, Edit3, Eye, Plus, Printer } from "lucide-react";
import { DataTable } from "../../../components";
import type { Column, RowAction } from "../../../components";
import type { ConsentRecord, ConsentStatus } from "../types";
import { statusOptions } from "../services/consentData";
import { getStatusMeta } from "../services/consentUtils";
import { printConsentDocuments } from "../services/printConsentDocuments";
import { useResponsive } from "../../../hooks/useWindowWidth";
import { normalizeSearch } from "../../../utils/formatters";

interface ConsentListTableProps {
  consents: ConsentRecord[];
  onPreview: (id: string) => void;
  onEdit: (consent: ConsentRecord) => void;
  onNewConsent: () => void;
  onExport: () => void;
}

function StatusBadge({ value }: { value: ConsentStatus }) {
  const meta = getStatusMeta(value);
  return (
    <span
      style={{
        background: meta.background,
        color: meta.color,
        borderRadius: 20,
        padding: "4px 10px",
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

function ConsentCard({
  row,
  onPreview,
  onEdit,
  onPrint,
}: {
  row: ConsentRecord;
  onPreview: () => void;
  onEdit: () => void;
  onPrint: () => void;
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
          <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
            {row.procedimiento}
          </p>
        </div>
        <StatusBadge value={row.estado} />
      </div>
      <div style={{ borderTop: "1px solid #F8F9FA", paddingTop: 8 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 0",
            borderBottom: "1px solid #F8F9FA",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Doctor</span>
          <span style={{ fontSize: 13, color: "#203F49" }}>{row.doctor}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 0",
            borderBottom: "1px solid #F8F9FA",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Fecha</span>
          <span style={{ fontSize: 13, color: "#203F49" }}>{row.fecha}</span>
        </div>
        <div style={{ display: "flex", gap: 8, paddingTop: 10 }}>
          <button
            onClick={onPreview}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 0",
              borderRadius: 8,
              border: "1px solid #D3D7DA",
              background: "#fff",
              fontSize: 12,
              color: "#203F49",
              cursor: "pointer",
            }}
          >
            <Eye size={14} /> Ver
          </button>
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 0",
              borderRadius: 8,
              border: "1px solid #D3D7DA",
              background: "#fff",
              fontSize: 12,
              color: "#203F49",
              cursor: "pointer",
            }}
          >
            <Edit3 size={14} /> Editar
          </button>
          <button
            onClick={onPrint}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 0",
              borderRadius: 8,
              border: "1px solid #D3D7DA",
              background: "#fff",
              fontSize: 12,
              color: "#203F49",
              cursor: "pointer",
            }}
          >
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConsentListTable({
  consents,
  onPreview,
  onEdit,
  onNewConsent,
  onExport,
}: ConsentListTableProps) {
  const { isMobile, isTablet } = useResponsive();
  const showCards = isMobile || isTablet;

  const [mobileSearch, setMobileSearch] = useState("");
  const [mobileFilterEstado, setMobileFilterEstado] = useState("");
  const [mobileFilterDoctor, setMobileFilterDoctor] = useState("");

  const doctorOptions = useMemo(
    () =>
      Array.from(new Set(consents.map((c) => c.doctor).filter(Boolean))).map(
        (d) => ({ label: d, value: d })
      ),
    [consents]
  );

  const filteredConsents = useMemo(
    () =>
      consents.filter((c) => {
        const matchSearch =
          !mobileSearch ||
          normalizeSearch(c.paciente).includes(normalizeSearch(mobileSearch)) ||
          normalizeSearch(c.procedimiento).includes(
            normalizeSearch(mobileSearch)
          );
        const matchEstado =
          !mobileFilterEstado || c.estado === mobileFilterEstado;
        const matchDoctor =
          !mobileFilterDoctor || c.doctor === mobileFilterDoctor;
        return matchSearch && matchEstado && matchDoctor;
      }),
    [consents, mobileSearch, mobileFilterEstado, mobileFilterDoctor]
  );

  const columns: Column<ConsentRecord>[] = [
    { key: "fecha", label: "Fecha", width: 120 },
    { key: "paciente", label: "Paciente" },
    { key: "procedimiento", label: "Procedimiento" },
    { key: "doctor", label: "Doctor", width: 180 },
    {
      key: "estado",
      label: "Estado",
      width: 170,
      render: (value) => <StatusBadge value={value as ConsentStatus} />,
    },
  ];

  const rowActions = (row: ConsentRecord): RowAction<ConsentRecord>[] => [
    { icon: <Eye size={16} />, label: "Ver", onClick: () => onPreview(row.id) },
    { icon: <Edit3 size={16} />, label: "Editar", onClick: () => onEdit(row) },
    {
      icon: <Printer size={16} />,
      label: "Imprimir",
      onClick: () => printConsentDocuments([row]),
    },
  ];

  if (showCards) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Acciones */}
        <button
          onClick={onNewConsent}
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
          <Plus size={16} /> Nuevo Consentimiento
        </button>

        {/* Búsqueda */}
        <input
          value={mobileSearch}
          onChange={(e) => setMobileSearch(e.target.value)}
          placeholder="Buscar paciente o procedimiento..."
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
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={mobileFilterDoctor}
            onChange={(e) => setMobileFilterDoctor(e.target.value)}
            style={{
              flex: 1,
              height: 42,
              padding: "0 10px",
              border: "1px solid #D3D7DA",
              borderRadius: 8,
              background: "#fff",
              fontSize: 12,
              color: mobileFilterDoctor ? "#203F49" : "#888F94",
              outline: "none",
            }}
          >
            <option value="">Doctor</option>
            {doctorOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cards */}
        {filteredConsents.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "#888F94",
              fontSize: 14,
              padding: 24,
            }}
          >
            No hay consentimientos para mostrar.
          </p>
        ) : (
          filteredConsents.map((row) => (
            <ConsentCard
              key={row.id}
              row={row}
              onPreview={() => onPreview(row.id)}
              onEdit={() => onEdit(row)}
              onPrint={() => printConsentDocuments([row])}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <DataTable<ConsentRecord>
      title="Listado de consentimientos"
      description={`Total de ${consents.length} consentimientos registrados`}
      data={consents}
      columns={columns}
      searchable
      searchPlaceholder="Buscar paciente o procedimiento..."
      searchKeys={["paciente", "procedimiento"]}
      filters={[
        {
          key: "doctor",
          placeholder: "Todos los doctores",
          options: doctorOptions,
        },
        {
          key: "estado",
          placeholder: "Todos los estados",
          options: statusOptions,
        },
      ]}
      pageSize={5}
      getRowKey={(row) => row.id}
      emptyMessage="No hay consentimientos para mostrar."
      primaryAction={{
        label: "Nuevo Consentimiento",
        icon: <Plus size={16} />,
        onClick: onNewConsent,
      }}
      secondaryActions={[
        {
          label: "Exportar",
          icon: <Download size={16} />,
          onClick: onExport,
        },
        {
          label: "Imprimir",
          icon: <Printer size={16} />,
          onClick: () => printConsentDocuments(consents),
        },
      ]}
      rowActions={rowActions}
    />
  );
}
