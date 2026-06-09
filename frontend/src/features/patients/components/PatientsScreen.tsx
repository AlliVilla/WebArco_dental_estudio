import { Plus, Eye, FileText } from "lucide-react";
import { DataTable } from "../../../components";

interface Patient {
  id: string;
  codigo: string;
  nombre: string;
  telefono: string;
  ultimaVisita: string;
}

const mockPatients: Patient[] = [
  {
    id: "1",
    codigo: "PAC-000124",
    nombre: "María Fernanda López García",
    telefono: "+504 9876-5432",
    ultimaVisita: "27 may 2026",
  },
  {
    id: "2",
    codigo: "PAC-000089",
    nombre: "José Antonio Rodríguez Cruz",
    telefono: "+504 9845-1234",
    ultimaVisita: "24 may 2026",
  },
  {
    id: "3",
    codigo: "PAC-000156",
    nombre: "Ana María Torres Martínez",
    telefono: "+504 9832-7654",
    ultimaVisita: "29 may 2026",
  },
  {
    id: "4",
    codigo: "PAC-000201",
    nombre: "Carlos Alberto Mendoza Reyes",
    telefono: "+504 9878-9012",
    ultimaVisita: "31 may 2026",
  },
  {
    id: "5",
    codigo: "PAC-000067",
    nombre: "Sofía Isabel Hernández Vargas",
    telefono: "+504 9856-4321",
    ultimaVisita: "19 may 2026",
  },
  {
    id: "6",
    codigo: "PAC-000124",
    nombre: "María Fernanda López García",
    telefono: "+504 9876-5432",
    ultimaVisita: "27 may 2026",
  },
  {
    id: "7",
    codigo: "PAC-000089",
    nombre: "José Antonio Rodríguez Cruz",
    telefono: "+504 9845-1234",
    ultimaVisita: "24 may 2026",
  },
  {
    id: "8",
    codigo: "PAC-000156",
    nombre: "Ana María Torres Martínez",
    telefono: "+504 9832-7654",
    ultimaVisita: "29 may 2026",
  },
  {
    id: "9",
    codigo: "PAC-000201",
    nombre: "Carlos Alberto Mendoza Reyes",
    telefono: "+504 9878-9012",
    ultimaVisita: "31 may 2026",
  },
  {
    id: "10",
    codigo: "PAC-000067",
    nombre: "Sofía Isabel Hernández Vargas",
    telefono: "+504 9856-4321",
    ultimaVisita: "19 may 2026",
  },
  {
    id: "11",
    codigo: "PAC-000067",
    nombre: "Sofía Isabel Hernández Vargas",
    telefono: "+504 9856-4321",
    ultimaVisita: "19 may 2026",
  },
];

interface PatientsScreenProps {
  onViewProfile?: () => void;
  onCreatePatient?: () => void;
}

export function PatientsScreen({
  onViewProfile,
  onCreatePatient,
}: PatientsScreenProps) {
  const columns = [
    { key: "codigo", label: "Código del paciente", width: 140 },
    { key: "nombre", label: "Nombre completo" },
    { key: "telefono", label: "Teléfono", width: 160 },
    { key: "ultimaVisita", label: "Fecha última visita", width: 160 },
  ];

  const getRowActions = () => [
    {
      icon: <Eye size={16} />,
      label: "Ver Perfil",
      onClick: () => onViewProfile?.(),
    },
    {
      icon: <FileText size={15} />,
      label: "Historia Clínica",
      onClick: () => onViewProfile?.(),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <DataTable<Patient>
        title="Listado de Pacientes"
        description="Gestiona y busca la información de los pacientes de la clínica"
        columns={columns}
        data={mockPatients}
        searchable={true}
        searchPlaceholder="Buscar por nombre, código o teléfono..."
        searchKeys={["nombre", "codigo", "telefono"]}
        primaryAction={{
          label: "Crear nuevo paciente",
          icon: <Plus size={16} />,
          onClick:
            onCreatePatient ?? (() => alert("Crear paciente próximamente")),
        }}
        rowActions={getRowActions}
        getRowKey={(row) => row.id}
      />
    </div>
  );
}
