import { Download, Edit3, Eye, Printer } from "lucide-react";
import { DataTable } from "../../../components";
import type { Column, RowAction } from "../../../components";
import type { ConsentRecord, ConsentStatus } from "../types";
import { statusOptions } from "../services/consentData";
import { getStatusMeta } from "../services/consentUtils";
import { printConsentDocuments } from "../services/printConsentDocuments";
import { useResponsive } from "../../../hooks/useWindowWidth";
import type { QueryConsentimientoParams } from "../types/consentimiento"; // ← tipo ya creado

interface ConsentListTableProps {
  consents: ConsentRecord[];
  loading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onFilterChange?: (filters: Partial<QueryConsentimientoParams>) => void;
  onPreview: (id: string) => void;
  onEdit: (consent: ConsentRecord) => void;
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

function MobileFilters({
  onFilterChange,
}: {
  onFilterChange?: (f: Partial<QueryConsentimientoParams>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <input
        placeholder="Buscar paciente o procedimiento..."
        onChange={(e) =>
          onFilterChange?.({ paciente: e.target.value || undefined })
        }
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
      <select
        defaultValue=""
        onChange={(e) =>
          onFilterChange?.({
            estado: (e.target.value as QueryConsentimientoParams["estado"]) || undefined,
          })
        }
        style={{
          height: 42,
          padding: "0 10px",
          border: "1px solid #D3D7DA",
          borderRadius: 8,
          background: "#fff",
          fontSize: 12,
          color: "#888F94",
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
    </div>
  );
}

export function ConsentListTable({
  consents,
  loading = false,
  page,
  totalPages,
  onPageChange,
  onFilterChange,
  onPreview,
  onEdit,
  onExport,
}: ConsentListTableProps) {
  const { isMobile, isTablet } = useResponsive();
  const showCards = isMobile || isTablet;

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
        <MobileFilters onFilterChange={onFilterChange} />

        {loading ? (
          <p style={{ textAlign: "center", color: "#888F94", fontSize: 14, padding: 24 }}>
            Cargando...
          </p>
        ) : consents.length === 0 ? (
          <p style={{ textAlign: "center", color: "#888F94", fontSize: 14, padding: 24 }}>
            No hay consentimientos para mostrar.
          </p>
        ) : (
          consents.map((row) => (
            <ConsentCard
              key={row.id}
              row={row}
              onPreview={() => onPreview(row.id)}
              onEdit={() => onEdit(row)}
              onPrint={() => printConsentDocuments([row])}
            />
          ))
        )}

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, paddingTop: 8 }}>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #D3D7DA",
                background: page <= 1 ? "#F5F7FA" : "#fff",
                color: page <= 1 ? "#B0B7BD" : "#203F49",
                cursor: page <= 1 ? "default" : "pointer",
                fontSize: 13,
              }}
            >
              ← Anterior
            </button>
            <span style={{ lineHeight: "34px", fontSize: 13, color: "#888F94" }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid #D3D7DA",
                background: page >= totalPages ? "#F5F7FA" : "#fff",
                color: page >= totalPages ? "#B0B7BD" : "#203F49",
                cursor: page >= totalPages ? "default" : "pointer",
                fontSize: 13,
              }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <DataTable<ConsentRecord>
      title="Listado de consentimientos"
      description={`Página ${page} de ${totalPages}`}
      data={consents}
      columns={columns}
      loading={loading}
      searchable
      searchPlaceholder="Buscar paciente o procedimiento..."
      onSearchChange={(value) =>
        onFilterChange?.({ paciente: value || undefined })
      }
      filters={[
        {
          key: "estado",
          placeholder: "Todos los estados",
          options: statusOptions,
          onChange: (value) =>
            onFilterChange?.({
              estado: (value as QueryConsentimientoParams["estado"]) || undefined,
            }),
        },
      ]}
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      getRowKey={(row) => row.id}
      emptyMessage="No hay consentimientos para mostrar."
      secondaryActions={[
        { label: "Exportar", icon: <Download size={16} />, onClick: onExport },
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