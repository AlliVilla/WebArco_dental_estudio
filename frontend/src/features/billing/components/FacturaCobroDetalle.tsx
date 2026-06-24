import React, { useState, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Landmark,
  Receipt,
  FileText,
  Activity,
  DollarSign,
  History,
  CheckCircle,
  AlertCircle,
  Printer,
} from "lucide-react";
import { Card, Button } from "../../../context";
import { useResponsive } from "../../../hooks/useWindowWidth";
import { Consultation } from "../../consultations/types";
import { billingService } from "../services/billingService";
import { formatNumber } from "../../../utils/formatters";
import { printInvoice, printPaymentReceipt } from "../utils/printBilling";
import { Modal } from "../../../components";



interface FacturaCobroDetalleProps {
  consulta: Consultation;
  tipo?: "consulta" | "plan";
  inactivo?: boolean;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

interface ToastMsg {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

const C = {
  primary: "var(--arco-primary, #0BC5DF)",
  navy: "var(--arco-navy, #203F49)",
  success: "var(--arco-success, #1D9E75)",
  warning: "var(--arco-warning, #EF9F27)",
  danger: "var(--arco-danger, #E24B4A)",
  gray500: "var(--arco-gray-500, #888F94)",
  white: "#ffffff",
};

function uid() {
  return Math.random().toString(36).slice(2);
}

function Toast({
  toasts,
  remove,
}: {
  toasts: ToastMsg[];
  remove: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 24,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        const colors = {
          success: { bg: C.success, icon: <CheckCircle size={16} /> },
          error: { bg: C.danger, icon: <AlertCircle size={16} /> },
          info: { bg: C.primary, icon: <AlertCircle size={16} /> },
        }[t.type];
        return (
          <div
            key={t.id}
            style={{
              pointerEvents: "all",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: C.white,
              border: `1.5px solid ${colors.bg}`,
              borderRadius: 10,
              padding: "12px 16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              minWidth: 280,
              maxWidth: 380,
              animation: "slideIn 0.2s ease",
            }}
          >
            <span style={{ color: colors.bg, flexShrink: 0 }}>
              {colors.icon}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: C.navy }}>
              {t.message}
            </span>
            <button
              onClick={() => remove(t.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.gray500,
                display: "flex",
              }}
            >
              X
            </button>
          </div>
        );
      })}
    </div>
  );
}

