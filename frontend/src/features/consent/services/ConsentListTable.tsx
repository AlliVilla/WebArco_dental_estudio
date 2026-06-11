import { Download, Edit3, Eye, Plus, Printer } from "lucide-react";
import { DataTable } from "../../../components";
import type { Column, RowAction } from "../../../components";
import type { ConsentRecord, ConsentStatus } from "../types";
import { statusOptions } from "./consentData";
import { getStatusMeta } from "./consentUtils";
import { printConsentDocuments } from "./printConsentDocuments";

interface ConsentListTableProps {
  consents: ConsentRecord[];
  onPreview: (id: string) => void;
  onEdit: (consent: ConsentRecord) => void;
  onNewConsent: () => void;
}

export function ConsentListTable({
  consents,
  onPreview,
  onEdit,
  onNewConsent,
}: ConsentListTableProps) {
  const doctorOptions = Array.from(
    new Set(consents.map((consent) => consent.doctor).filter(Boolean)),
  ).map((doctor) => ({
    label: doctor,
    value: doctor,
  }));

  const columns: Column<ConsentRecord>[] = [
    { key: "fecha", label: "Fecha", width: 120 },
    { key: "paciente", label: "Paciente" },
    { key: "procedimiento", label: "Procedimiento" },
    { key: "doctor", label: "Doctor", width: 180 },
    {
      key: "estado",
      label: "Estado",
      width: 170,
      render: (value) => {
        const meta = getStatusMeta(value as ConsentStatus);

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
      },
    },
  ];

  const rowActions = (row: ConsentRecord): RowAction<ConsentRecord>[] => [
    {
      icon: <Eye size={16} />,
      label: "Ver",
      onClick: () => onPreview(row.id),
    },
    {
      icon: <Edit3 size={16} />,
      label: "Editar",
      onClick: () => onEdit(row),
    },
    {
      icon: <Printer size={16} />,
      label: "Imprimir",
      onClick: () => printConsentDocuments([row]),
    },
  ];

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
          onClick: () => undefined,
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