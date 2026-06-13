import { useState } from "react";
import { Card, Alert, Avatar } from "../../../context";
import {
  TrendingDown,
  Package,
  Wrench,
  DollarSign,
  Plus,
  FileSpreadsheet,
  Printer,
  XCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { DataTable, ConfirmModal } from "../../../components";

interface ExpenseRecord {
  id: string;
  fecha: string;
  concepto: string;
  categoria: "Insumos" | "Equipos" | "Nómina" | "Servicios";
  monto: number;
  responsable: string;
  observaciones: string;
}

const mockData: ExpenseRecord[] = [
  {
    id: "1",
    fecha: "2026-06-03",
    concepto: "Compra de guantes látex x500",
    categoria: "Insumos",
    monto: 450,
    responsable: "Dr. Karla Arita",
    observaciones: "Proveedor: MediSupply",
  },
  {
    id: "2",
    fecha: "2026-06-02",
    concepto: "Mantenimiento autoclave",
    categoria: "Equipos",
    monto: 1200,
    responsable: "Dr. Karla Arita",
    observaciones: "Servicio técnico mensual",
  },
  {
    id: "3",
    fecha: "2026-06-01",
    concepto: "Pago nómina asistente",
    categoria: "Nómina",
    monto: 8500,
    responsable: "Dr. Karla Arita",
    observaciones: "Quincena 1 - Junio",
  },
  {
    id: "4",
    fecha: "2026-06-01",
    concepto: "Resinas dentales x10",
    categoria: "Insumos",
    monto: 2300,
    responsable: "Dr. Karla Arita",
    observaciones: "3M ESPE",
  },
  {
    id: "5",
    fecha: "2026-05-31",
    concepto: "Servicio de limpieza",
    categoria: "Servicios",
    monto: 800,
    responsable: "Dr. Karla Arita",
    observaciones: "Limpieza profunda mensual",
  },
  {
    id: "6",
    fecha: "2026-05-30",
    concepto: "Papel de impresora",
    categoria: "Insumos",
    monto: 125,
    responsable: "Dr. Karla Arita",
    observaciones: "Resmas de papel A4",
  },
  {
    id: "7",
    fecha: "2026-05-28",
    concepto: "Reparación sillón dental",
    categoria: "Equipos",
    monto: 950,
    responsable: "Dr. Karla Arita",
    observaciones: "Cambio de motor",
  },
  {
    id: "8",
    fecha: "2026-05-27",
    concepto: "Pago nómina recepcionista",
    categoria: "Nómina",
    monto: 5500,
    responsable: "Dr. Karla Arita",
    observaciones: "Quincena 2 - Mayo",
  },
];

export function GestionEgresos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [records, setRecords] = useState<ExpenseRecord[]>(mockData);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<
    "Insumos" | "Equipos" | "Nómina" | "Servicios"
  >("Insumos");
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const kpis = [
    {
      label: "Egresos del Mes",
      value: "$18,450.00",
      icon: TrendingDown,
      color: "#EF4444",
      bg: "#FEE2E2",
    },
    {
      label: "Total en Insumos",
      value: "$8,230.00",
      icon: Package,
      color: "#EF9F27",
      bg: "#FFFBEB",
    },
    {
      label: "Egreso del Día",
      value: "$1,450.00",
      icon: DollarSign,
      color: "#0BC5DF",
      bg: "#E6F8FB",
    },
    {
      label: "Egreso Promedio",
      value: "$920.00",
      icon: Wrench,
      color: "#203F49",
      bg: "#F1F3F4",
    },
  ];

  const getCategoriaBadge = (categoria: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      Insumos: { bg: "#DBEAFE", text: "#1E40AF" },
      Equipos: { bg: "#FCD34D", text: "#78350F" },
      Nómina: { bg: "#FECACA", text: "#991B1B" },
      Servicios: { bg: "#DCFCE7", text: "#166534" },
    };
    const variant = variants[categoria] || variants["Insumos"];
    return (
      <span
        style={{
          background: variant.bg,
          color: variant.text,
          padding: "3px 10px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: 600,
        }}
      >
        {categoria}
      </span>
    );
  };

  const handleRegisterExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto || !monto) {
      alert("Por favor complete los campos requeridos");
      return;
    }

    const newRecord: ExpenseRecord = {
      id: String(records.length + 1),
      fecha,
      concepto,
      categoria,
      monto: Number(monto),
      responsable: "Dr. Karla Arita",
      observaciones,
    };

    setRecords([newRecord, ...records]);
    setIsDialogOpen(false);
    setConcepto("");
    setMonto("");
    setCategoria("Insumos");
    setObservaciones("");
  };

  const columns = [
    { key: "fecha", label: "Fecha", width: 100 },
    { key: "concepto", label: "Concepto" },
    {
      key: "categoria",
      label: "Categoría",
      render: (val: unknown) => getCategoriaBadge(String(val)),
    },
    {
      key: "monto",
      label: "Monto",
      render: (val: unknown) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: "#EF4444" }}>
          ${Number(val).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    { key: "responsable", label: "Responsable" },
    { key: "observaciones", label: "Observaciones" },
  ];

  const getRowActions = (record: ExpenseRecord) => [
    {
      icon: <Eye size={14} />,
      label: "Ver Detalles",
      onClick: () => alert(`Detalles: ${record.concepto}`),
    },
    {
      icon: <Edit size={14} />,
      label: "Editar",
      onClick: () => alert("Editar próximamente"),
    },
    {
      icon: <Trash2 size={14} />,
      label: "Eliminar",
      onClick: () => {
        setRecordToDelete(record.id);
        setIsConfirmOpen(true);
      },
      danger: true,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Alert
        variant="info"
        message="Los egresos se contabilizan automáticamente en el balance mensual"
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
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
                    margin: "0 0 6px 0",
                  }}
                >
                  {kpi.label}
                </p>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#203F49",
                    margin: 0,
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <DataTable<any>
        title="Registros de Egresos"
        description="Gestiona todos los egresos y gastos de la clínica"
        columns={columns}
        data={records}
        searchable={true}
        searchPlaceholder="Buscar concepto..."
        searchKeys={["concepto"]}
        filters={[
          {
            key: "categoria",
            placeholder: "Categoría",
            options: [
              { value: "Insumos", label: "Insumos" },
              { value: "Equipos", label: "Equipos" },
              { value: "Nómina", label: "Nómina" },
              { value: "Servicios", label: "Servicios" },
            ],
          },
          {
            key: "responsable",
            placeholder: "Responsable",
            options: [
              { value: "Dr. Karla Arita", label: "Dr. Karla Arita" },
              { value: "Dr. Juan Pérez", label: "Dr. Juan Pérez" },
              { value: "Dra. María López", label: "Dra. María López" },
            ],
          },
        ]}
        primaryAction={{
          label: "Registrar Egreso",
          icon: <Plus size={16} />,
          onClick: () => setIsDialogOpen(true),
        }}
        secondaryActions={[
          {
            label: "Exportar",
            icon: <FileSpreadsheet size={13} />,
            onClick: () => alert("Exportando registros a Excel..."),
          },
          {
            label: "Reporte",
            icon: <Printer size={13} />,
            onClick: () => window.print(),
          },
        ]}
        rowActions={getRowActions}
        getRowKey={(row) => row.id}
      />

      <ConfirmModal
        open={isConfirmOpen}
        variant="danger"
        title="¿Eliminar registro de egreso?"
        description="Esta acción eliminará el registro permanentemente. Esta operación no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onClose={() => {
          setIsConfirmOpen(false);
          setRecordToDelete(null);
        }}
        onConfirm={() => {
          if (recordToDelete) {
            setRecords(records.filter((r) => r.id !== recordToDelete));
            setRecordToDelete(null);
          }
          setIsConfirmOpen(false);
        }}
      />

      {isDialogOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(32, 63, 73, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 500,
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #EAECEE",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#F8F9FA",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingDown size={18} style={{ color: "#EF4444" }} />
                <h3
                  style={{
                    margin: 0,
                    color: "#203F49",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Registrar Nuevo Egreso
                </h3>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#888F94",
                  fontSize: 18,
                }}
              >
                <XCircle size={18} />
              </button>
            </div>

            <form
              onSubmit={handleRegisterExpense}
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #D3D7DA",
                      outline: "none",
                      fontSize: 14,
                      color: "#203F49",
                    }}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Categoría
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) =>
                      setCategoria(
                        e.target.value as
                          | "Insumos"
                          | "Equipos"
                          | "Nómina"
                          | "Servicios"
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #D3D7DA",
                      outline: "none",
                      fontSize: 14,
                      background: "#fff",
                      color: "#203F49",
                    }}
                  >
                    <option value="Insumos">Insumos</option>
                    <option value="Equipos">Equipos</option>
                    <option value="Nómina">Nómina</option>
                    <option value="Servicios">Servicios</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Concepto
                </label>
                <input
                  placeholder="Descripción del egreso..."
                  required
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #D3D7DA",
                    outline: "none",
                    fontSize: 14,
                    color: "#203F49",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Monto ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #D3D7DA",
                    outline: "none",
                    fontSize: 14,
                    color: "#203F49",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Responsable
                </label>
                <input
                  disabled
                  value="Dr. Karla Arita"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #D3D7DA",
                    outline: "none",
                    fontSize: 14,
                    background: "#F1F3F4",
                    color: "#203F49",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Observaciones
                </label>
                <textarea
                  value={observaciones}
                  placeholder="Notas o comentarios adicionales..."
                  onChange={(e) => setObservaciones(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 60,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #D3D7DA",
                    outline: "none",
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "none",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "1px solid #D3D7DA",
                    background: "#fff",
                    color: "#5F656A",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#0BC5DF",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Registrar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
