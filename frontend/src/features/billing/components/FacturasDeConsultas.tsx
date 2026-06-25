import React, { useState, useEffect } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { DataTable } from "../../../components/DataTable";
import { Button } from "../../../context";
import { consultationService } from "../../consultations/services/consultationService";
import { Consultation } from "../../consultations/types";
import { FacturaCobroDetalle } from "./FacturaCobroDetalle";
import { formatNumber } from "../../../utils/formatters";

interface PaymentRow extends Record<string, unknown> {
  id: string;
  tipo: "consulta" | "plan";
  consulta: Consultation;
  id_consulta: number;
  fecha_inicio: string;
  pacienteStr: string;
  dentistaStr: string;
  diagnostico?: string;
  motivo?: string;
  itemNombre: string;
  total: number;
  pagado: number;
  pendiente: number;
  estado: "Pagada" | "Pendiente" | "DESACTIVADO" | "CANCELADO" | "COMPLETADO";
  planEstado?: string;
  inactivo?: boolean;
}

function buildPaymentRows(consultations: Consultation[]): PaymentRow[] {
  const rows: PaymentRow[] = [];

  function parseConceptosLibresTotal(texto: string | null): { total: number; nombres: string[]; descuento: number } {
    if (!texto) return { total: 0, nombres: [], descuento: 0 };
    const match = texto.match(/Conceptos libres:\n([\s\S]*?)(?:\n(?=Planes activos:)|$)/);
    if (!match) return { total: 0, nombres: [], descuento: 0 };
    let total = 0;
    let descuento = 0;
    const nombres: string[] = [];
    for (const line of match[1].split('\n')) {
      const m = line.match(/^(.+?)\s*[—–-]\s*L\.?\s*([\d,]+(?:\.\d{2})?)(?:\s*\[desc:(\d+)%\])?$/);
      if (m) {
        nombres.push(m[1].trim());
        const precio = parseFloat(m[2].replace(/,/g, ''));
        total += precio;
        if (m[3]) descuento += precio * (parseInt(m[3], 10) / 100);
      }
    }
    return { total, nombres, descuento };
  }

  for (const c of consultations) {
    // ── Row: consulta (catalog treatments + conceptos libres) ──
    const tratamientosLista = c.tratamientos || [];
    const { total: totalConceptosLibres, nombres: nombresConceptos, descuento: descuentoConceptosLibres } = parseConceptosLibresTotal(c.tratamiento ?? null);

    const nombres = [
      ...tratamientosLista.map((t) => t.tratamiento?.nombre).filter(Boolean) as string[],
      ...nombresConceptos,
    ];
    const itemNombre = nombres.length > 0 ? nombres.join(", ") : c.tratamiento || "Consulta General";

    const subtotalBrutoCatalogo = tratamientosLista.reduce(
      (acc, t) => acc + (Number(t.precio) || Number(t.tratamiento?.precio) || 0),
      0
    );
    const subtotalBruto = subtotalBrutoCatalogo + totalConceptosLibres;
    if (subtotalBruto > 0) {
      const totalDescuento = tratamientosLista.reduce((acc, t) => {
        const p = Number(t.precio) || Number(t.tratamiento?.precio) || 0;
        return acc + p * (Number(t.descuento) / 100);
      }, 0) + descuentoConceptosLibres;
      const consultaTotal = subtotalBruto - totalDescuento;

      const pagosConsulta = c.pagos || [];
      const montoPagadoConsulta = pagosConsulta.reduce(
        (acc, p) => acc + Number((p as any).abono),
        0
      );

      rows.push({
        id: `consulta-${c.id_consulta}`,
        tipo: "consulta",
        consulta: c,
        id_consulta: c.id_consulta,
        fecha_inicio: c.fecha_inicio,
        pacienteStr: getPacienteStr(c),
        dentistaStr: getDentistaStr(c),
        diagnostico: c.diagnostico || undefined,
        motivo: c.motivo || undefined,
        itemNombre,
        total: consultaTotal,
        pagado: montoPagadoConsulta,
        pendiente: Math.max(0, consultaTotal - montoPagadoConsulta),
        estado:
          Math.max(0, consultaTotal - montoPagadoConsulta) <= 0
            ? "Pagada"
            : "Pendiente",
      });
    }

    // ── Row: plan (tratamientoPaciente) ──
    const plan = c.tratamientoPaciente;
    if (plan) {
      const planCosto = Number(plan.costoTotal);
      const planAbonos = plan.abonos || [];
      const planPagado = planAbonos.reduce(
        (acc, a) => acc + Number(a.montoAbonado),
        0
      );

      const planEstado = plan.estado;
      const inactivo =
        planEstado === "DESACTIVADO" || planEstado === "CANCELADO";
      const planPagadoCompleto = Math.max(0, planCosto - planPagado) <= 0;
      rows.push({
        id: `plan-${c.id_consulta}-${plan.id}`,
        tipo: "plan",
        consulta: c,
        id_consulta: c.id_consulta,
        fecha_inicio: c.fecha_inicio,
        pacienteStr: getPacienteStr(c),
        dentistaStr: getDentistaStr(c),
        diagnostico: undefined,
        motivo: undefined,
        itemNombre: `${plan.nombre} (Plan)`,
        total: planCosto,
        pagado: planPagado,
        pendiente: Math.max(0, planCosto - planPagado),
        estado:
          planEstado === "DESACTIVADO" ||
          planEstado === "CANCELADO" ||
          planEstado === "COMPLETADO"
            ? planEstado
            : planPagadoCompleto
            ? "Pagada"
            : "Pendiente",
        planEstado,
        inactivo,
      });
    }
  }

  return rows.sort(
    (a, b) =>
      new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
  );
}

