import { useState, useMemo, useEffect } from "react";
import { Card, Alert, Button } from "../../../context";
import {
  formatCurrency,
  obtenerHoyLocal,
  escapeHtml,
  generateUUID,
} from "../../../utils/formatters";
import { exportToExcel } from "../../../utils/exportToExcel";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { StatsDrawerContent, StatsItem } from "./StatsDrawerContent";
import billingService from "../services/billingService";
import { inventoryService } from "../../inventory/services/inventoryService";
import type { InventoryItem } from "../../inventory/types";
import type {
  CreateExpenseInput,
  ExpenseMetricResponse,
  ExpenseSummaryResponse,
  FinancialRecord,
} from "../types";
import {
  TrendingDown,
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
import { useResponsive } from "../../../hooks/useWindowWidth";

type CategoriaEgreso = "Insumos" | "Equipos" | "Nómina" | "Servicios";
const CATEGORIAS: CategoriaEgreso[] = [
  "Insumos",
  "Equipos",
  "Nómina",
  "Servicios",
];

type RegistroEgreso = {
  id: number;
  fecha: string;
  concepto: string;
  categoria: CategoriaEgreso;
  monto: number;
  responsable: string;
  observaciones: string;
};

type DrawerIndicadorState = {
  title: string;
  items: StatsItem[];
  icon?: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
  iconColor?: string;
  totalValue?: string;
};

const inputStyle = (
  filled: boolean,
  disabled = false
): React.CSSProperties => ({
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

const extraerIdEgreso = (record: FinancialRecord) => {
  const rawId = String(record.id_registro || "").replace("expense-", "");
  return Number(rawId);
};

const normalizarEgreso = (record: FinancialRecord): RegistroEgreso => {
  return {
    id: extraerIdEgreso(record),
    fecha: record.fecha,
    concepto: record.concepto,
    categoria: (record.categoria || "Insumos") as CategoriaEgreso,
    monto: Number(record.monto || 0),
    responsable:
      record.responsable ||
      record.creado_por?.nombre_completo ||
      "Usuario Autenticado",
    observaciones: record.observaciones || "",
  };
};

const convertirAStatsItems = (registros: FinancialRecord[]): StatsItem[] => {
  return registros.map((r) => ({
    nombre: r.concepto,
    categoría: String(r.categoria || "Insumos"),
    monto: Number(r.monto || 0),
    fecha: r.fecha,
    responsable:
      r.responsable || r.creado_por?.nombre_completo || "Usuario Autenticado",
    observaciones: r.observaciones || "",
  }));
};

const formatMoneda = (val: number) =>
  `L. ${Number(val || 0).toLocaleString("es-HN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
export function GestionEgresos() {
  const { isMobile } = useResponsive();
  const [estaModalAbierto, setEstaModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState<"crear" | "editar" | "ver">(
    "crear"
  );
  const [registros, setRegistros] = useState<RegistroEgreso[]>([]);
  const [resumenEgresos, setResumenEgresos] =
    useState<ExpenseSummaryResponse | null>(null);
  const [estaCargando, setEstaCargando] = useState(false);

  const [estaModalConfirmacionAbierto, setEstaModalConfirmacionAbierto] =
    useState(false);
  const [registroAEliminar, setRegistroAEliminar] = useState<number | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);
  const [userStored] = useLocalStorage<Record<string, unknown>>(
    "webarco_user",
    {}
  );

  const [estaDrawerAbierto, setEstaDrawerAbierto] = useState(false);
  const [drawerActual, setDrawerActual] = useState<DrawerIndicadorState | null>(
    null
  );

  const nombreAutenticado = useMemo(() => {
    try {
      if (userStored && typeof userStored === "object") {
        if (userStored.nombre) return userStored.nombre as string;

        const p = userStored.persona as Record<string, unknown> | undefined;
        const primerNombre = (p?.primer_nombre as string | undefined) || (userStored.primer_nombre as string | undefined);
        const primerApellido = (p?.primer_apellido as string | undefined) || (userStored.primer_apellido as string | undefined);

        if (primerNombre) {
          return `${primerNombre} ${primerApellido || ""}`.trim();
        }
      }
    } catch {
      return "Usuario Autenticado";
    }
    return "Usuario Autenticado";
  }, [userStored]);

  const [fecha, setFecha] = useState(obtenerHoyLocal());
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<CategoriaEgreso>("Insumos");
  const [monto, setMonto] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);
  const [responsable, setResponsable] = useState(nombreAutenticado);

  const [tempInsumoId, setTempInsumoId] = useState("");
  const [tempCantidad, setTempCantidad] = useState("");
  const [insumosDisponibles, setInsumosDisponibles] = useState<InventoryItem[]>([]);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<{
    id_insumo: number;
    nombre: string;
    cantidad: number;
    precio_costo: number;
    stock_actual: number;
  }[]>([]);

  useEffect(() => {
    if (estaModalAbierto && categoria === "Insumos" && insumosDisponibles.length === 0) {
      const cargarInsumos = async () => {
        try {
          const res = await inventoryService.getAll({ estadoRegistro: "activo" });
          if (res.success && res.data) {
            setInsumosDisponibles(res.data.data || []);
          }
        } catch (err: any) {
          console.error("Error al cargar insumos", err);
        }
      };
      void cargarInsumos();
    }
  }, [estaModalAbierto, categoria, insumosDisponibles.length]);

  const agregarInsumoALista = () => {
    if (!tempInsumoId) {
      setError("Por favor seleccione un insumo.");
      return;
    }
    const cant = parseInt(tempCantidad, 10);
    if (isNaN(cant) || cant <= 0) {
      setError("Por favor ingrese una cantidad válida mayor a 0.");
      return;
    }

    const insumoObj = insumosDisponibles.find(
      (ins) => ins.id_insumo === Number(tempInsumoId)
    );
    if (!insumoObj) {
      setError("Insumo no encontrado.");
      return;
    }

    if (cant > insumoObj.stock_actual) {
      setError(`No hay stock suficiente. Stock disponible de "${insumoObj.nombre}": ${insumoObj.stock_actual}`);
      return;
    }

    const yaExiste = insumosSeleccionados.find(
      (item) => item.id_insumo === insumoObj.id_insumo
    );
    if (yaExiste) {
      setError("Este insumo ya ha sido agregado. Elimínelo primero si desea cambiar la cantidad.");
      return;
    }

    const nuevaLista = [
      ...insumosSeleccionados,
      {
        id_insumo: insumoObj.id_insumo,
        nombre: insumoObj.nombre,
        cantidad: cant,
        precio_costo: insumoObj.precio_costo,
        stock_actual: insumoObj.stock_actual,
      },
    ];

    setInsumosSeleccionados(nuevaLista);

    const total = nuevaLista.reduce(
      (acc, item) => acc + item.cantidad * item.precio_costo,
      0
    );
    setMonto(total.toFixed(2));

    setTempInsumoId("");
    setTempCantidad("");
    setError(null);
  };

  const removerInsumoDeLista = (index: number) => {
    const nuevaLista = [...insumosSeleccionados];
    nuevaLista.splice(index, 1);
    setInsumosSeleccionados(nuevaLista);

    const total = nuevaLista.reduce(
      (acc, item) => acc + item.cantidad * item.precio_costo,
      0
    );
    setMonto(nuevaLista.length > 0 ? total.toFixed(2) : "");
  };

  const cargarEgresos = async () => {
    setEstaCargando(true);
    setError(null);

    try {
      const response = await billingService.getExpenses();
      setRegistros((response.data || []).map(normalizarEgreso));
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar los egresos.");
    } finally {
      setEstaCargando(false);
    }
  };

  const cargarResumen = async () => {
    try {
      const response = await billingService.getExpenseSummary();
      setResumenEgresos(response.data);
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar el resumen de egresos.");
    }
  };

  useEffect(() => {
    void cargarEgresos();
    void cargarResumen();
  }, []);

  useEffect(() => {
    if (modoModal === "crear" && !idSeleccionado) {
      setResponsable(nombreAutenticado);
    }
  }, [nombreAutenticado, modoModal, idSeleccionado]);

  const indicadores = useMemo(() => {
    return [
      {
        label: "Egresos del Mes",
        value: formatMoneda(resumenEgresos?.egresos_del_mes?.total || 0),
        icon: TrendingDown,
        color: "#EF4444",
        bg: "#FEE2E2",
      },
      {
        label: "Egreso del Día",
        value: formatMoneda(resumenEgresos?.egreso_del_dia?.total || 0),
        icon: Calendar,
        color: "#0BC5DF",
        bg: "#E6F8FB",
      },
      {
        label: "Promedio Mensual de Egresos",
        value: formatMoneda(resumenEgresos?.egreso_promedio?.total || 0),
        icon: DollarSign,
        color: "#203F49",
        bg: "#F1F3F4",
      },
    ];
  }, [resumenEgresos]);

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

  const abrirDrawerIndicador = async (indicadorLabel: string) => {
    const indicador = indicadores.find((ind) => ind.label === indicadorLabel);

    setDrawerActual({
      title: indicadorLabel,
      items: [],
      icon: indicador?.icon,
      iconColor: indicador?.color,
      totalValue: indicador?.value,
    });
    setEstaDrawerAbierto(true);

    try {
      let response: { data: ExpenseMetricResponse };

      switch (indicadorLabel) {
        case "Egresos del Mes":
          response = await billingService.getExpensesMonth();
          break;

        case "Egreso del Día":
          response = await billingService.getExpensesDay();
          break;

        case "Promedio Mensual de Egresos":
          response = await billingService.getExpensesAverageMonth();
          break;

        default:
          return;
      }

      setDrawerActual({
        title: indicadorLabel,
        items: convertirAStatsItems(response.data.registros || []),
        icon: indicador?.icon,
        iconColor: indicador?.color,
        totalValue: formatMoneda(response.data.total || 0),
      });
    } catch (err: any) {
      setError(
        err?.message || "No se pudieron cargar los registros del indicador."
      );
    }
  };

  const manejarGuardarEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modoModal === "ver") return;
    setError(null);

    if (fecha > obtenerHoyLocal()) {
      setError("No se pueden registrar egresos con una fecha futura.");
      return;
    }

    if (!concepto || !monto) {
      setError("Por favor complete todos los campos obligatorios.");
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(monto)) {
      setError("Monto inválido: máximo 2 decimales");
      return;
    }
    const parsedMonto = Number(Number(monto).toFixed(2));
    if (parsedMonto > 999999999.99) {
      setError("Monto excede el límite permitido");
      return;
    }

    const payload: CreateExpenseInput = {
      fecha,
      concepto: concepto.trim(),
      categoria,
      monto: parsedMonto,
      observaciones: observaciones.trim() || undefined,
      ...(categoria === "Insumos" && insumosSeleccionados.length > 0
        ? {
            insumos: insumosSeleccionados.map((item) => ({
              id_insumo: item.id_insumo,
              cantidad: item.cantidad,
            })),
          }
        : {}),
    };

    setEstaCargando(true);

    try {
      if (modoModal === "crear") {
        await billingService.createExpense(payload);
      } else if (modoModal === "editar" && idSeleccionado) {
        await billingService.updateExpense(idSeleccionado, payload);
      }

      await cargarEgresos();
      await cargarResumen();
      cerrarModal();
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el egreso.");
    } finally {
      setEstaCargando(false);
    }
  };

  const manejarConfirmarEliminacion = async () => {
    if (!registroAEliminar || estaCargando) return;

    setEstaCargando(true);
    setError(null);

    try {
      await billingService.deleteExpense(registroAEliminar);
      await cargarEgresos();
      await cargarResumen();
      setRegistroAEliminar(null);
      setEstaModalConfirmacionAbierto(false);
    } catch (err: any) {
      setError(err?.message || "Error al eliminar el registro.");
    } finally {
      setEstaCargando(false);
    }
  };

  const cerrarModal = () => {
    setEstaModalAbierto(false);
    setError(null);
    limpiarFormulario();
  };

  const limpiarFormulario = () => {
    setFecha(obtenerHoyLocal());
    setConcepto("");
    setMonto("");
    setCategoria("Insumos");
    setObservaciones("");
    setResponsable(nombreAutenticado);
    setError(null);
    setIdSeleccionado(null);
    setTempInsumoId("");
    setTempCantidad("");
    setInsumosSeleccionados([]);
  };

  const abrirModal = async (
    modo: "crear" | "editar" | "ver",
    registro?: RegistroEgreso
  ) => {
    setError(null);
    setModoModal(modo);
    setTempInsumoId("");
    setTempCantidad("");
    if (registro) {
      setIdSeleccionado(registro.id);
      setFecha(registro.fecha);
      setConcepto(registro.concepto);
      setCategoria(registro.categoria);
      setMonto(Number(registro.monto).toFixed(2));
      setObservaciones(registro.observaciones);
      setResponsable(registro.responsable);

      if (registro.categoria === "Insumos") {
        try {
          const res = await billingService.getExpenseById(registro.id);
          if (res.success && res.data) {
            const insumos = (res.data as any).insumos || [];
            setInsumosSeleccionados(insumos);
          }
        } catch (err: any) {
          console.error("Error al cargar detalles del egreso", err);
        }
      } else {
        setInsumosSeleccionados([]);
      }
    } else {
      limpiarFormulario();
    }
    setEstaModalAbierto(true);
  };

  const exportarAExcel = async () => {
    if (registros.length === 0) return;
    try {
      const columnas = [
        { header: "Fecha", key: "fecha", width: 12 },
        { header: "Concepto", key: "concepto", width: 30 },
        { header: "Categoría", key: "categoria", width: 20 },
        { header: "Monto (L.)", key: "monto", width: 15 },
        { header: "Responsable", key: "responsable", width: 25 },
        { header: "Observaciones", key: "observaciones", width: 30 },
      ];
      await exportToExcel(registros, columnas, "Egresos", "Egresos_WebArco");
    } catch {
      setError("Error al exportar a Excel");
    }
  };

  const imprimirReporte = () => {
    const vent = window.open("", "_blank");
    if (!vent) return;

    const totalEgresos = registros.reduce((sum, r) => sum + r.monto, 0);

    const filasHtml = registros
      .map(
        (r) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${escapeHtml(
          r.fecha
        )}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${escapeHtml(
          r.concepto
        )}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${escapeHtml(
          r.categoria
        )}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0; font-weight: bold; text-align: right;">${formatCurrency(
          r.monto
        )}</td>
        <td style="padding: 10px; border-bottom: 1px solid #E2E8F0;">${escapeHtml(
          r.responsable
        )}</td>
      </tr>
    `
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
              <p style="margin: 0;">Fecha de impresión: ${new Date().toLocaleDateString(
                "es-HN"
              )}</p>
              <p style="margin: 5px 0 0 0;">Total Registros: ${
                registros.length
              }</p>
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
                <td class="total-cell" style="text-align: right; color: #EF4444;">${formatCurrency(
                  totalEgresos
                )}</td>
                <td class="total-cell"></td>
              </tr>
            </tbody>
          </table>
          <script>
            window.onafterprint = function() {
              window.close();
            };
            window.print();
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
          {formatCurrency(Number(val || 0))}
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
          <div
            key={indicador.label}
            onClick={() => void abrirDrawerIndicador(indicador.label)}
            style={{
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(-2px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 4px 12px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(0)";
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
                  <indicador.icon
                    size={20}
                    style={{ color: indicador.color }}
                  />
                </div>
              </div>
            </Card>
          </div>
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
            onClick: exportarAExcel,
          },
          {
            label: "Imprimir",
            icon: <Printer size={13} />,
            onClick: imprimirReporte,
          },
        ]}
        rowActions={obtenerAccionesFila}
        getRowKey={(fila) => String(fila.id)}
        renderMobileCard={(registro) => (
          <ExpenseCard
            registro={registro}
            obtenerBadgeCategoria={obtenerBadgeCategoria}
            actions={obtenerAccionesFila(registro)}
          />
        )}
      />

      <ConfirmModal
        open={estaModalConfirmacionAbierto}
        variant="danger"
        title="¿Eliminar registro de egreso?"
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
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 12,
                }}
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
                    Categoría
                    {modoModal !== "ver" && (
                      <span style={{ color: "#EF9F27", marginLeft: 4 }}>*</span>
                    )}
                  </label>
                  {modoModal === "ver" ? (
                    <input
                      disabled
                      value={categoria}
                      style={inputStyle(true, true)}
                    />
                  ) : (
                    <select
                      required
                      value={categoria}
                      onChange={(e) => {
                        const newCat = e.target.value as CategoriaEgreso;
                        setCategoria(newCat);
                        if (newCat !== "Insumos") {
                          setInsumosSeleccionados([]);
                        }
                      }}
                      style={{
                        ...inputStyle(!!categoria),
                        cursor: "pointer",
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

              <div style={fieldGroupStyle}>
                <label style={labelStyle}>
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
                  style={inputStyle(!!concepto, modoModal === "ver")}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 12,
                }}
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
                    disabled={modoModal === "ver"}
                    required
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    style={inputStyle(!!monto, modoModal === "ver")}
                  />
                </div>
                <div style={fieldGroupStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label style={labelStyle}>
                      Responsable
                      {modoModal !== "ver" && (
                        <span style={{ color: "#EF9F27", marginLeft: 4 }}>
                          *
                        </span>
                      )}
                    </label>
                  </div>
                  <input
                    disabled
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    required
                    placeholder="Nombre del responsable"
                    style={inputStyle(!!responsable, modoModal === "ver")}
                  />
                </div>
              </div>

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
                    backgroundColor: observaciones ? "#fff" : "#F3F3F5",
                  }}
                />
              </div>

              {categoria === "Insumos" && (
                <div
                  style={{
                    border: "1px solid #EAECEE",
                    borderRadius: 8,
                    padding: 12,
                    backgroundColor: "#F8F9FA",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#203F49",
                    }}
                  >
                    Insumos restados de inventario
                  </h4>

                  {modoModal !== "ver" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 100px auto",
                        gap: 8,
                        alignItems: "flex-end",
                      }}
                    >
                      <div style={fieldGroupStyle}>
                        <label style={{ ...labelStyle, fontSize: 11 }}>
                          Seleccionar Insumo
                        </label>
                        <select
                          value={tempInsumoId}
                          onChange={(e) => setTempInsumoId(e.target.value)}
                          style={{
                            ...inputStyle(!!tempInsumoId),
                            padding: "8px 10px",
                            fontSize: 13,
                          }}
                        >
                          <option value="">-- Seleccione --</option>
                          {insumosDisponibles.map((ins) => (
                            <option key={ins.id_insumo} value={ins.id_insumo}>
                              {ins.nombre} (Stock: {ins.stock_actual})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={fieldGroupStyle}>
                        <label style={{ ...labelStyle, fontSize: 11 }}>
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Cant"
                          value={tempCantidad}
                          onChange={(e) => setTempCantidad(e.target.value)}
                          style={{
                            ...inputStyle(!!tempCantidad),
                            padding: "8px 10px",
                            fontSize: 13,
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={agregarInsumoALista}
                        variant="secondary"
                        style={{
                          height: 38,
                          padding: "0 12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        Agregar
                      </Button>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    {insumosSeleccionados.length === 0 ? (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#888F94",
                          fontStyle: "italic",
                        }}
                      >
                        No hay insumos seleccionados.
                      </span>
                    ) : (
                      insumosSeleccionados.map((item, index) => (
                        <div
                          key={item.id_insumo}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#fff",
                            padding: "6px 10px",
                            borderRadius: 6,
                            border: "1px solid #E2E8F0",
                            fontSize: 13,
                          }}
                        >
                          <div>
                            <span
                              style={{ fontWeight: 500, color: "#203F49" }}
                            >
                              {item.nombre}
                            </span>
                            <span
                              style={{
                                marginLeft: 8,
                                color: "#888F94",
                                fontSize: 11,
                              }}
                            >
                              (Cant:{" "}
                              <strong style={{ color: "#203F49" }}>
                                {item.cantidad}
                              </strong>
                              )
                            </span>
                          </div>
                          {modoModal !== "ver" && (
                            <button
                              type="button"
                              onClick={() => removerInsumoDeLista(index)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#EF4444",
                                cursor: "pointer",
                                fontSize: 12,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 8,
                }}
              >
                <Button variant="secondary" onClick={cerrarModal} type="button">
                  Cancelar
                </Button>

                {modoModal !== "ver" && (
                  <Button
                    type="submit"
                    variant="primary"
                    loading={estaCargando}
                  >
                    {modoModal === "editar"
                      ? "Guardar Cambios"
                      : "Registrar Egreso"}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

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

function ExpenseCard({
  registro,
  obtenerBadgeCategoria,
  actions,
}: {
  registro: RegistroEgreso;
  obtenerBadgeCategoria: (categoria: string) => React.ReactNode;
  actions: {
    icon: React.ReactNode;
    label?: string;
    onClick: (row: RegistroEgreso) => void;
    danger?: boolean;
  }[];
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
          marginBottom: 10,
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
            {registro.concepto}
          </p>
          <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
            {registro.fecha}
          </p>
        </div>
        {obtenerBadgeCategoria(registro.categoria)}
      </div>

      <div style={{ borderTop: "1px solid #F8F9FA", paddingTop: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Monto</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#EF4444" }}>
            {formatCurrency(Number(registro.monto || 0))}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Responsable</span>
          <span style={{ fontSize: 13, color: "#203F49" }}>
            {registro.responsable}
          </span>
        </div>
        {registro.observaciones && (
          <div style={{ padding: "7px 0" }}>
            <span
              style={{
                fontSize: 12,
                color: "#888F94",
                display: "block",
                marginBottom: 4,
              }}
            >
              Observaciones
            </span>
            <span style={{ fontSize: 13, color: "#203F49" }}>
              {registro.observaciones}
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          {actions.map((action, i) => (
            <button
              key={i}
              title={action.label}
              onClick={() => action.onClick(registro)}
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
                color: action.danger ? "#E24B4A" : "#5F656A",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