export const FacturaCobroDetalle: React.FC<FacturaCobroDetalleProps> = ({
  consulta,
  tipo,
  inactivo,
  onBack,
  onPaymentSuccess,
}) => {
  const { isMobile } = useResponsive();
  const [paymentMethod, setPaymentMethod] = useState<
    "Tarjeta" | "Efectivo" | "Transferencia"
  >("Efectivo");
  const [posSystem, setPosSystem] = useState<"BAC" | "Ficohsa" | "Banpaís">(
    "BAC"
  );
  const [bankAccount, setBankAccount] = useState("BAC - Cuenta Principal");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [montoParcial, setMontoParcial] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [savingDiscounts, setSavingDiscounts] = useState(false);
  const [descuentosCerrados, setDescuentosCerrados] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const addToast = useCallback((type: ToastMsg["type"], message: string) => {
    const id = uid();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4500
    );
  }, []);

  // Estado editable para descuentos
  const [customDiscounts, setCustomDiscounts] = useState<
    Record<number, number>
  >({});

  // Estado para abono de plan
  const [planAbonoAgregado, setPlanAbonoAgregado] = useState<number>(0);
  const [planAbonoInput, setPlanAbonoInput] = useState<string>("");
  
  // Estado para mostrar modal de éxito de pago y permitir imprimir/descargar
  const [successModalData, setSuccessModalData] = useState<{ amount: number; metodo: string; obs: string } | null>(null);


  // Cálculos de Tratamientos de Catálogo
  const tratamientosLista = consulta?.tratamientos || [];

  // Parse conceptos libres desde consulta.tratamiento
  const conceptosLibres = React.useMemo(() => {
    const text = consulta?.tratamiento || "";
    const result: { nombre: string; precio: number; descuento: number }[] = [];
    const libreMatch = text.match(/Conceptos libres:\n([\s\S]*?)(?:\n(?=Planes activos:)|$)/);
    if (libreMatch) {
      const lines = libreMatch[1].split("\n");
      for (const line of lines) {
        const m = line.match(/^(.+?)\s*[—–-]\s*L\.?\s*([\d,]+(?:\.\d{2})?)(?:\s*\[desc:(\d+)%\])?$/);
        if (m) {
          result.push({
            nombre: m[1].trim(),
            precio: parseFloat(m[2].replace(/,/g, "")),
            descuento: m[3] ? parseInt(m[3], 10) : 0,
          });
        }
      }
    }
    return result;
  }, [consulta?.tratamiento]);

  // Descuentos individuales para conceptos libres
  const [conceptoDiscounts, setConceptoDiscounts] = useState<Record<number, number>>({});

  // Inicializar conceptoDiscounts desde los descuentos persistidos
  useEffect(() => {
    const initial: Record<number, number> = {};
    for (let i = 0; i < conceptosLibres.length; i++) {
      if (conceptosLibres[i].descuento > 0) initial[i] = conceptosLibres[i].descuento;
    }
    setConceptoDiscounts((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      return initial;
    });
  }, [conceptosLibres]);

  const catalogCount = tratamientosLista.length;
  const subtotalBrutoCatalogo = tratamientosLista.reduce(
    (acc, t) => acc + (Number(t.precio) || Number(t.tratamiento?.precio) || 0),
    0
  );

  const totalDescuentoCatalogo = tratamientosLista.reduce((acc, t, idx) => {
    const p = Number(t.precio) || Number(t.tratamiento?.precio) || 0;
    const d =
      customDiscounts[idx] !== undefined
        ? customDiscounts[idx]
        : Number(t.descuento) || 0;
    return acc + p * (d / 100);
  }, 0);

  const totalConceptosBruto = conceptosLibres.reduce((acc, c) => acc + c.precio, 0);

  const totalDescuentoConceptos = conceptosLibres.reduce((acc, c, idx) => {
    const d = conceptoDiscounts[idx] ?? 0;
    return acc + c.precio * (d / 100);
  }, 0);

  const subtotalBruto = subtotalBrutoCatalogo + totalConceptosBruto;
  const totalDescuento = totalDescuentoCatalogo + totalDescuentoConceptos;
  const totalNeto = subtotalBruto - totalDescuento;

  // Historial de Pagos
  const pagosAnterioresPaciente = consulta.pagos || [];
  const pagosAnterioresConsulta = consulta.pagosConsulta || [];

  const historicoPlanAbonos = pagosAnterioresConsulta.reduce(
    (acc, p) => acc + Number(p.monto),
    0
  );

  const totalAPagar =
    tipo === "plan" ? planAbonoAgregado : totalNeto + planAbonoAgregado;

  const todosLosPagos = [
    ...pagosAnterioresPaciente.map((p) => {
      // Prisma @db.Date fields return UTC midnight (T00:00:00.000Z), which causes browsers in negative timezones
      // (like Honduras -6) to shift the date to the day before. We fix this by shifting the time to noon UTC.
      let safeDate = p.fecha;
      if (typeof safeDate === "string" && safeDate.endsWith("T00:00:00.000Z")) {
        safeDate = safeDate.replace("T00:00:00.000Z", "T12:00:00.000Z");
      }
      return {
        id: `p-${p.id_pago}`,
        fecha: safeDate,
        monto: Number(p.abono),
        metodo: p.metodo_pago,
        obs: p.observacion,
        tipo: "pago-paciente",
        raw: p,
      };
    }),
    ...pagosAnterioresConsulta.map((p) => ({
      id: `c-${p.id}`,
      fecha: p.fecha,
      monto: Number(p.monto),
      metodo: p.metodoPago,
      obs: p.observacion,
      tipo: "pago-consulta",
      raw: p,
    })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());


  const montoPagadoTratamientos = todosLosPagos
    .filter((p) => p.tipo === "pago-paciente")
    .reduce((acc, p) => acc + p.monto, 0);
  const montoPagadoPlan = historicoPlanAbonos;
  const consultaSaldoPendiente = Math.max(
    0,
    totalNeto - montoPagadoTratamientos
  );
  const saldoPendiente =
    tipo === "plan"
      ? planAbonoAgregado
      : consultaSaldoPendiente + planAbonoAgregado;

  // Plan de Tratamiento
  const plan = consulta.tratamientoPaciente;
  const planCostoTotal = plan ? Number(plan.costoTotal) : 0;
  const planAbonos = plan?.abonos || [];
  const planTotalPagado = planAbonos.reduce(
    (acc, a) => acc + Number(a.montoAbonado),
    0
  );
  const planSaldoPendiente = Math.max(0, planCostoTotal - planTotalPagado);

  const handleApplyCustomDiscount = (index: number, val: number) => {
    setCustomDiscounts((prev) => ({ ...prev, [index]: val }));
  };

  const handleAddPlanAbono = () => {
    const val = Number(planAbonoInput);
    if (val > 0 && val <= planSaldoPendiente) {
      setPlanAbonoAgregado(val);
      setPlanAbonoInput("");
    }
  };

  const calculateChange = () => {
    if (paymentMethod === "Efectivo" && cashReceived > saldoPendiente) {
      return cashReceived - saldoPendiente;
    }
    return 0;
  };

  const handleProcessPayment = async () => {
    let montoTotal = saldoPendiente;
    if (
      paymentMethod === "Efectivo" &&
      cashReceived > 0 &&
      cashReceived < saldoPendiente
    ) {
      montoTotal = cashReceived;
    } else if (
      paymentMethod === "Tarjeta" ||
      paymentMethod === "Transferencia"
    ) {
      montoTotal = montoParcial !== "" ? Number(montoParcial) : saldoPendiente;
    }

    // Evitar errores de validación de decimales en backend
    montoTotal = Math.round(montoTotal * 100) / 100;

    if (montoTotal <= 0) return;
    if (montoTotal > saldoPendiente + 0.01) {
      addToast(
        "error",
        "El monto a pagar no puede superar el saldo pendiente."
      );
      return;
    }
    if (montoTotal < planAbonoAgregado - 0.01) {
      addToast(
        "error",
        "El monto a pagar debe cubrir al menos el abono al plan que agregaste (" +
          formatNumber(planAbonoAgregado) +
          ")."
      );
      return;
    }

    setLoading(true);
    try {
      let observacion = `Pago procesado vía ${paymentMethod}`;
      if (paymentMethod === "Tarjeta") observacion += ` POS: ${posSystem}`;
      if (paymentMethod === "Transferencia")
        observacion += ` Cta: ${bankAccount}`;

      const amountForPlan = planAbonoAgregado;
      const amountForConsultation = montoTotal - amountForPlan;

      let remainingEfectivo = paymentMethod === "Efectivo" ? montoTotal : 0;
      let remainingTarjeta = paymentMethod === "Tarjeta" ? montoTotal : 0;
      let remainingTransf = paymentMethod === "Transferencia" ? montoTotal : 0;

      const debts = [];
      if (amountForPlan > 0)
        debts.push({ type: "plan", amount: amountForPlan });
      if (amountForConsultation > 0)
        debts.push({ type: "consulta", amount: amountForConsultation });

      for (const debt of debts) {
        let debtRemaining = debt.amount;

        const payWith = async (
          method: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA",
          amt: number
        ) => {
          if (debt.type === "plan") {
            await billingService.createPagoConsulta({
              consultaId: consulta.id_consulta,
              monto: amt,
              metodoPago: method,
              observacion: observacion + " (Abono a Plan)",
              abonos: [
                {
                  tratamientoPacienteId: plan!.id,
                  montoAbonado: amt,
                },
              ],
            });
          } else {
            await billingService.create({
              id_consulta: consulta.id_consulta,
              fecha: new Date().toISOString(),
              abono: amt,
              metodoPago:
                method === "EFECTIVO"
                  ? "Efectivo"
                  : method === "TARJETA"
                  ? "Tarjeta"
                  : "Transferencia",
              cuentaDestino:
                method === "TARJETA"
                  ? posSystem
                  : method === "TRANSFERENCIA"
                  ? bankAccount
                  : undefined,
              observacion:
                observacion +
                (plan && amountForPlan > 0 ? " (Cobro Consulta)" : ""),
            });
          }
        };

        if (remainingEfectivo > 0 && debtRemaining > 0) {
          const payAmt = Math.round(Math.min(debtRemaining, remainingEfectivo) * 100) / 100;
          await payWith("EFECTIVO", payAmt);
          debtRemaining -= payAmt;
          remainingEfectivo -= payAmt;
        }
        if (remainingTarjeta > 0 && debtRemaining > 0) {
          const payAmt = Math.round(Math.min(debtRemaining, remainingTarjeta) * 100) / 100;
          await payWith("TARJETA", payAmt);
          debtRemaining -= payAmt;
          remainingTarjeta -= payAmt;
        }
        if (remainingTransf > 0 && debtRemaining > 0) {
          const payAmt = Math.round(Math.min(debtRemaining, remainingTransf) * 100) / 100;
          await payWith("TRANSFERENCIA", payAmt);
          debtRemaining -= payAmt;
          remainingTransf -= payAmt;
        }
      }

      setSuccessModalData({
        amount: montoTotal,
        metodo: paymentMethod,
        obs: observacion,
      });
      setPlanAbonoAgregado(0);
      onPaymentSuccess();

      // Optional: show success toast
    } catch (error: any) {
      console.error("Error processing payment:", error);
      addToast(
        "error",
        error.message || "Ocurrió un error al procesar el pago."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
      <Toast
        toasts={toasts}
        remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />

      {successModalData && (
        <Modal
          open={!!successModalData}
          onClose={() => setSuccessModalData(null)}
          title="Pago Procesado con Éxito"
          icon={<CheckCircle size={18} style={{ color: "#1D9E75" }} />}
          maxWidth={460}
        >
          <div
            style={{
              padding: "12px 16px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1D9E75",
                marginBottom: 8,
              }}
            >
              <CheckCircle size={32} />
            </div>

            <div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 600, color: "#203F49" }}>
                ¡Transacción Completada!
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: "#5F656A" }}>
                Se ha registrado exitosamente el abono de{" "}
                <strong style={{ color: "#1D9E75" }}>
                  L {formatNumber(successModalData.amount)}
                </strong>{" "}
                mediante <strong>{successModalData.metodo}</strong>.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                gap: 10,
                marginTop: 12,
              }}
            >
              <Button
                variant="primary"
                onClick={() => {
                  const paymentMock = {
                    id: "NUEVO",
                    abono: successModalData.amount,
                    metodo_pago: successModalData.metodo,
                    observacion: successModalData.obs,
                    fecha: new Date().toISOString(),
                  };
                  printPaymentReceipt(consulta, paymentMock);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "#0BC5DF",
                  borderColor: "#0BC5DF",
                  color: "#fff",
                  padding: "12px 0",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Printer size={16} /> Imprimir Recibo de Pago
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  printInvoice(consulta, tipo || "consulta", customDiscounts, conceptoDiscounts, planAbonoAgregado);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  borderColor: "#cbd5e1",
                  color: "#475569",
                  padding: "12px 0",
                  fontWeight: 600,
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <FileText size={16} /> Imprimir Factura Completa
              </Button>

              <button
                type="button"
                onClick={() => setSuccessModalData(null)}
                style={{
                  marginTop: 8,
                  background: "none",
                  border: "none",
                  color: "#888F94",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                Cerrar y Continuar
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginBottom: 8,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <button
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
              fontSize: 14,
              fontWeight: 500,
              padding: 0,
            }}
          >
            <ArrowLeft size={18} /> Volver a facturas
          </button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => printInvoice(consulta, tipo || "consulta", customDiscounts, conceptoDiscounts, planAbonoAgregado)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderColor: "#0BC5DF",
              color: "#0BC5DF",
              background: "#fff",
              fontWeight: 600,
            }}
          >
            <Printer size={14} /> Imprimir Factura
          </Button>
        </div>


        {/* HEADER PACIENTE Y DOCTOR */}
        <Card
          style={{
            padding: isMobile ? 16 : 24,
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 16 : 32,
            flexWrap: "wrap",
            background: "#fff",
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              Paciente
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>
              {consulta.persona
                ? `${
                    (consulta.persona as any).primer_nombre ||
                    (consulta.persona as any).nombre ||
                    ""
                  } ${
                    (consulta.persona as any).primer_apellido ||
                    (consulta.persona as any).apellido ||
                    ""
                  }`.trim() || "Desconocido"
                : "Desconocido"}
            </div>
            {(consulta.persona as any)?.numero_identidad && (
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                ID: {(consulta.persona as any).numero_identidad}
              </div>
            )}
          </div>
          {!isMobile && <div style={{ width: 1, background: "#e2e8f0" }}></div>}
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              Dentista Asignado
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>
              {consulta.doctor
                ? (consulta.doctor as any).persona
                  ? `${(consulta.doctor as any).persona.primer_nombre || ""} ${
                      (consulta.doctor as any).persona.primer_apellido || ""
                    }`.trim()
                  : (consulta.doctor as any).nombre ||
                    (consulta.doctor as any).username ||
                    "N/A"
                : "N/A"}
            </div>
          </div>
          {!isMobile && <div style={{ width: 1, background: "#e2e8f0" }}></div>}
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              Fecha de Consulta
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>
              {new Date(consulta.fecha_inicio).toLocaleDateString("es-HN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </Card>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 20,
          }}
        >
          {/* COLUMNA IZQUIERDA: Resúmenes e Historial */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {tipo !== "plan" && (
              <Card
                style={{
                  padding: 24,
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#1e293b",
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: 12,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Activity size={18} color="#0ea5e9" /> Desglose de
                  Tratamientos de Consulta
                </div>

                {tratamientosLista.length === 0 && conceptosLibres.length === 0 && planAbonoAgregado === 0 ? (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#94a3b8",
                      fontStyle: "italic",
                    }}
                  >
                    No hay elementos a cobrar registrados en esta consulta.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {tratamientosLista.map((t, idx) => {
                      const p =
                        Number(t.precio) || Number(t.tratamiento?.precio) || 0;
                      const d =
                        customDiscounts[idx] !== undefined
                          ? customDiscounts[idx]
                          : Number(t.descuento) || 0;
                      const descAmount = p * (d / 100);
                      const st = p - descAmount;
                      return (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 13,
                            color: "#475569",
                            borderBottom: "1px solid #f8fafc",
                            paddingBottom: 8,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 500, color: "#334155" }}>
                              {t.tratamiento?.nombre ||
                                "Tratamiento sin nombre"}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#94a3b8",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 4,
                              }}
                            >
                              <span>Precio base: L {formatNumber(p)}</span>
                              <span>•</span>
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                Desc:
                                {descuentosCerrados ||
                                montoPagadoTratamientos > 0 ? (
                                  <span style={{ fontWeight: 600 }}>{d}%</span>
                                ) : (
                                  <>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={d}
                                      onChange={(e) =>
                                        handleApplyCustomDiscount(
                                          idx,
                                          Number(e.target.value)
                                        )
                                      }
                                      style={{
                                        width: 45,
                                        padding: "2px 4px",
                                        fontSize: 11,
                                        border: "1px solid #cbd5e1",
                                        borderRadius: 4,
                                        outline: "none",
                                        textAlign: "right",
                                      }}
                                    />
                                    %
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontWeight: 600 }}>
                            L {formatNumber(st)}
                          </div>
                        </div>
                      );
                    })}

                    {conceptosLibres.length > 0 && (
                      <>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#92400e",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            marginTop: 12,
                            marginBottom: 6,
                          }}
                        >
                          Conceptos Libres
                        </div>
                        {conceptosLibres.map((c, idx) => {
                          const d = conceptoDiscounts[idx] ?? 0;
                          const descAmount = c.precio * (d / 100);
                          const st = c.precio - descAmount;
                          return (
                            <div
                              key={`cl-${idx}`}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: 13,
                                color: "#475569",
                                borderBottom: "1px solid #f8fafc",
                                paddingBottom: 8,
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 500, color: "#92400e" }}>
                                  {c.nombre}
                                </div>
                                <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                  <span>Precio base: L {formatNumber(c.precio)}</span>
                                  <span>•</span>
                                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    Desc:
                                    {descuentosCerrados || montoPagadoTratamientos > 0 ? (
                                      <span style={{ fontWeight: 600 }}>{d}%</span>
                                    ) : (
                                      <>
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={d}
                                          onChange={(e) =>
                                            setConceptoDiscounts((prev) => ({
                                              ...prev,
                                              [idx]: Number(e.target.value),
                                            }))
                                          }
                                          style={{
                                            width: 45,
                                            padding: "2px 4px",
                                            fontSize: 11,
                                            border: "1px solid #cbd5e1",
                                            borderRadius: 4,
                                            outline: "none",
                                            textAlign: "right",
                                          }}
                                        />%
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div style={{ fontWeight: 600 }}>
                                L {formatNumber(st)}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {(tratamientosLista.length > 0 || conceptosLibres.length > 0) && montoPagadoTratamientos === 0 && (
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        {!descuentosCerrados ? (
                          <Button
                            variant="outline"
                            onClick={async () => {
                              setSavingDiscounts(true);
                              try {
                                const catPayload = tratamientosLista.map(
                                  (t: any, idx: number) => ({
                                    id_consulta_tratamiento:
                                      t.id_consulta_tratamiento,
                                    descuento:
                                      customDiscounts[idx] !== undefined
                                        ? customDiscounts[idx]
                                        : Number(t.descuento) || 0,
                                  })
                                );
                                const concPayload = conceptosLibres.map((_, idx) => ({
                                  idx,
                                  descuento: conceptoDiscounts[idx] ?? 0,
                                }));
                                await billingService.updateConsultaDescuentos(
                                  consulta.id_consulta,
                                  catPayload,
                                  concPayload
                                );
                                setDescuentosCerrados(true);
                                addToast(
                                  "success",
                                  "Descuentos guardados exitosamente."
                                );
                              } catch (err: any) {
                                console.error(err);
                                addToast(
                                  "error",
                                  err.message ||
                                    "Error al guardar descuentos."
                                );
                              } finally {
                                setSavingDiscounts(false);
                              }
                            }}
                            disabled={savingDiscounts}
                            style={{
                              fontSize: 12,
                              padding: "6px 12px",
                              background: "#f1f5f9",
                              borderColor: "#cbd5e1",
                              color: "#475569",
                            }}
                          >
                            {savingDiscounts
                              ? "Guardando..."
                              : "Cerrar y Guardar Descuentos"}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setDescuentosCerrados(false)}
                            style={{
                              fontSize: 12,
                              padding: "6px 12px",
                              background: "#fff",
                              borderColor: "#cbd5e1",
                              color: "#475569",
                            }}
                          >
                            Editar Descuentos
                          </Button>
                        )}
                      </div>
                    )}

                    {plan && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 13,
                            color: "#8b5cf6",
                            borderBottom: "1px solid #f8fafc",
                            paddingBottom: 8,
                            borderTop: `1px dashed #cbd5e1`,
                            paddingTop: 8,
                            marginTop: 8,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: "#7c3aed" }}>
                              {plan.nombre} (Plan de Tratamiento)
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#a78bfa",
                                marginTop: 4,
                              }}
                            >
                              Costo total del plan
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, color: "#7c3aed" }}>
                            L {formatNumber(planCostoTotal)}
                          </div>
                        </div>
                        {planAbonoAgregado > 0 && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: 13,
                              color: "#10b981",
                              borderBottom: "1px solid #f8fafc",
                              paddingBottom: 8,
                            }}
                          >
                            <div>
                              <div
                                style={{ fontWeight: 600, color: "#059669" }}
                              >
                                Abono a Plan hoy
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: "#34d399",
                                  marginTop: 4,
                                }}
                              >
                                Aplicado a cuenta principal del plan
                              </div>
                            </div>
                            <div style={{ fontWeight: 700 }}>
                              + L {formatNumber(planAbonoAgregado)}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 12,
                        borderTop: "1px dashed #cbd5e1",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 13,
                          color: "#64748b",
                        }}
                      >
                        <span>Subtotal de Tratamientos</span>
                        <span>L {formatNumber(subtotalBruto)}</span>
                      </div>
                      {totalDescuento > 0 && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 13,
                            color: "#ef4444",
                          }}
                        >
                          <span>Descuento Total</span>
                          <span>- L {formatNumber(totalDescuento)}</span>
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#0f172a",
                          marginTop: 4,
                        }}
                      >
                        <span>Total de este Desglose</span>
                        <span>
                          L {formatNumber(totalNeto + planAbonoAgregado)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {plan && (
              <Card
                style={{
                  padding: 24,
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#1e293b",
                    borderBottom: "1px solid #e2e8f0",
                    paddingBottom: 12,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FileText size={18} color="#8b5cf6" /> Plan de Tratamiento
                  Vinculado
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Nombre del Plan
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#1e293b",
                      }}
                    >
                      {plan.nombre}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
                      gap: 12,
                      background: "#f8fafc",
                      padding: 12,
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginBottom: 2,
                        }}
                      >
                        Costo Total
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#334155",
                        }}
                      >
                        L {formatNumber(planCostoTotal)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginBottom: 2,
                        }}
                      >
                        Total Pagado
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#10b981",
                        }}
                      >
                        L {formatNumber(planTotalPagado)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginBottom: 2,
                        }}
                      >
                        Saldo Pendiente
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#f59e0b",
                        }}
                      >
                        L {formatNumber(planSaldoPendiente)}
                      </div>
                    </div>
                  </div>

                  {planSaldoPendiente > 0 && !inactivo && (
                    <div
                      style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16 }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "#475569",
                          fontWeight: 500,
                          marginBottom: 8,
                        }}
                      >
                        Abonar a este plan hoy:
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ position: "relative", flex: 1 }}>
                          <span
                            style={{
                              position: "absolute",
                              left: 10,
                              top: 8,
                              fontSize: 13,
                              color: "#64748b",
                            }}
                          >
                            L
                          </span>
                          <input
                            type="number"
                            value={planAbonoInput}
                            onChange={(e) => setPlanAbonoInput(e.target.value)}
                            placeholder="Monto a abonar"
                            style={{
                              width: "100%",
                              padding: "8px 10px 8px 24px",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              outline: "none",
                              fontSize: 13,
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                        <Button
                          variant="primary"
                          onClick={handleAddPlanAbono}
                          style={{ padding: "8px 16px", fontSize: 13 }}
                        >
                          Agregar a Cobro
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Card
              style={{
                padding: 24,
                borderRadius: 14,
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#1e293b",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: 12,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <History size={18} color="#64748b" /> Historial de Pagos (Esta
                consulta)
              </div>

              {todosLosPagos.length === 0 ? (
                <div
                  style={{
                    fontSize: 13,
                    color: "#94a3b8",
                    fontStyle: "italic",
                  }}
                >
                  No se han registrado pagos para esta consulta.
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {todosLosPagos.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        background: "#f8fafc",
                        borderRadius: 8,
                        border: "1px solid #f1f5f9",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#334155",
                          }}
                        >
                          {new Date(p.fecha).toLocaleDateString("es-HN")} •{" "}
                          {p.metodo}
                        </div>
                        {p.obs && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "#94a3b8",
                              marginTop: 2,
                            }}
                          >
                            {p.obs}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#10b981",
                          }}
                        >
                          + L {formatNumber(p.monto)}
                        </span>
                        <button
                          type="button"
                          onClick={() => printPaymentReceipt(consulta, p.raw)}
                          title="Imprimir comprobante"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#0BC5DF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 6,
                            borderRadius: 6,
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e6f8fb";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                          }}
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </div>

                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* COLUMNA DERECHA: Procesar Pago */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card
              style={{
                padding: isMobile ? 16 : 24,
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                position: isMobile ? "static" : "sticky",
                top: 20,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#1e293b",
                  borderBottom: "1px solid #e2e8f0",
                  paddingBottom: 12,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <DollarSign size={18} color="#10b981" /> Procesar Pago de
                Consulta
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    fontSize: 14,
                    color: "#475569",
                  }}
                >
                  <span>Total</span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>
                    L {formatNumber(totalAPagar)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    fontSize: 13,
                    color: "#10b981",
                  }}
                >
                  <span>Abonado a Tratamientos</span>
                  <span>L {formatNumber(montoPagadoTratamientos)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    fontSize: 13,
                    color: "#10b981",
                  }}
                >
                  <span>Abonado a Plan</span>
                  <span>L {formatNumber(montoPagadoPlan)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  <span>Saldo Pendiente a Pagar</span>
                  <span
                    style={{
                      color: saldoPendiente > 0 ? "#ef4444" : "#10b981",
                    }}
                  >
                    L {formatNumber(saldoPendiente)}
                  </span>
                </div>
              </div>

              {inactivo ? (
                <div
                  style={{
                    background: "#F2F4F7",
                    color: "#475467",
                    padding: "16px",
                    borderRadius: 8,
                    textAlign: "center",
                    border: "1px solid #D0D5DD",
                  }}
                >
                  <div
                    style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}
                  >
                    Plan{" "}
                    {tipo === "plan" ? "Desactivado / Cancelado" : "Inactivo"}
                  </div>
                  <div style={{ fontSize: 13 }}>
                    No se pueden realizar pagos en este plan. Solo puedes
                    consultar el historial.
                  </div>
                </div>
              ) : saldoPendiente > 0 ? (
                <>
                  <h4
                    style={{
                      fontSize: 14,
                      color: "#334155",
                      margin: "0 0 12px 0",
                    }}
                  >
                    Método de Pago
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    <button
                      onClick={() => setPaymentMethod("Tarjeta")}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        padding: "12px 8px",
                        borderRadius: 8,
                        border: "1px solid",
                        borderColor:
                          paymentMethod === "Tarjeta" ? "#0ea5e9" : "#e2e8f0",
                        background:
                          paymentMethod === "Tarjeta" ? "#f0f9ff" : "#fff",
                        color:
                          paymentMethod === "Tarjeta" ? "#0369a1" : "#64748b",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <CreditCard size={18} />
                      <span style={{ fontSize: 10, fontWeight: 500 }}>
                        Tarjeta
                      </span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("Transferencia")}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        padding: "12px 8px",
                        borderRadius: 8,
                        border: "1px solid",
                        borderColor:
                          paymentMethod === "Transferencia"
                            ? "#0ea5e9"
                            : "#e2e8f0",
                        background:
                          paymentMethod === "Transferencia"
                            ? "#f0f9ff"
                            : "#fff",
                        color:
                          paymentMethod === "Transferencia"
                            ? "#0369a1"
                            : "#64748b",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <Landmark size={18} />
                      <span style={{ fontSize: 10, fontWeight: 500 }}>
                        Transf.
                      </span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("Efectivo")}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        padding: "12px 8px",
                        borderRadius: 8,
                        border: "1px solid",
                        borderColor:
                          paymentMethod === "Efectivo" ? "#0ea5e9" : "#e2e8f0",
                        background:
                          paymentMethod === "Efectivo" ? "#f0f9ff" : "#fff",
                        color:
                          paymentMethod === "Efectivo" ? "#0369a1" : "#64748b",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <Banknote size={18} />
                      <span style={{ fontSize: 10, fontWeight: 500 }}>
                        Efectivo
                      </span>
                    </button>
                  </div>

                  {/* Opciones específicas según el método */}
                  {paymentMethod === "Tarjeta" && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ marginBottom: 12 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            color: "#64748b",
                            marginBottom: 6,
                          }}
                        >
                          Seleccione POS
                        </label>
                        <select
                          value={posSystem}
                          onChange={(e) => setPosSystem(e.target.value as any)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #cbd5e1",
                            borderRadius: 8,
                            fontSize: 13,
                            outline: "none",
                          }}
                        >
                          <option value="BAC">POS BAC Credomatic</option>
                          <option value="Ficohsa">POS Ficohsa</option>
                          <option value="Banpaís">POS Banpaís</option>
                        </select>
                      </div>
                      {paymentMethod === "Tarjeta" && (
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: 12,
                              color: "#64748b",
                              marginBottom: 6,
                            }}
                          >
                            Monto a Cobrar a la Tarjeta
                          </label>
                          <div style={{ position: "relative" }}>
                            <span
                              style={{
                                position: "absolute",
                                left: 12,
                                top: 10,
                                fontSize: 14,
                                color: "#64748b",
                              }}
                            >
                              L
                            </span>
                            <input
                              type="number"
                              value={montoParcial || ""}
                              onChange={(e) => setMontoParcial(e.target.value)}
                              placeholder={formatNumber(saldoPendiente)}
                              style={{
                                width: "100%",
                                padding: "10px 12px 10px 28px",
                                border: "1px solid #cbd5e1",
                                borderRadius: 8,
                                fontSize: 13,
                                outline: "none",
                                boxSizing: "border-box",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === "Transferencia" && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ marginBottom: 12 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: 12,
                            color: "#64748b",
                            marginBottom: 6,
                          }}
                        >
                          Cuenta Bancaria Destino
                        </label>
                        <select
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #cbd5e1",
                            borderRadius: 8,
                            fontSize: 13,
                            outline: "none",
                          }}
                        >
                          <option value="BAC - Cuenta Principal">
                            BAC - Cuenta Principal
                          </option>
                          <option value="Ficohsa - Cuenta Clínica">
                            Ficohsa - Cuenta Clínica
                          </option>
                          <option value="Banpaís - Cuenta Secundaria">
                            Banpaís - Cuenta Secundaria
                          </option>
                        </select>
                      </div>
                      {paymentMethod === "Transferencia" && (
                        <div>
                          <label
                            style={{
                              display: "block",
                              fontSize: 12,
                              color: "#64748b",
                              marginBottom: 6,
                            }}
                          >
                            Monto de la Transferencia
                          </label>
                          <div style={{ position: "relative" }}>
                            <span
                              style={{
                                position: "absolute",
                                left: 12,
                                top: 10,
                                fontSize: 14,
                                color: "#64748b",
                              }}
                            >
                              L
                            </span>
                            <input
                              type="number"
                              value={montoParcial || ""}
                              onChange={(e) => setMontoParcial(e.target.value)}
                              placeholder={formatNumber(saldoPendiente)}
                              style={{
                                width: "100%",
                                padding: "10px 12px 10px 28px",
                                border: "1px solid #cbd5e1",
                                borderRadius: 8,
                                fontSize: 13,
                                outline: "none",
                                boxSizing: "border-box",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === "Efectivo" && (
                    <div style={{ marginBottom: 24 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: 12,
                          color: "#64748b",
                          marginBottom: 6,
                        }}
                      >
                        Efectivo Entregado (para calcular cambio)
                      </label>
                      <div style={{ position: "relative" }}>
                        <span
                          style={{
                            position: "absolute",
                            left: 12,
                            top: 10,
                            fontSize: 14,
                            color: "#64748b",
                          }}
                        >
                          L
                        </span>
                        <input
                          type="number"
                          value={cashReceived || ""}
                          onChange={(e) =>
                            setCashReceived(Number(e.target.value))
                          }
                          placeholder={formatNumber(saldoPendiente)}
                          style={{
                            width: "100%",
                            padding: "10px 12px 10px 28px",
                            border: "1px solid #cbd5e1",
                            borderRadius: 8,
                            fontSize: 14,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      {cashReceived > saldoPendiente && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 12,
                            padding: "8px 12px",
                            background: "#f8fafc",
                            borderRadius: 6,
                          }}
                        >
                          <span style={{ fontSize: 13, color: "#64748b" }}>
                            Cambio a Devolver:
                          </span>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "#10b981",
                            }}
                          >
                            L {formatNumber(cashReceived - saldoPendiente)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    onClick={handleProcessPayment}
                    disabled={loading}
                    style={{
                      width: "100%",
                      background: "#0ea5e9",
                      borderColor: "#0ea5e9",
                      color: "#fff",
                      display: "flex",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 0",
                    }}
                  >
                    <Receipt size={16} />
                    {loading
                      ? "Procesando..."
                      : `Pagar L ${formatNumber(paymentMethod === "Efectivo" &&
                        cashReceived > 0 &&
                        cashReceived < saldoPendiente
                          ? cashReceived
                          : montoParcial !== ""
                          ? Number(montoParcial)
                          : saldoPendiente
                        )}`}
                  </Button>
                </>
              ) : (
                <div
                  style={{
                    background: "#ecfdf5",
                    color: "#065f46",
                    padding: "16px",
                    borderRadius: 8,
                    textAlign: "center",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  <div
                    style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}
                  >
                    Consulta Pagada
                  </div>
                  <div style={{ fontSize: 13 }}>
                    No hay saldo pendiente por cobrar en esta consulta.
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => printInvoice(consulta, tipo || "consulta", customDiscounts, conceptoDiscounts, planAbonoAgregado)}
                    style={{
                      marginTop: 12,
                      width: "100%",
                      borderColor: "#10b981",
                      color: "#10b981",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Printer size={16} /> Imprimir / Descargar Factura
                  </Button>

                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};