function getPacienteStr(c: Consultation): string {
  if (!c.persona) return "Desconocido";
  const nombre =
    (c.persona as any).primer_nombre || (c.persona as any).nombre || "";
  const apellido =
    (c.persona as any).primer_apellido || (c.persona as any).apellido || "";
  return `${nombre} ${apellido}`.trim() || "Desconocido";
}

function getDentistaStr(c: Consultation): string {
  if (!c.doctor) return "N/A";
  const docPersona = (c.doctor as any).persona;
  if (docPersona) {
    return `${docPersona.primer_nombre || ""} ${
      docPersona.primer_apellido || ""
    }`.trim();
  }
  return (c.doctor as any).nombre || (c.doctor as any).username || "N/A";
}

export function FacturasDeConsultas() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsulta, setSelectedConsulta] = useState<Consultation | null>(
    null
  );
  const [selectedTipo, setSelectedTipo] = useState<"consulta" | "plan">(
    "consulta"
  );
  const [selectedInactivo, setSelectedInactivo] = useState(false);

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const res = await consultationService.getAll();
      if (res.success && res.data) {
        const dataArray = Array.isArray(res.data)
          ? res.data
          : (res.data as any).data;
        if (Array.isArray(dataArray)) {
          setConsultations(dataArray);
        } else {
          setConsultations([]);
        }
      }
    } catch (error) {
      console.error("Error loading consultations:", error);
    } finally {
      setLoading(false);
    }
  };

  const paymentRows = buildPaymentRows(consultations);

  const dentistaOptions = [
    ...new Set(paymentRows.map((r) => r.dentistaStr).filter(Boolean)),
  ].map((d) => ({ value: d, label: d }));

  const handleSelectRow = (row: PaymentRow) => {
    setSelectedConsulta(row.consulta);
    setSelectedTipo(row.tipo);
    setSelectedInactivo(row.inactivo || false);
  };

  const columns = [
    {
      key: "id",
      label: "ID",
      width: 60,
      render: (_: any, row: PaymentRow) => row.id_consulta,
    },
    {
      key: "pacienteStr",
      label: "Paciente",
      render: (val: unknown) => String(val ?? "Desconocido"),
    },
    {
      key: "dentistaStr",
      label: "Dentista",
      render: (val: unknown) => String(val ?? "N/A"),
    },
    {
      key: "fecha_inicio",
      label: "Fecha",
      render: (val: unknown) =>
        new Date(val as string).toLocaleDateString("es-HN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      key: "tipo",
      label: "Tipo",
      width: 80,
      align: "center" as const,
      render: (val: unknown) => {
        const t = String(val ?? "");
        return t === "plan" ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 8,
              background: "#ede9fe",
              color: "#7c3aed",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            Plan
          </span>
        ) : (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 8,
              background: "#e0f2fe",
              color: "#0284c7",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            Consulta
          </span>
        );
      },
    },
    {
      key: "total",
      label: "Total",
      render: (val: unknown) => `L ${formatNumber(Number(val) || 0)}`,
    },
    {
      key: "pagado",
      label: "Pagado",
      render: (val: unknown) => (
        <span style={{ color: "#10b981", fontWeight: 500 }}>
          L {formatNumber(Number(val) || 0)}
        </span>
      ),
    },
    {
      key: "pendiente",
      label: "Pendiente",
      render: (val: unknown) => {
        const pending = Number(val);
        return (
          <span
            style={{
              color: pending > 0 ? "#ef4444" : "#64748b",
              fontWeight: 500,
            }}
          >
            L {formatNumber(pending)}
          </span>
        );
      },
    },
    {
      key: "estado",
      label: "Estado",
      align: "center" as const,
      render: (val: unknown) => {
        const e = String(val ?? "");
        if (e === "DESACTIVADO") {
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 8px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 500,
                background: "#F2F4F7",
                color: "#475467",
              }}
            >
              Desactivado
            </span>
          );
        }
        if (e === "CANCELADO") {
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 8px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 500,
                background: "#FEF3F2",
                color: "#B42318",
              }}
            >
              Cancelado
            </span>
          );
        }
        if (e === "COMPLETADO") {
          return (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 8px",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 500,
                background: "#ECFDF3",
                color: "#027A48",
              }}
            >
              <CheckCircle2 size={12} /> Pagada
            </span>
          );
        }
        return e === "Pagada" ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 500,
              background: "#ECFDF3",
              color: "#027A48",
            }}
          >
            <CheckCircle2 size={12} /> Pagada
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 500,
              background: "#FFFAEB",
              color: "#B54708",
            }}
          >
            <Clock size={12} /> Pendiente
          </span>
        );
      },
    },
    {
      key: "id",
      label: "Acción",
      align: "center" as const,
      render: (_: unknown, row: PaymentRow) => {
        if (row.pendiente <= 0 || row.inactivo) {
          return (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSelectRow(row)}
              style={{ color: "#64748b", borderColor: "#e2e8f0" }}
            >
              Ver Detalles
            </Button>
          );
        }
        return (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSelectRow(row)}
            style={{
              background: "#0ea5e9",
              borderColor: "#0ea5e9",
              color: "#fff",
            }}
          >
            Cobrar
          </Button>
        );
      },
    },
  ];

  if (selectedConsulta) {
    return (
      <FacturaCobroDetalle
        consulta={selectedConsulta}
        tipo={selectedTipo}
        inactivo={selectedInactivo}
        onBack={() => {
          setSelectedConsulta(null);
          setSelectedInactivo(false);
          loadConsultations();
        }}
        onPaymentSuccess={() => {
          loadConsultations();
          consultationService
            .getById(selectedConsulta.id_consulta)
            .then((res) => {
              if (res.success && res.data) {
                setSelectedConsulta(res.data);
              }
            });
        }}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 20,
        width: "100%",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, transition: "all 0.3s" }}>
        <DataTable<PaymentRow>
          title="Gestión de Pago"
          description="Gestión de cobros para los tratamientos aplicados en las consultas y planes vinculados."
          columns={columns}
          data={paymentRows}
          searchable
          searchPlaceholder="Buscar por ID, paciente, dentista o fecha..."
          searchKeys={[
            "id_consulta",
            "fecha_inicio",
            "pacienteStr",
            "dentistaStr",
          ]}
          filters={[
            {
              key: "tipo",
              placeholder: "Tipo",
              options: [
                { value: "consulta", label: "Consulta" },
                { value: "plan", label: "Plan" },
              ],
            },
            {
              key: "estado",
              placeholder: "Estado",
              options: [
                { value: "Pagada", label: "Pagada" },
                { value: "Pendiente", label: "Pendiente" },
                { value: "DESACTIVADO", label: "Desactivado" },
                { value: "CANCELADO", label: "Cancelado" },
                { value: "COMPLETADO", label: "Completado" },
              ],
            },
            {
              key: "dentistaStr",
              placeholder: "Dentista",
              options: dentistaOptions,
            },
          ]}
          pageSize={10}
          renderMobileCard={(row: Record<string, unknown>) => (
            <PaymentCard
              row={row as unknown as PaymentRow}
              onSelect={() => handleSelectRow(row as unknown as PaymentRow)}
            />
          )}
        />
      </div>
    </div>
  );
}

