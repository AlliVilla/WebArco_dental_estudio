import { Download, Edit3, Eye, Printer } from "lucide-react";
import { DataTable } from "../../../components";
import type { Column, RowAction } from "../../../components";
import type { ConsentRecord, ConsentStatus } from "../types";
import { getStatusMeta } from "./consentUtils";
import { printConsentDocuments } from "./printConsentDocuments";

interface ConsentListTableProps {
  consents: ConsentRecord[];
  filteredConsents: ConsentRecord[];
  hasSearchedConsents: boolean;
  onPreview: (id: string) => void;
  onEdit: (consent: ConsentRecord) => void;
}

export function ConsentListTable({ consents, filteredConsents, hasSearchedConsents, onPreview, onEdit }: ConsentListTableProps) {
  const tableData = hasSearchedConsents ? filteredConsents : consents;

  const columns: Column<ConsentRecord>[] = [
    { key: "fecha", label: "Fecha", width: 120 },
    { key: "paciente", label: "Paciente" },
    { key: "procedimiento", label: "Procedimiento" },
    { key: "doctor", label: "Doctor", width: 180 },
    {
      key: "estado",
      label: "Estado",
      width: 140,
      render: (value) => {
        const meta = getStatusMeta(value as ConsentStatus);
        return (
          <span style={{ background: meta.background, color: meta.color, borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600 }}>
            {meta.label}
          </span>
        );
      },
    },
  ];

  const rowActions = (row: ConsentRecord): RowAction<ConsentRecord>[] => [
    { icon: <Eye size={16} />, label: "Ver", onClick: () => onPreview(row.id) },
    { icon: <Edit3 size={16} />, label: "Editar", onClick: () => onEdit(row) },
    { icon: <Printer size={16} />, label: "Imprimir", onClick: () => printConsentDocuments([row]) },
  ];

  return (
    <DataTable<ConsentRecord>
      title={hasSearchedConsents ? "Resultados de búsqueda" : "Listado de consentimientos"}
      description={
        hasSearchedConsents
          ? `${filteredConsents.length} resultado${filteredConsents.length === 1 ? "" : "s"} encontrado${filteredConsents.length === 1 ? "" : "s"}`
          : `Total de ${consents.length} consentimientos registrados`
      }
      data={tableData}
      columns={columns}
      searchable={false}
      pageSize={5}
      getRowKey={(row) => row.id}
      emptyMessage="No hay consentimientos para mostrar."
      secondaryActions={[
        { label: "Exportar", icon: <Download size={16} />, onClick: () => undefined },
        { label: "Imprimir", icon: <Printer size={16} />, onClick: () => printConsentDocuments(tableData) },
      ]}
      rowActions={rowActions}
    />
  );
}
