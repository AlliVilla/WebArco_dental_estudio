import { useState } from "react";
import { Card, Alert } from "../../../context";
import {
  TrendingDown,
  Package,
  Calendar,
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

type RegistroEgreso = {
  id: string;
  fecha: string;
  concepto: string;
  categoria: "Insumos" | "Equipos" | "Nómina" | "Servicios";
  monto: number;
  responsable: string;
  observaciones: string;
};

const datosMock: RegistroEgreso[] = [
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
  const [estaModalAbierto, setEstaModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState<"crear" | "editar" | "ver">("crear");
  const [registros, setRegistros] = useState<RegistroEgreso[]>(datosMock);

  const [estaModalConfirmacionAbierto, setEstaModalConfirmacionAbierto] = useState(false);
  const [registroAEliminar, setRegistroAEliminar] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const usuarioAutenticado = JSON.parse(localStorage.getItem("webarco_user") || '{"nombre": "Usuario Autenticado"}');

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<
    "Insumos" | "Equipos" | "Nómina" | "Servicios"
  >("Insumos");
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [idSeleccionado, setIdSeleccionado] = useState<string | null>(null);

  const indicadores = [
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
      icon: Calendar,
      color: "#0BC5DF",
      bg: "#E6F8FB",
    },
    {
      label: "Egreso Promedio",
      value: "$920.00",
      icon: DollarSign,
      color: "#203F49",
      bg: "#F1F3F4",
    },
  ];

  const obtenerBadgeCategoria = (categoria: string) => {
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

  const manejarGuardarEgreso = (e: React.FormEvent) => {
    e.preventDefault();
    if (modoModal === "ver") return;
    setError(null);

    const hoy = new Date().toISOString().split("T")[0];
    if (fecha > hoy) {
      setError("No se pueden registrar egresos con una fecha futura.");
      return;
    }

    if (!concepto || !monto) {
      setError("Por favor complete todos los campos obligatorios.");
      return;
    }

    const parsedMonto = Number(monto);
    if (isNaN(parsedMonto) || parsedMonto <= 0) {
      setError("El monto debe ser un valor numérico mayor a 0.00");
      return;
    }

    if (modoModal === "crear") {
      const nuevoRegistro: RegistroEgreso = {
        id: crypto.randomUUID(),
        fecha,
        concepto,
        categoria,
        monto: parsedMonto,
        responsable: usuarioAutenticado.nombre,
        observaciones,
      };
      setRegistros([nuevoRegistro, ...registros]);
    } else if (modoModal === "editar" && idSeleccionado) {
      setRegistros(registros.map(reg =>
        reg.id === idSeleccionado
          ? { ...reg, fecha, concepto, categoria, monto: parsedMonto, observaciones }
          : reg
      ));
    }

    setEstaModalAbierto(false);
    limpiarFormulario();
  };

  const limpiarFormulario = () => {
    setFecha(new Date().toISOString().split("T")[0]);
    setConcepto("");
    setMonto("");
    setCategoria("Insumos");
    setObservaciones("");
    setIdSeleccionado(null);
  };

  const abrirModal = (modo: "crear" | "editar" | "ver", registro?: RegistroEgreso) => {
    setError(null);
    setModoModal(modo);
    if (registro) {
      setIdSeleccionado(registro.id);
      setFecha(registro.fecha);
      setConcepto(registro.concepto);
      setCategoria(registro.categoria);
      setMonto(String(registro.monto));
      setObservaciones(registro.observaciones);
    } else {
      limpiarFormulario();
    }
    setEstaModalAbierto(true);
  };

  const columnas = [
    { key: "fecha", label: "Fecha", width: 100 },
    { key: "concepto", label: "Concepto" },
    {
      key: "categoria",
      label: "Categoría",
      render: (val: unknown) => obtenerBadgeCategoria(String(val)),
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

  const obtenerAccionesFila = (registro: RegistroEgreso) => [
    {
      icon: <Eye size={14} />,
      label: "Ver Detalles",
      onClick: () => abrirModal("ver", registro),
    },
    {
      icon: <Edit size={14} />,
      label: "Editar",
      onClick: () => abrirModal("editar", registro),
    },
    {
      icon: <Trash2 size={14} />,
      label: "Eliminar",
      onClick: () => {
        setRegistroAEliminar(registro.id);
        setEstaModalConfirmacionAbierto(true);
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
        {indicadores.map((indicador) => (
          <Card key={indicador.label}>
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
                  {indicador.label}
                </p>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#203F49",
                    margin: 0,
                  }}
                >
                  {indicador.value}
                </p>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: indicador.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <indicador.icon size={20} style={{ color: indicador.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <DataTable<RegistroEgreso>
        title="Registros de Egresos"
        description="Gestiona todos los egresos y gastos de la clínica"
        columns={columnas}
        data={registros}
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
              { value: usuarioAutenticado.nombre, label: usuarioAutenticado.nombre },
            ],
          },
        ]}
        primaryAction={{
          label: "Registrar Egreso",
          icon: <Plus size={16} />,
          onClick: () => abrirModal("crear"),
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
        rowActions={obtenerAccionesFila}
        getRowKey={(fila) => fila.id}
      />

      <ConfirmModal
        open={estaModalConfirmacionAbierto}
        variant="danger"
        title="¿Eliminar registro de egreso?"
        description="Esta acción eliminará el registro permanentemente. Esta operación no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onClose={() => {
          setEstaModalConfirmacionAbierto(false);
          setRegistroAEliminar(null);
        }}
        onConfirm={() => {
          if (registroAEliminar) {
            setRegistros(registros.filter((r) => r.id !== registroAEliminar));
            setRegistroAEliminar(null);
          }
          setEstaModalConfirmacionAbierto(false);
        }}
      />

      {estaModalAbierto && (
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
                <h3
                  style={{
                    margin: 0,
                    color: "#203F49",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {modoModal === "ver" ? "Detalles del Egreso" : modoModal === "editar" ? "Editar Egreso" : "Registrar Nuevo Egreso"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEstaModalAbierto(false)}
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

            {error && (
              <div style={{ padding: "16px 20px 0 20px" }}>
                <Alert variant="error" message={error} />
              </div>
            )}

            <form
              onSubmit={manejarGuardarEgreso}
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
                    {modoModal !== "ver" && (
                      <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                    )}
                  </label>
                  <input
                    type={modoModal === "ver" ? "text" : "date"}
                    disabled={modoModal === "ver"}
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
                    {modoModal !== "ver" && (
                      <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                    )}
                  </label>
                  {modoModal === "ver" ? (
                    <input
                      disabled
                      value={categoria}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #D3D7DA",
                        outline: "none",
                        fontSize: 14,
                        color: "#203F49",
                        background: "#F1F3F4",
                      }}
                    />
                  ) : (
                    <select
                      required
                      value={categoria}
                      onChange={(e) =>
                        setCategoria(
                          e.target.value as
                          | "Insumos"
                          | "Equipos"
                          | "Nómina"
                          | "Servicios",
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
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                >
                  Concepto
                  {modoModal !== "ver" && (
                    <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                  )}
                </label>
                <input
                  placeholder="Descripción del egreso..."
                  required
                  disabled={modoModal === "ver"}
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
                    Monto ($)
                    {modoModal !== "ver" && (
                      <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                    )}
                  </label>
                  <input
                    type={modoModal === "ver" ? "text" : "number"}
                    step="0.01"
                    placeholder="0.00"
                    disabled={modoModal === "ver"}
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
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Responsable
                    {modoModal !== "ver" && (
                      <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                    )}
                  </label>
                  <input
                    disabled
                    value={
                      modoModal === "crear"
                        ? usuarioAutenticado.nombre
                        : registros.find((r) => r.id === idSeleccionado)
                          ?.responsable || ""
                    }
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
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label
                    style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                  >
                    Observaciones
                  </label>
                  {modoModal !== "ver" && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#5A6370",
                        background: "#E6E8EC",
                        padding: "2px 8px",
                        borderRadius: 12,
                      }}
                    >
                      Opcional
                    </span>
                  )}
                </div>
                <textarea
                  value={observaciones}
                  disabled={modoModal === "ver"}
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
                  onClick={() => setEstaModalAbierto(false)}
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
                {modoModal !== "ver" && (
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
                    {modoModal === "editar" ? "Guardar Cambios" : "Registrar Egreso"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
