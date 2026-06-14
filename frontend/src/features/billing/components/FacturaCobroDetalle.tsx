import React, { useState, useCallback } from "react";
import { ArrowLeft, CreditCard, Banknote, Landmark, Receipt, FileText, Activity, DollarSign, History, CheckCircle, AlertCircle } from "lucide-react";
import { Card, Button } from "../../../context";
import { Consultation } from "../../consultations/types";
import { billingService } from "../services/billingService";

interface FacturaCobroDetalleProps {
  consulta: Consultation;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

interface ToastMsg {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const C = {
  primary: 'var(--arco-primary, #0BC5DF)',
  navy: 'var(--arco-navy, #203F49)',
  success: 'var(--arco-success, #1D9E75)',
  warning: 'var(--arco-warning, #EF9F27)',
  danger: 'var(--arco-danger, #E24B4A)',
  gray500: 'var(--arco-gray-500, #888F94)',
  white: '#ffffff',
};

function uid() { return Math.random().toString(36).slice(2); }

function Toast({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
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
              pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 10,
              background: C.white, border: `1.5px solid ${colors.bg}`,
              borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              minWidth: 280, maxWidth: 380, animation: 'slideIn 0.2s ease',
            }}
          >
            <span style={{ color: colors.bg, flexShrink: 0 }}>{colors.icon}</span>
            <span style={{ flex: 1, fontSize: 13, color: C.navy }}>{t.message}</span>
            <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray500, display: 'flex' }}>
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
  onBack,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<"Tarjeta" | "Efectivo" | "Transferencia">("Efectivo");
  const [posSystem, setPosSystem] = useState<"BAC" | "Ficohsa" | "Banpaís">("BAC");
  const [bankAccount, setBankAccount] = useState("BAC - Cuenta Principal");
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [montoParcial, setMontoParcial] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [savingDiscounts, setSavingDiscounts] = useState(false);
  const [descuentosCerrados, setDescuentosCerrados] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const addToast = useCallback((type: ToastMsg['type'], message: string) => {
    const id = uid();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  // Estado editable para descuentos
  const [customDiscounts, setCustomDiscounts] = useState<Record<number, number>>({});
  
  // Estado para abono de plan
  const [planAbonoAgregado, setPlanAbonoAgregado] = useState<number>(0);
  const [planAbonoInput, setPlanAbonoInput] = useState<string>("");

  // Cálculos de Tratamientos de Catálogo
  const tratamientosLista = consulta?.tratamientos || [];
  
  const subtotalBruto = tratamientosLista.reduce((acc, t) => acc + (Number(t.precio) || Number(t.tratamiento?.precio) || 0), 0);
  
  const totalDescuento = tratamientosLista.reduce((acc, t, idx) => {
    const p = Number(t.precio) || Number(t.tratamiento?.precio) || 0;
    const discountPercentage = customDiscounts[idx] !== undefined ? customDiscounts[idx] : (Number(t.descuento) || 0);
    return acc + (p * (discountPercentage / 100));
  }, 0);
  
  const subtotalNeto = subtotalBruto - totalDescuento;
  const isvRate = 0.15; // 15% tax
  const montoIsv = subtotalNeto * isvRate;
  
  // Historial de Pagos
  const pagosAnterioresPaciente = consulta.pagos || [];
  const pagosAnterioresConsulta = consulta.pagosConsulta || [];

  const historicoPlanAbonos = pagosAnterioresConsulta.reduce((acc, p) => acc + Number(p.monto), 0);

  // Total incluye el subtotal con ISV + abonos de plan previos + El abono al plan nuevo
  const totalAPagar = subtotalNeto + montoIsv + historicoPlanAbonos + planAbonoAgregado;


  
  const todosLosPagos = [
    ...pagosAnterioresPaciente.map(p => ({
      id: `p-${p.id_pago}`,
      fecha: p.fecha,
      monto: Number(p.abono),
      metodo: p.metodo_pago,
      obs: p.observacion,
      tipo: "pago-paciente"
    })),
    ...pagosAnterioresConsulta.map(p => ({
      id: `c-${p.id}`,
      fecha: p.fecha,
      monto: Number(p.monto),
      metodo: p.metodoPago,
      obs: p.observacion,
      tipo: "pago-consulta"
    }))
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const montoPagadoTratamientos = todosLosPagos.filter(p => p.tipo === "pago-paciente").reduce((acc, p) => acc + p.monto, 0);
  const montoPagadoPlan = historicoPlanAbonos;
  const saldoPendiente = Math.max(0, totalAPagar - (montoPagadoTratamientos + montoPagadoPlan));

  // Plan de Tratamiento
  const plan = consulta.tratamientoPaciente;
  const planCostoTotal = plan ? Number(plan.costoTotal) : 0;
  const planAbonos = plan?.abonos || [];
  const planTotalPagado = planAbonos.reduce((acc, a) => acc + Number(a.montoAbonado), 0);
  const planSaldoPendiente = Math.max(0, planCostoTotal - planTotalPagado);

  const handleApplyCustomDiscount = (index: number, val: number) => {
    setCustomDiscounts(prev => ({ ...prev, [index]: val }));
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
    if (paymentMethod === "Efectivo" && cashReceived > 0 && cashReceived < saldoPendiente) {
      montoTotal = cashReceived;
    } else if (paymentMethod === "Tarjeta" || paymentMethod === "Transferencia") {
      montoTotal = montoParcial !== "" ? Number(montoParcial) : saldoPendiente;
    }
    
    // Evitar errores de validación de decimales en backend
    montoTotal = Number(montoTotal.toFixed(2));

    if (montoTotal <= 0) return;
    if (montoTotal > saldoPendiente + 0.01) {
      addToast('error', "El monto a pagar no puede superar el saldo pendiente.");
      return;
    }
    if (montoTotal < planAbonoAgregado - 0.01) {
      addToast('error', "El monto a pagar debe cubrir al menos el abono al plan que agregaste (" + planAbonoAgregado.toFixed(2) + ").");
      return;
    }
    
    setLoading(true);
    try {
      let observacion = `Pago procesado vía ${paymentMethod}`;
      if (paymentMethod === "Tarjeta") observacion += ` POS: ${posSystem}`;
      if (paymentMethod === "Transferencia") observacion += ` Cta: ${bankAccount}`;

      const amountForPlan = planAbonoAgregado;
      const amountForConsultation = montoTotal - amountForPlan;

      let remainingEfectivo = paymentMethod === "Efectivo" ? montoTotal : 0;
      let remainingTarjeta = paymentMethod === "Tarjeta" ? montoTotal : 0;
      let remainingTransf = paymentMethod === "Transferencia" ? montoTotal : 0;

      const debts = [];
      if (amountForPlan > 0) debts.push({ type: 'plan', amount: amountForPlan });
      if (amountForConsultation > 0) debts.push({ type: 'consulta', amount: amountForConsultation });

      for (const debt of debts) {
        let debtRemaining = debt.amount;

        const payWith = async (method: "EFECTIVO" | "TARJETA" | "TRANSFERENCIA", amt: number) => {
          if (debt.type === 'plan') {
            await billingService.createPagoConsulta({
              consultaId: consulta.id_consulta,
              monto: amt,
              metodoPago: method,
              observacion: observacion + " (Abono a Plan)",
              abonos: [{
                tratamientoPacienteId: plan!.id,
                montoAbonado: amt
              }]
            });
          } else {
            await billingService.create({
              id_consulta: consulta.id_consulta,
              fecha: new Date().toISOString(),
              abono: amt,
              metodoPago: method === "EFECTIVO" ? "Efectivo" : method === "TARJETA" ? "Tarjeta" : "Transferencia",
              observacion: observacion + (plan && amountForPlan > 0 ? " (Cobro Consulta)" : ""),
            });
          }
        };

        if (remainingEfectivo > 0 && debtRemaining > 0) {
          const payAmt = Number(Math.min(debtRemaining, remainingEfectivo).toFixed(2));
          await payWith("EFECTIVO", payAmt);
          debtRemaining -= payAmt;
          remainingEfectivo -= payAmt;
        }
        if (remainingTarjeta > 0 && debtRemaining > 0) {
          const payAmt = Number(Math.min(debtRemaining, remainingTarjeta).toFixed(2));
          await payWith("TARJETA", payAmt);
          debtRemaining -= payAmt;
          remainingTarjeta -= payAmt;
        }
        if (remainingTransf > 0 && debtRemaining > 0) {
          const payAmt = Number(Math.min(debtRemaining, remainingTransf).toFixed(2));
          await payWith("TRANSFERENCIA", payAmt);
          debtRemaining -= payAmt;
          remainingTransf -= payAmt;
        }
      }

      onPaymentSuccess();
      // Optional: show success toast
    } catch (error: any) {
      console.error("Error processing payment:", error);
      addToast('error', error.message || "Ocurrió un error al procesar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
      <Toast toasts={toasts} remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
        <button 
        onClick={onBack} 
        style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 14, fontWeight: 500, padding: 0, width: "fit-content", marginBottom: 8 }}
      >
        <ArrowLeft size={18} /> Volver a facturas
      </button>

      {/* HEADER PACIENTE Y DOCTOR */}
      <Card style={{ padding: 24, borderRadius: 14, border: "1px solid #e2e8f0", display: "flex", gap: 32, flexWrap: "wrap", background: "#fff" }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Paciente</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>
            {consulta.persona 
              ? `${(consulta.persona as any).primer_nombre || (consulta.persona as any).nombre || ""} ${(consulta.persona as any).primer_apellido || (consulta.persona as any).apellido || ""}`.trim() || "Desconocido"
              : "Desconocido"}
          </div>
          {(consulta.persona as any)?.numero_identidad && (
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>ID: {(consulta.persona as any).numero_identidad}</div>
          )}
        </div>
        <div style={{ width: 1, background: "#e2e8f0" }}></div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Dentista Asignado</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>
            {consulta.doctor 
              ? ((consulta.doctor as any).persona 
                  ? `${(consulta.doctor as any).persona.primer_nombre || ""} ${(consulta.doctor as any).persona.primer_apellido || ""}`.trim()
                  : (consulta.doctor as any).nombre || (consulta.doctor as any).username || "N/A")
              : "N/A"}
          </div>
        </div>
        <div style={{ width: 1, background: "#e2e8f0" }}></div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Fecha de Consulta</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b" }}>
            {new Date(consulta.fecha_inicio).toLocaleDateString("es-HN", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* COLUMNA IZQUIERDA: Resúmenes e Historial */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          <Card style={{ padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Activity size={18} color="#0ea5e9" /> Desglose de Tratamientos de Consulta
            </div>
            
            {tratamientosLista.length === 0 && planAbonoAgregado === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>No hay elementos a cobrar registrados en esta consulta.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tratamientosLista.map((t, idx) => {
                  const p = Number(t.precio) || Number(t.tratamiento?.precio) || 0;
                  const d = customDiscounts[idx] !== undefined ? customDiscounts[idx] : (Number(t.descuento) || 0);
                  const descAmount = p * (d / 100);
                  const st = p - descAmount;
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#475569", borderBottom: "1px solid #f8fafc", paddingBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 500, color: "#334155" }}>{t.tratamiento?.nombre || "Tratamiento sin nombre"}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <span>Precio base: L {p.toFixed(2)}</span>
                          <span>•</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            Desc: 
                            {(descuentosCerrados || montoPagadoTratamientos > 0) ? (
                              <span style={{ fontWeight: 600 }}>{d}%</span>
                            ) : (
                              <>
                                <input 
                                  type="number" 
                                  min="0" 
                                  max="100" 
                                  value={d} 
                                  onChange={(e) => handleApplyCustomDiscount(idx, Number(e.target.value))}
                                  style={{ width: 45, padding: "2px 4px", fontSize: 11, border: "1px solid #cbd5e1", borderRadius: 4, outline: "none", textAlign: "right" }}
                                />%
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontWeight: 600 }}>L {st.toFixed(2)}</div>
                    </div>
                  );
                })}

                {montoPagadoTratamientos === 0 && tratamientosLista.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    {!descuentosCerrados ? (
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          setSavingDiscounts(true);
                          try {
                            const payload = tratamientosLista.map((t: any, idx: number) => ({
                              id_consulta_tratamiento: t.id_consulta_tratamiento,
                              descuento: customDiscounts[idx] !== undefined ? customDiscounts[idx] : (Number(t.descuento) || 0)
                            }));
                            await billingService.updateConsultaDescuentos(consulta.id_consulta, payload);
                            setDescuentosCerrados(true);
                            addToast('success', "Descuentos guardados exitosamente.");
                          } catch (err: any) {
                            console.error(err);
                            addToast('error', err.message || "Error al guardar descuentos.");
                          } finally {
                            setSavingDiscounts(false);
                          }
                        }}
                        disabled={savingDiscounts}
                        style={{ fontSize: 12, padding: "6px 12px", background: "#f1f5f9", borderColor: "#cbd5e1", color: "#475569" }}
                      >
                        {savingDiscounts ? "Guardando..." : "Cerrar y Guardar Descuentos"}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={() => setDescuentosCerrados(false)}
                        style={{ fontSize: 12, padding: "6px 12px", background: "#fff", borderColor: "#cbd5e1", color: "#475569" }}
                      >
                        Editar Descuentos
                      </Button>
                    )}
                  </div>
                )}

                {planAbonoAgregado > 0 && plan && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#10b981", borderBottom: "1px solid #f8fafc", paddingBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#059669" }}>Abono a Plan: {plan.nombre}</div>
                      <div style={{ fontSize: 11, color: "#34d399", marginTop: 4 }}>Aplicado a cuenta principal del plan</div>
                    </div>
                    <div style={{ fontWeight: 700 }}>+ L {planAbonoAgregado.toFixed(2)}</div>
                  </div>
                )}

                <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px dashed #cbd5e1", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
                    <span>Subtotal de Tratamientos</span>
                    <span>L {subtotalBruto.toFixed(2)}</span>
                  </div>
                  {totalDescuento > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#ef4444" }}>
                      <span>Descuento Total</span>
                      <span>- L {totalDescuento.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
                    <span>ISV (15% s/tratamientos)</span>
                    <span>L {montoIsv.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 600, color: "#0f172a", marginTop: 4 }}>
                    <span>Costo Total a Pagar</span>
                    <span>L {totalAPagar.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {plan && (
            <Card style={{ padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={18} color="#8b5cf6" /> Plan de Tratamiento Vinculado
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Nombre del Plan</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#1e293b" }}>{plan.nombre}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Costo Total</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>L {planCostoTotal.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Total Pagado</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>L {planTotalPagado.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Saldo Pendiente</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>L {planSaldoPendiente.toFixed(2)}</div>
                  </div>
                </div>
                
                {planSaldoPendiente > 0 && (
                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
                    <div style={{ fontSize: 12, color: "#475569", fontWeight: 500, marginBottom: 8 }}>Abonar a este plan hoy:</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ position: "relative", flex: 1 }}>
                        <span style={{ position: "absolute", left: 10, top: 8, fontSize: 13, color: "#64748b" }}>L</span>
                        <input 
                          type="number" 
                          value={planAbonoInput} 
                          onChange={(e) => setPlanAbonoInput(e.target.value)}
                          placeholder="Monto a abonar" 
                          style={{ width: "100%", padding: "8px 10px 8px 24px", borderRadius: 6, border: "1px solid #cbd5e1", outline: "none", fontSize: 13, boxSizing: "border-box" }}
                        />
                      </div>
                      <Button variant="primary" onClick={handleAddPlanAbono} style={{ padding: "8px 16px", fontSize: 13 }}>Agregar a Cobro</Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card style={{ padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: 12, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <History size={18} color="#64748b" /> Historial de Pagos (Esta consulta)
            </div>
            
            {todosLosPagos.length === 0 ? (
              <div style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic" }}>No se han registrado pagos para esta consulta.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {todosLosPagos.map((p) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #f1f5f9" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{new Date(p.fecha).toLocaleDateString("es-HN")} • {p.metodo}</div>
                      {p.obs && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{p.obs}</div>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>+ L {p.monto.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>

        {/* COLUMNA DERECHA: Procesar Pago */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ padding: 24, borderRadius: 14, border: "1px solid #e2e8f0", position: "sticky", top: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <DollarSign size={18} color="#10b981" /> Procesar Pago de Consulta
            </div>

            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "#475569" }}>
                <span>Total</span>
                <span style={{ fontWeight: 600, color: "#1e293b" }}>L {totalAPagar.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#10b981" }}>
                <span>Abonado a Tratamientos</span>
                <span>L {montoPagadoTratamientos.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13, color: "#10b981" }}>
                <span>Abonado a Plan</span>
                <span>L {montoPagadoPlan.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: 12, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                <span>Saldo Pendiente a Pagar</span>
                <span style={{ color: saldoPendiente > 0 ? "#ef4444" : "#10b981" }}>L {saldoPendiente.toFixed(2)}</span>
              </div>
            </div>

            {saldoPendiente > 0 ? (
              <>
                <h4 style={{ fontSize: 14, color: "#334155", margin: "0 0 12px 0" }}>Método de Pago</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                  <button
                    onClick={() => setPaymentMethod("Tarjeta")}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      padding: "12px 8px", borderRadius: 8, border: "1px solid",
                      borderColor: paymentMethod === "Tarjeta" ? "#0ea5e9" : "#e2e8f0",
                      background: paymentMethod === "Tarjeta" ? "#f0f9ff" : "#fff",
                      color: paymentMethod === "Tarjeta" ? "#0369a1" : "#64748b",
                      cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    <CreditCard size={18} />
                    <span style={{ fontSize: 10, fontWeight: 500 }}>Tarjeta</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("Transferencia")}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      padding: "12px 8px", borderRadius: 8, border: "1px solid",
                      borderColor: paymentMethod === "Transferencia" ? "#0ea5e9" : "#e2e8f0",
                      background: paymentMethod === "Transferencia" ? "#f0f9ff" : "#fff",
                      color: paymentMethod === "Transferencia" ? "#0369a1" : "#64748b",
                      cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    <Landmark size={18} />
                    <span style={{ fontSize: 10, fontWeight: 500 }}>Transf.</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("Efectivo")}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      padding: "12px 8px", borderRadius: 8, border: "1px solid",
                      borderColor: paymentMethod === "Efectivo" ? "#0ea5e9" : "#e2e8f0",
                      background: paymentMethod === "Efectivo" ? "#f0f9ff" : "#fff",
                      color: paymentMethod === "Efectivo" ? "#0369a1" : "#64748b",
                      cursor: "pointer", transition: "all 0.2s"
                    }}
                  >
                    <Banknote size={18} />
                    <span style={{ fontSize: 10, fontWeight: 500 }}>Efectivo</span>
                  </button>
                </div>

                {/* Opciones específicas según el método */}
                {paymentMethod === "Tarjeta" && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>Seleccione POS</label>
                      <select 
                        value={posSystem}
                        onChange={(e) => setPosSystem(e.target.value as any)}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, outline: "none" }}
                      >
                        <option value="BAC">POS BAC Credomatic</option>
                        <option value="Ficohsa">POS Ficohsa</option>
                        <option value="Banpaís">POS Banpaís</option>
                      </select>
                    </div>
                    {paymentMethod === "Tarjeta" && (
                      <div>
                        <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>Monto a Cobrar a la Tarjeta</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 12, top: 10, fontSize: 14, color: "#64748b" }}>L</span>
                          <input 
                            type="number"
                            value={montoParcial || ""}
                            onChange={(e) => setMontoParcial(e.target.value)}
                            placeholder={saldoPendiente.toFixed(2)}
                            style={{ width: "100%", padding: "10px 12px 10px 28px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === "Transferencia" && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>Cuenta Bancaria Destino</label>
                      <select 
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, outline: "none" }}
                      >
                        <option value="BAC - Cuenta Principal">BAC - Cuenta Principal</option>
                        <option value="Ficohsa - Cuenta Clínica">Ficohsa - Cuenta Clínica</option>
                        <option value="Banpaís - Cuenta Secundaria">Banpaís - Cuenta Secundaria</option>
                      </select>
                    </div>
                    {paymentMethod === "Transferencia" && (
                      <div>
                        <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>Monto de la Transferencia</label>
                        <div style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: 12, top: 10, fontSize: 14, color: "#64748b" }}>L</span>
                          <input 
                            type="number"
                            value={montoParcial || ""}
                            onChange={(e) => setMontoParcial(e.target.value)}
                            placeholder={saldoPendiente.toFixed(2)}
                            style={{ width: "100%", padding: "10px 12px 10px 28px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === "Efectivo" && (
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 6 }}>Efectivo Entregado (para calcular cambio)</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: 10, fontSize: 14, color: "#64748b" }}>L</span>
                      <input 
                        type="number"
                        value={cashReceived || ""}
                        onChange={(e) => setCashReceived(Number(e.target.value))}
                        placeholder={saldoPendiente.toFixed(2)}
                        style={{ width: "100%", padding: "10px 12px 10px 28px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    {cashReceived > saldoPendiente && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "8px 12px", background: "#f8fafc", borderRadius: 6 }}>
                        <span style={{ fontSize: 13, color: "#64748b" }}>Cambio a Devolver:</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>L {(cashReceived - saldoPendiente).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  variant="primary" 
                  onClick={handleProcessPayment}
                  disabled={loading}
                  style={{ width: "100%", background: "#0ea5e9", borderColor: "#0ea5e9", color: "#fff", display: "flex", justifyContent: "center", gap: 8, padding: "12px 0" }}
                >
                  <Receipt size={16} />
                  {loading ? "Procesando..." : `Pagar L ${(paymentMethod === "Efectivo" && cashReceived > 0 && cashReceived < saldoPendiente ? cashReceived : (montoParcial !== "" ? Number(montoParcial) : saldoPendiente)).toFixed(2)}`}
                </Button>
              </>
            ) : (
              <div style={{ background: "#ecfdf5", color: "#065f46", padding: "16px", borderRadius: 8, textAlign: "center", border: "1px solid #a7f3d0" }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Consulta Pagada</div>
                <div style={{ fontSize: 13 }}>No hay saldo pendiente por cobrar en esta consulta.</div>
              </div>
            )}
          </Card>
        </div>
      </div>
      </div>
    </>
  );
};