function PaymentTypeBadge({ tipo }: { tipo: string }) {
  return tipo === "plan" ? (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 8,
        background: "#ede9fe",
        color: "#7c3aed",
        textTransform: "uppercase",
        letterSpacing: "0.3px",
      }}
    >
      Plan
    </span>
  ) : (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 8,
        background: "#e0f2fe",
        color: "#0284c7",
        textTransform: "uppercase",
        letterSpacing: "0.3px",
      }}
    >
      Consulta
    </span>
  );
}

function PaymentStatusBadge({ estado }: { estado: string }) {
  if (estado === "DESACTIVADO") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 8px",
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 500,
          background: "#F2F4F7",
          color: "#475467",
        }}
      >
        Desactivado
      </span>
    );
  }
  if (estado === "CANCELADO") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 8px",
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 500,
          background: "#FEF3F2",
          color: "#B42318",
        }}
      >
        Cancelado
      </span>
    );
  }
  if (estado === "COMPLETADO" || estado === "Pagada") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 8px",
          borderRadius: 12,
          fontSize: 11,
          fontWeight: 500,
          background: "#ECFDF3",
          color: "#027A48",
        }}
      >
        <CheckCircle2 size={12} /> Pagada
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 500,
        background: "#FFFAEB",
        color: "#B54708",
      }}
    >
      <Clock size={12} /> Pendiente
    </span>
  );
}

