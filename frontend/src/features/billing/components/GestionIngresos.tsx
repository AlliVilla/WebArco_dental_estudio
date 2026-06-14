import { useState, useMemo, useEffect } from "react";
import { Card, Alert, Button } from "../../../context";
import { formatCurrency, obtenerHoyLocal, escapeHtml, generateUUID } from "../../../utils/formatters";
import { exportToExcel } from "../../../utils/exportToExcel";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { StatsDrawerContent, StatsItem } from "./StatsDrawerContent";
import {
  DollarSign,
  Calendar,
  Users,
  Plus,
  FileSpreadsheet,
  Printer,
  XCircle,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { DataTable, ConfirmModal } from "../../../components";
import { Avatar } from "../../../context";

// ─── Types ────────────────────────────────────────────────────────────────────

type MetodoPago = "Efectivo" | "Tarjeta" | "Transferencia" | "Otro";
const METODOS_PAGO: MetodoPago[] = ["Efectivo", "Tarjeta", "Transferencia", "Otro"];

export type IncomeRecord = {
  id: string;
  fecha: string;
  paciente: string;
  tratamiento: string;
  monto: number;
  metodoPago: string;
  doctor: string;
  observaciones: string;
};

type DrawerIndicadorState = {
  title: string;
  items: StatsItem[];
  icon?: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
  iconColor?: string;
  totalValue?: string;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputStyle = (filled: boolean, disabled = false): React.CSSProperties => ({
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #D3D7DA",
  outline: "none",
  fontSize: 14,
  color: "#203F49",
  backgroundColor: disabled ? "#F1F3F4" : filled ? "#fff" : "#F3F3F5",
  cursor: disabled ? "not-allowed" : "auto",
});

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "#203F49",
};

const fieldGroupStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function GestionIngresos() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [registros, setRegistros] = useLocalStorage<IncomeRecord[]>(
    "webarco_ingresos",
    [],
  );
  const [userStored] = useLocalStorage<Record<string, unknown>>("webarco_user", {});

  const [estaModalAbierto, setEstaModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState<"crear" | "editar" | "ver">(
    "crear",
  );
  const [idSeleccionado, setIdSeleccionado] = useState<string | null>(null);
  const [estaCargando, setEstaCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [estaModalConfirmacionAbierto, setEstaModalConfirmacionAbierto] =
    useState(false);
  const [registroAEliminar, setRegistroAEliminar] = useState<string | null>(
    null,
  );

  const [estaDrawerAbierto, setEstaDrawerAbierto] = useState(false);
  const [drawerActual, setDrawerActual] =
    useState<DrawerIndicadorState | null>(null);

  // ── Form fields ────────────────────────────────────────────────────────────
  const [fecha, setFecha] = useState(obtenerHoyLocal());
  const [paciente, setPaciente] = useState("");
  const [tratamiento, setTratamiento] = useState("");
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState<string>("Efectivo");
  const [otroMetodoPago, setOtroMetodoPago] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [doctor, setDoctor] = useState("");

  // ── Auth ───────────────────────────────────────────────────────────────────
  const nombreAutenticado = useMemo(() => {
    try {
      if (userStored && typeof userStored === "object") {
        if (userStored.nombre) return userStored.nombre;
        const p = userStored.persona;
        const primerNombre = p?.primer_nombre || userStored.primer_nombre;
        const primerApellido = p?.primer_apellido || userStored.primer_apellido;
        if (primerNombre) {
          return `${primerNombre} ${primerApellido || ""}`.trim();
        }
      }
    } catch {
      return "Doctor Responsable";
    }
    return "Doctor Responsable";
  }, [userStored]);

  useEffect(() => {
    if (modoModal === "crear" && !idSeleccionado) {
      setDoctor(nombreAutenticado);
    }
  }, [nombreAutenticado, modoModal, idSeleccionado]);

  const localHoyStr = obtenerHoyLocal();

  // ── KPI indicators ─────────────────────────────────────────────────────────
  const indicadores = useMemo(() => {
    const y = new Date().getFullYear();
    const m = String(new Date().getMonth() + 1).padStart(2, "0");
    const prefix = `${y}-${m}`;

    const ingresosDelMes = registros
      .filter((r) => r.fecha.startsWith(prefix))
      .reduce((sum, r) => sum + r.monto, 0);

    const totalTransacciones = registros.length;

    const ingresosDelDia = registros
      .filter((r) => r.fecha === localHoyStr)
      .reduce((sum, r) => sum + r.monto, 0);

    const promedioPorPaciente =
      registros.length > 0
        ? registros.reduce((sum, r) => sum + r.monto, 0) / registros.length
        : 0;

    const fmt = (val: number) =>
      `L. ${val.toLocaleString("es-HN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    return [
      {
        label: "Ingresos del Mes",
        value: fmt(ingresosDelMes),
        icon: DollarSign,
        color: "#0BC5DF",
        bg: "#E6F8FB",
      },
      {
        label: "Total de Transacciones",
        value: String(totalTransacciones),
        icon: FileSpreadsheet,
        color: "#8B5CF6",
        bg: "#EDE9FE",
      },
      {
        label: "Ingresos del Día",
        value: fmt(ingresosDelDia),
        icon: Calendar,
        color: "#1D9E75",
        bg: "#ECFDF5",
      },
      {
        label: "Promedio por Paciente",
        value: fmt(promedioPorPaciente),
        icon: Users,
        color: "#203F49",
        bg: "#F1F3F4",
      },
    ];
  }, [registros, localHoyStr]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const filtros = useMemo(() => {
    const doctoresUnicos = Array.from(
      new Set(registros.map((r) => r.doctor).filter(Boolean)),
    );
    return [
      {
        key: "metodoPago",
        placeholder: "Método de pago",
        options: [
          { value: "Efectivo", label: "Efectivo" },
          { value: "Tarjeta", label: "Tarjeta" },
          { value: "Transferencia", label: "Transferencia" },
        ],
      },
      {
        key: "doctor",
        placeholder: "Doctor",
        options: doctoresUnicos.map((nombre) => ({
          value: nombre,
          label: nombre,
        })),
      },
    ];
  }, [registros]);

  // ── Drawer ─────────────────────────────────────────────────────────────────
  const abrirDrawerIndicador = (indicadorLabel: string) => {
    const indicador = indicadores.find((ind) => ind.label === indicadorLabel);
    const y = new Date().getFullYear();
    const m = String(new Date().getMonth() + 1).padStart(2, "0");
    const prefix = `${y}-${m}`;

    let filtrados: IncomeRecord[] = [];
    switch (indicadorLabel) {
      case "Ingresos del Mes":
        filtrados = registros.filter((r) => r.fecha.startsWith(prefix));
        break;
      case "Total de Transacciones":
        filtrados = [...registros];
        break;
      case "Ingresos del Día":
        filtrados = registros.filter((r) => r.fecha === localHoyStr);
        break;
      case "Promedio por Paciente":
        filtrados = [...registros];
        break;
    }

    const statsItems: StatsItem[] = filtrados.map((r) => ({
      nombre: r.paciente,
      categoría: r.tratamiento,
      monto: r.monto,
      fecha: r.fecha,
      responsable: r.doctor,
      observaciones: r.observaciones,
    }));

    setDrawerActual({
      title: indicadorLabel,
      items: statsItems,
      icon: indicador?.icon,
      iconColor: indicador?.color,
      totalValue: indicador?.value,
    });
    setEstaDrawerAbierto(true);
  };

  // ── Badges ─────────────────────────────────────────────────────────────────
  const obtenerBadgeMetodo = (metodo: string) => (
    <span
      style={{
        background: "#F1F3F4",
        color: "#5F656A",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {metodo}
    </span>
  );

  // ── Form helpers ───────────────────────────────────────────────────────────
  const limpiarFormulario = () => {
    setFecha(obtenerHoyLocal());
    setPaciente("");
    setTratamiento("");
    setMonto("");
    setMetodoPago("Efectivo");
    setOtroMetodoPago("");
    setObservaciones("");
    setDoctor(nombreAutenticado);
    setError(null);
    setIdSeleccionado(null);
  };

  const cerrarModal = () => {
    setEstaModalAbierto(false);
    setError(null);
    limpiarFormulario();
  };

  const abrirModal = (
    modo: "crear" | "editar" | "ver",
    registro?: IncomeRecord,
  ) => {
    setError(null);
    setModoModal(modo);
    if (registro) {
      setIdSeleccionado(registro.id);
      setFecha(registro.fecha);
      setPaciente(registro.paciente);
      setTratamiento(registro.tratamiento);
      setMonto(Number(registro.monto).toFixed(2));
      const isStandard = (["Efectivo", "Tarjeta", "Transferencia"] as string[]).includes(
        registro.metodoPago,
      );
      setMetodoPago(isStandard ? registro.metodoPago : "Otro");
      setOtroMetodoPago(isStandard ? "" : registro.metodoPago);
      setObservaciones(registro.observaciones);
      setDoctor(registro.doctor);
    } else {
      limpiarFormulario();
    }
    setEstaModalAbierto(true);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const manejarGuardarIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modoModal === "ver") return;
    setError(null);

    if (fecha > obtenerHoyLocal()) {
      setError("No se pueden registrar ingresos con una fecha futura.");
      return;
    }

    if (!paciente || !tratamiento || !monto) {
      setError("Por favor complete todos los campos obligatorios.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(monto)) {
      setError("Monto inválido: máximo 2 decimales.");
      return;
    }

    const parsedMonto = Number(Number(monto).toFixed(2));
    if (parsedMonto > 999999999.99) {
      setError("Monto excede el límite permitido.");
      return;
    }

    const finalMetodoPago =
      metodoPago === "Otro"
        ? otroMetodoPago.trim() || "Otro"
        : metodoPago;

    if (metodoPago === "Otro" && !otroMetodoPago.trim()) {
      setError("Por favor especifique el método de pago.");
      return;
    }

    setEstaCargando(true);
    try {
      if (modoModal === "crear") {
        const nuevoRegistro: IncomeRecord = {
          id: generateUUID(),
          fecha,
          paciente: paciente.trim(),
          tratamiento: tratamiento.trim(),
          monto: parsedMonto,
          metodoPago: finalMetodoPago,
          doctor: doctor.trim() || nombreAutenticado,
          observaciones: observaciones.trim(),
        };
        setRegistros([nuevoRegistro, ...registros]);
      } else if (modoModal === "editar" && idSeleccionado) {
        setRegistros(
          registros.map((r) =>
            r.id === idSeleccionado
              ? {
                  ...r,
                  fecha,
                  paciente: paciente.trim(),
                  tratamiento: tratamiento.trim(),
                  monto: parsedMonto,
                  metodoPago: finalMetodoPago,
                  doctor: doctor.trim() || nombreAutenticado,
                  observaciones: observaciones.trim(),
                }
              : r,
          ),
        );
      }
      cerrarModal();
    } catch {
      setError("Error al procesar la solicitud. Intente nuevamente.");
    } finally {
      setEstaCargando(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const manejarConfirmarEliminacion = async () => {
    if (!registroAEliminar || estaCargando) return;
    setEstaCargando(true);
    try {
      setRegistros(registros.filter((r) => r.id !== registroAEliminar));
      setRegistroAEliminar(null);
      setEstaModalConfirmacionAbierto(false);
    } catch {
      setError("Error al eliminar el registro.");
    } finally {
      setEstaCargando(false);
    }
  };

  // ── Export ─────────────────────────────────────────────────────────────────
  const exportarAExcel = async () => {
    if (registros.length === 0) return;
    try {
      const columnas = [
        { header: "Fecha", key: "fecha", width: 12 },
        { header: "Paciente", key: "paciente", width: 25 },
        { header: "Tratamiento", key: "tratamiento", width: 25 },
        { header: "Monto (L.)", key: "monto", width: 15 },
        { header: "Método de Pago", key: "metodoPago", width: 18 },
        { header: "Doctor", key: "doctor", width: 20 },
        { header: "Observaciones", key: "observaciones", width: 30 },
      ];
      await exportToExcel(registros, columnas, "Ingresos", "Ingresos_WebArco");
    } catch {
      setError("Error al exportar a Excel");
    }
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const imprimirReporte = () => {
    const vent = window.open("", "_blank");
    if (!vent) return;

    const totalIngresos = registros.reduce((sum, r) => sum + r.monto, 0);

    const filasHtml = registros
      .map(
        (r) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${escapeHtml(r.fecha)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${escapeHtml(r.paciente)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${escapeHtml(r.tratamiento)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; text-align: right;">${formatCurrency(r.monto)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${escapeHtml(r.metodoPago)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${escapeHtml(r.doctor)}</td>
      </tr>
    `,
      )
      .join("");

    vent.document.write(`
      <html>
        <head>
          <title>Reporte de Ingresos - WebArco Dental Studio</title>
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
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">WebArco Dental Studio</h1>
              <p class="subtitle">Reporte de Control de Ingresos</p>
            </div>
            <div class="meta">
              <p style="margin: 0;">Fecha de impresión: ${new Date().toLocaleDateString("es-HN")}</p>
              <p style="margin: 5px 0 0 0;">Total Registros: ${registros.length}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 12%;">Fecha</th>
                <th style="width: 22%;">Paciente</th>
                <th style="width: 28%;">Tratamiento</th>
                <th style="width: 15%; text-align: right;">Monto</th>
                <th style="width: 12%;">Método</th>
                <th style="width: 11%;">Doctor</th>
              </tr>
            </thead>
            <tbody>
              ${filasHtml}
              <tr class="total-row">
                <td colspan="3" class="total-cell" style="text-align: right;">Total General:</td>
                <td class="total-cell" style="text-align: right; color: #1D9E75;">${formatCurrency(totalIngresos)}</td>
                <td class="total-cell" colspan="2"></td>
              </tr>
            </tbody>
          </table>
          <script>
            window.onafterprint = function() { window.close(); };
            window.print();
          </script>
        </body>
      </html>
    `);
    vent.document.close();
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columnas = [
    { key: "fecha", label: "Fecha", width: 100 },
    {
      key: "paciente",
      label: "Paciente",
      render: (_val: unknown, record: IncomeRecord) => {
        const pName = String(record.paciente || "");
        const parts = pName.split(" ");
        const initials = `${pName.charAt(0)}${parts[1]?.charAt(0) || ""}`.toUpperCase();
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar initials={initials} size={24} color="#0BC5DF" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#203F49" }}>
              {pName}
            </span>
          </div>
        );
      },
    },
    { key: "tratamiento", label: "Tratamiento" },
    {
      key: "monto",
      label: "Monto",
      render: (val: unknown) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1D9E75" }}>
          {formatCurrency(Number(val || 0))}
        </span>
      ),
    },
    {
      key: "metodoPago",
      label: "Método de pago",
      render: (val: unknown) => obtenerBadgeMetodo(String(val)),
    },
    { key: "doctor", label: "Doctor" },
  ];

  const obtenerAccionesFila = (registro: IncomeRecord) => [
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Alert
        variant="info"
        message="Los ingresos se registran automáticamente en el historial del paciente."
      />

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {indicadores.map((indicador) => (
          <div
            key={indicador.label}
            onClick={() => abrirDrawerIndicador(indicador.label)}
            style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "";
            }}
          >
            <Card>
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
          </div>
        ))}
      </div>

      {/* Data Table */}
      <DataTable<IncomeRecord>
        title="Registros de Ingresos"
        description="Gestiona todos los ingresos de la clínica"
        columns={columnas}
        data={registros}
        searchable={true}
        searchPlaceholder="Buscar paciente o tratamiento..."
        searchKeys={["paciente", "tratamiento"]}
        filters={filtros}
        primaryAction={{
          label: "Registrar Ingreso",
          icon: <Plus size={16} />,
          onClick: () => abrirModal("crear"),
        }}
        secondaryActions={[
          {
            label: "Exportar",
            icon: <FileSpreadsheet size={13} />,
            onClick: exportarAExcel,
          },
          {
            label: "Imprimir",
            icon: <Printer size={13} />,
            onClick: imprimirReporte,
          },
        ]}
        rowActions={obtenerAccionesFila}
        getRowKey={(fila) => fila.id}
        emptyMessage="No hay ingresos registrados."
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        open={estaModalConfirmacionAbierto}
        variant="danger"
        title="¿Eliminar registro de ingreso?"
        description="Esta acción eliminará el registro permanentemente. Esta operación no se puede deshacer."
        confirmLabel="Eliminar"
        loading={estaCargando}
        cancelLabel="Cancelar"
        onClose={() => {
          setEstaModalConfirmacionAbierto(false);
          setRegistroAEliminar(null);
        }}
        onConfirm={manejarConfirmarEliminacion}
      />

      {/* Create / Edit / View Modal */}
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
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Modal Header */}
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
                    ? "Detalles del Ingreso"
                    : modoModal === "editar"
                      ? "Editar Ingreso"
                      : "Registrar Nuevo Ingreso"}
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

            {/* Inline error */}
            {error && (
              <div style={{ padding: "16px 20px 0 20px" }}>
                <Alert variant="error" message={error} />
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={manejarGuardarIngreso}
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Row: Fecha + Paciente */}
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
              >
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>
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
                    style={inputStyle(!!fecha, modoModal === "ver")}
                  />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>
                    Paciente
                    {modoModal !== "ver" && (
                      <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                    )}
                  </label>
                  <input
                    placeholder="Nombre del paciente..."
                    required
                    disabled={modoModal === "ver"}
                    value={paciente}
                    onChange={(e) => setPaciente(e.target.value)}
                    style={inputStyle(!!paciente, modoModal === "ver")}
                  />
                </div>
              </div>

              {/* Tratamiento */}
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
                  Tratamiento / Concepto
                  {modoModal !== "ver" && (
                    <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                  )}
                </label>
                <input
                  placeholder="Ej. Limpieza dental, Resina..."
                  required
                  disabled={modoModal === "ver"}
                  value={tratamiento}
                  onChange={(e) => setTratamiento(e.target.value)}
                  style={inputStyle(!!tratamiento, modoModal === "ver")}
                />
              </div>

              {/* Row: Monto + Método de pago */}
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
              >
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>
                    Monto (L.)
                    {modoModal !== "ver" && (
                      <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                    )}
                  </label>
                  <input
                    type={modoModal === "ver" ? "text" : "number"}
                    step="0.01"
                    placeholder="0.00"
                    required
                    disabled={modoModal === "ver"}
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    style={inputStyle(!!monto, modoModal === "ver")}
                  />
                </div>
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>
                    Método de pago
                    {modoModal !== "ver" && (
                      <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                    )}
                  </label>
                  {modoModal === "ver" ? (
                    <input
                      disabled
                      value={metodoPago === "Otro" ? otroMetodoPago : metodoPago}
                      style={inputStyle(true, true)}
                    />
                  ) : (
                    <select
                      required
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      style={{
                        ...inputStyle(!!metodoPago),
                        cursor: "pointer",
                      }}
                    >
                      {METODOS_PAGO.map((m) => (
                        <option key={m} value={m}>
                          {m === "Otro" ? "Otro..." : m}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Otro método de pago */}
              {metodoPago === "Otro" && modoModal !== "ver" && (
                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>
                    Especifique el método de pago
                    <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                  </label>
                  <input
                    placeholder="Ej. Cheque, Cripto..."
                    required
                    value={otroMetodoPago}
                    onChange={(e) => setOtroMetodoPago(e.target.value)}
                    style={inputStyle(!!otroMetodoPago)}
                  />
                </div>
              )}

              {/* Doctor responsable */}
              <div style={fieldGroupStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={labelStyle}>
                    Doctor Responsable
                    {modoModal !== "ver" && (
                      <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                    )}
                  </label>
                  {modoModal === "editar" && doctor !== nombreAutenticado && (
                    <button
                      type="button"
                      onClick={() => setDoctor(nombreAutenticado)}
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
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  required
                  placeholder="Nombre del doctor responsable"
                  style={inputStyle(!!doctor, modoModal === "ver")}
                />
              </div>

              {/* Observaciones */}
              <div style={fieldGroupStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={labelStyle}>Observaciones</label>
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
                    backgroundColor: modoModal === "ver"
                      ? "#F1F3F4"
                      : observaciones
                        ? "#fff"
                        : "#F3F3F5",
                    cursor: modoModal === "ver" ? "not-allowed" : "auto",
                  }}
                />
              </div>

              {/* Footer buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <Button variant="secondary" onClick={cerrarModal} type="button">
                  {modoModal === "ver" ? "Cerrar" : "Cancelar"}
                </Button>

                {modoModal !== "ver" && (
                  <Button
                    type="submit"
                    variant="primary"
                    loading={estaCargando}
                  >
                    {modoModal === "editar"
                      ? "Guardar Cambios"
                      : "Registrar Ingreso"}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Drawer */}
      <StatsDrawerContent
        open={estaDrawerAbierto}
        onClose={() => setEstaDrawerAbierto(false)}
        title={drawerActual?.title || ""}
        subtitle="Registros"
        items={drawerActual?.items || []}
        icon={drawerActual?.icon}
        iconColor={drawerActual?.iconColor}
        totalValue={drawerActual?.totalValue}
      />
    </div>
  );
}
