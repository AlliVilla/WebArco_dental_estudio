import { useState, useMemo } from "react";
import { Card, Alert } from "../../../context";

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
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

type CategoriaEgreso = "Insumos" | "Equipos" | "Nómina" | "Servicios";
const CATEGORIAS: CategoriaEgreso[] = ["Insumos", "Equipos", "Nómina", "Servicios"];

type RegistroEgreso = {
  id: string;
  fecha: string;
  concepto: string;
  categoria: CategoriaEgreso;
  monto: number;
  responsable: string;
  observaciones: string;
};

export function GestionEgresos() {
  const [estaModalAbierto, setEstaModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState<"crear" | "editar" | "ver">(
    "crear",
  );
  const [registros, setRegistros] = useState<RegistroEgreso[]>([]);

  const [estaModalConfirmacionAbierto, setEstaModalConfirmacionAbierto] =
    useState(false);
  const [registroAEliminar, setRegistroAEliminar] = useState<string | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);
  const userStored = JSON.parse(localStorage.getItem("webarco_user") || "{}");

  const nombreAutenticado = useMemo(() => {
    if (userStored.nombre) return userStored.nombre;
    // El backend (ExpedienteClinicoService) anida los datos en el objeto 'persona'
    const p = userStored.persona;
    if (p?.primer_nombre) {
      return `${p.primer_nombre} ${p.primer_apellido || ""}`.trim();
    }
    if (userStored.primer_nombre) {
      return `${userStored.primer_nombre} ${userStored.primer_apellido || ""}`.trim();
    }
    return "Usuario Autenticado";
  }, [userStored]);

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaEgreso>("Insumos");
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [idSeleccionado, setIdSeleccionado] = useState<string | null>(null);
  const [responsable, setResponsable] = useState(nombreAutenticado);

  const localHoyStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const r = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${r}`;
  }, []);

  const indicadores = useMemo(() => {
    const y = new Date().getFullYear();
    const m = String(new Date().getMonth() + 1).padStart(2, "0");
    const prefix = `${y}-${m}`;

    const egresosDelMes = registros
      .filter((r) => r.fecha.startsWith(prefix))
      .reduce((sum, r) => sum + r.monto, 0);

    const totalInsumos = registros
      .filter((r) => r.categoria === "Insumos")
      .reduce((sum, r) => sum + r.monto, 0);

    const egresoDelDia = registros
      .filter((r) => r.fecha === localHoyStr)
      .reduce((sum, r) => sum + r.monto, 0);

    const egresoPromedio = registros.length > 0
      ? registros.reduce((sum, r) => sum + r.monto, 0) / registros.length
      : 0;

    const formatMoneda = (val: number) =>
      `$${val.toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    return [
      {
        label: "Egresos del Mes",
        value: formatMoneda(egresosDelMes),
        icon: TrendingDown,
        color: "#EF4444",
        bg: "#FEE2E2",
      },
      {
        label: "Total en Insumos",
        value: formatMoneda(totalInsumos),
        icon: Package,
        color: "#EF9F27",
        bg: "#FFFBEB",
      },
      {
        label: "Egreso del Día",
        value: formatMoneda(egresoDelDia),
        icon: Calendar,
        color: "#0BC5DF",
        bg: "#E6F8FB",
      },
      {
        label: "Egreso Promedio",
        value: formatMoneda(egresoPromedio),
        icon: DollarSign,
        color: "#203F49",
        bg: "#F1F3F4",
      },
    ];
  }, [registros, localHoyStr]);

  const filtros = useMemo(() => {
    const responsablesUnicos = Array.from(
      new Set(registros.map((r) => r.responsable).filter(Boolean))
    );
    return [
      {
        key: "categoria",
        placeholder: "Categoría",
        options: CATEGORIAS.map((cat) => ({ value: cat, label: cat })),
      },
      {
        key: "responsable",
        placeholder: "Responsable",
        options: responsablesUnicos.map((nombre) => ({
          value: nombre,
          label: nombre,
        })),
      },
    ];
  }, [registros]);

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
    if (!/^\d+(\.\d{1,2})?$/.test(monto)) {
      setError("Monto inválido: máximo 2 decimales");
      return;
    }
    if (parsedMonto > 999999999.99) {
      setError("Monto excede el límite permitido");
      return;
    }

    if (modoModal === "crear") {
      const nuevoRegistro: RegistroEgreso = {
        id: generateUUID(),
        fecha,
        concepto,
        categoria,
        monto: parsedMonto,
        responsable: responsable.trim() || nombreAutenticado,
        observaciones,
      };
      setRegistros([nuevoRegistro, ...registros]);
    } else if (modoModal === "editar" && idSeleccionado) {
      setRegistros(
        registros.map((reg) =>
          reg.id === idSeleccionado
            ? {
              ...reg,
              fecha,
              concepto,
              categoria,
              monto: parsedMonto,
              responsable: responsable.trim() || nombreAutenticado,
              observaciones,
            }
            : reg,
        ),
      );
    }

    cerrarModal();
  };

  const cerrarModal = () => {
    setEstaModalAbierto(false);
    setError(null);
    limpiarFormulario();
  };

  const limpiarFormulario = () => {
    setFecha(new Date().toISOString().split("T")[0]);
    setConcepto("");
    setMonto("");
    setCategoria("Insumos");
    setObservaciones("");
    setResponsable(nombreAutenticado);
    setError(null);
    setIdSeleccionado(null);
  };

  const abrirModal = (
    modo: "crear" | "editar" | "ver",
    registro?: RegistroEgreso,
  ) => {
    setError(null);
    setModoModal(modo);
    if (registro) {
      setIdSeleccionado(registro.id);
      setFecha(registro.fecha);
      setConcepto(registro.concepto);
      setCategoria(registro.categoria);
      setMonto(String(registro.monto));
      setObservaciones(registro.observaciones);
      setResponsable(registro.responsable);
    } else {
      limpiarFormulario();
    }
    setEstaModalAbierto(true);
  };

  const imprimirReporte = () => {
    const vent = window.open("", "_blank");
    if (!vent) return;

    const totalEgresos = registros.reduce((sum, r) => sum + r.monto, 0);

    const filasHtml = registros
      .map(
        (r) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${r.fecha}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${r.concepto}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${r.categoria}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; text-align: right;">$${r.monto.toLocaleString(
          "es-MX",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        )}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${r.responsable}</td>
      </tr>
    `,
      )
      .join("");

    vent.document.write(`
      <html>
        <head>
          <title>Reporte de Egresos - WebArco Dental Studio</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, sans-serif; color: #203F49; padding: 40px; margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0BC5DF; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 700; margin: 0; }
            .subtitle { font-size: 14px; color: #5F656A; margin: 5px 0 0 0; }
            .meta { font-size: 12px; color: #888F94; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th { background-color: #F8F9FA; padding: 10px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #E2E8F0; }
            .total-row { font-size: 16px; font-weight: bold; background-color: #F8F9FA; }
            .total-cell { padding: 12px 10px; border-top: 2px solid #E2E8F0; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">WebArco Dental Studio</h1>
              <p class="subtitle">Reporte de Control de Egresos y Gastos</p>
            </div>
            <div class="meta">
              <p style="margin: 0;">Fecha de impresión: ${new Date().toLocaleDateString("es-MX")}</p>
              <p style="margin: 5px 0 0 0;">Total Registros: ${registros.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Fecha</th>
                <th style="width: 40%;">Concepto</th>
                <th style="width: 15%;">Categoría</th>
                <th style="width: 15%; text-align: right;">Monto</th>
                <th style="width: 15%;">Responsable</th>
              </tr>
            </thead>
            <tbody>
              ${filasHtml}
              <tr class="total-row">
                <td colspan="3" class="total-cell" style="text-align: right;">Total General:</td>
                <td class="total-cell" style="text-align: right; color: #EF4444;">$${totalEgresos.toLocaleString(
      "es-MX",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    )}</td>
                <td class="total-cell"></td>
              </tr>
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    vent.document.close();
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
        filters={filtros}
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
            label: "Imprimir",
            icon: <Printer size={13} />,
            onClick: imprimirReporte,
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
                  {modoModal === "ver"
                    ? "Detalles del Egreso"
                    : modoModal === "editar"
                      ? "Editar Egreso"
                      : "Registrar Nuevo Egreso"}
                </h3>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
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
                    value={
                      modoModal === "ver" && fecha.includes("-")
                        ? fecha.split("-").reverse().join("/")
                        : fecha
                    }
                    onChange={(e) => setFecha(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #D3D7DA",
                      outline: "none",
                      fontSize: 14,
                      color: "#203F49",
                      backgroundColor: fecha ? "#fff" : "#F3F3F5",
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
                          e.target.value as CategoriaEgreso,
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #D3D7DA",
                        outline: "none",
                        fontSize: 14,
                        background: categoria ? "#fff" : "#F3F3F5",
                        color: "#203F49",
                      }}
                    >
                      {CATEGORIAS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
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
                    backgroundColor: concepto ? "#fff" : "#F3F3F5",
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
                      backgroundColor: monto ? "#fff" : "#F3F3F5",
                    }}
                  />
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label
                      style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}
                    >
                      Responsable
                      {modoModal !== "ver" && (
                        <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                      )}
                    </label>
                    {modoModal === "editar" && responsable !== nombreAutenticado && (
                      <button
                        type="button"
                        onClick={() => setResponsable(nombreAutenticado)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#0BC5DF",
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Asignarme a mí
                      </button>
                    )}
                  </div>
                  <input
                    disabled={modoModal === "ver"}
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    required
                    placeholder="Nombre del responsable"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #D3D7DA",
                      outline: "none",
                      fontSize: 14,
                      background: modoModal === "ver" ? "#F1F3F4" : (responsable ? "#fff" : "#F3F3F5"),
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
                    backgroundColor: observaciones ? "#fff" : "#F3F3F5",
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
                  onClick={cerrarModal}
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
                    {modoModal === "editar"
                      ? "Guardar Cambios"
                      : "Registrar Egreso"}
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