function PaymentCard({
  row,
  onSelect,
}: {
  row: PaymentRow;
  onSelect: () => void;
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
            {row.pacienteStr}
          </p>
          <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
            ID {row.id_consulta} ·{" "}
            {new Date(row.fecha_inicio).toLocaleDateString("es-HN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <PaymentTypeBadge tipo={row.tipo} />
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
          <span style={{ fontSize: 12, color: "#888F94" }}>Dentista</span>
          <span style={{ fontSize: 13, color: "#203F49" }}>
            {row.dentistaStr}
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
          <span style={{ fontSize: 12, color: "#888F94" }}>Total</span>
          <span style={{ fontSize: 13, color: "#203F49" }}>
            L {formatNumber(row.total)}
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
          <span style={{ fontSize: 12, color: "#888F94" }}>Pagado</span>
          <span style={{ fontSize: 13, color: "#10b981", fontWeight: 500 }}>
            L {formatNumber(row.pagado)}
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
          <span style={{ fontSize: 12, color: "#888F94" }}>Pendiente</span>
          <span
            style={{
              fontSize: 13,
              color: row.pendiente > 0 ? "#ef4444" : "#64748b",
              fontWeight: 500,
            }}
          >
            L {formatNumber(row.pendiente)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "7px 0",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Estado</span>
          <PaymentStatusBadge estado={row.estado} />
        </div>

        {row.pendiente <= 0 || row.inactivo ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSelect}
            style={{
              width: "100%",
              marginTop: 10,
              color: "#64748b",
              borderColor: "#e2e8f0",
            }}
          >
            Ver Detalles
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={onSelect}
            style={{
              width: "100%",
              marginTop: 10,
              background: "#0ea5e9",
              borderColor: "#0ea5e9",
              color: "#fff",
            }}
          >
            Cobrar
          </Button>
        )}
      </div>
    </div>
  );
}
