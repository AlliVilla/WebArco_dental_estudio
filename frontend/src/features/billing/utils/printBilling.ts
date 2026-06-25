import { Consultation } from "../../consultations/types";
import { formatNumber } from "../../../utils/formatters";

// Helper to escape HTML to prevent XSS in print outputs
function escapeHtml(value?: string | number | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Parse free-text concepts from consulta.tratamiento
function parseConceptosLibres(text?: string | null) {
  if (!text) return [];
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
}

// Common CSS for both documents
const commonStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
  
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #203F49;
    background: #ffffff;
    font-size: 13px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .print-page {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px;
    background: #ffffff;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #0BC5DF;
    padding-bottom: 20px;
    margin-bottom: 24px;
  }
  .clinic-info h1 {
    margin: 0 0 6px 0;
    font-size: 24px;
    font-weight: 700;
    color: #203F49;
  }
  .clinic-info h1 span {
    color: #0BC5DF;
  }
  .clinic-info p {
    margin: 2px 0;
    color: #5F656A;
    font-size: 12px;
  }
  .doc-title {
    text-align: right;
  }
  .doc-title h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 700;
    color: #0BC5DF;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .doc-title p {
    margin: 2px 0;
    font-size: 12px;
    color: #5F656A;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }
  .meta-card {
    background: #F8F9FA;
    border: 1px solid #EAECEE;
    border-radius: 8px;
    padding: 14px;
  }
  .meta-card h3 {
    margin: 0 0 8px 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: #888F94;
    letter-spacing: 0.05em;
  }
  .meta-card p {
    margin: 4px 0;
    font-size: 13px;
    font-weight: 500;
  }
  .meta-card p span {
    font-weight: 400;
    color: #5F656A;
  }
  .table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }
  .table th {
    background: #203F49;
    color: #ffffff;
    text-align: left;
    padding: 10px 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .table td {
    padding: 10px 12px;
    border-bottom: 1px solid #EAECEE;
    font-size: 12px;
  }
  .table tr:nth-child(even) td {
    background: #F9FAFB;
  }
  .text-right {
    text-align: right !important;
  }
  .summary-section {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 30px;
  }
  .summary-box {
    width: 300px;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 13px;
  }
  .summary-row.total {
    border-top: 1.5px solid #203F49;
    font-size: 15px;
    font-weight: 700;
    padding-top: 10px;
    color: #203F49;
  }
  .summary-row.pending {
    color: #E24B4A;
    font-weight: 600;
  }
  .summary-row.paid {
    color: #1D9E75;
    font-weight: 600;
  }
  .section-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: #203F49;
    border-bottom: 1.5px solid #EAECEE;
    padding-bottom: 6px;
    margin: 24px 0 12px 0;
    letter-spacing: 0.05em;
  }
  .footer-note {
    text-align: center;
    margin-top: 60px;
    padding-top: 20px;
    border-top: 1px solid #EAECEE;
    color: #888F94;
    font-size: 11px;
  }

  @page {
    size: letter;
    margin: 15mm;
  }
  @media print {
    body {
      background: #ffffff;
    }
    .print-page {
      padding: 0;
    }
  }
`;

export function printInvoice(
  consulta: Consultation,
  tipo: "consulta" | "plan",
  customDiscounts: Record<number, number> = {},
  conceptoDiscounts: Record<number, number> = {},
  planAbonoAgregado: number = 0
) {
  const patient = consulta.persona;
  const patientName = patient
    ? `${(patient as any).primer_nombre || patient.nombre || ""} ${(patient as any).primer_apellido || patient.apellido || ""}`.trim()
    : "Desconocido";
  const patientId = (patient as any)?.numero_identidad || "N/A";
  const patientPhone = (patient as any)?.telefono || "N/A";

  const doctor = consulta.doctor;
  const doctorName = doctor
    ? (doctor as any).persona
      ? `Dr. ${(doctor as any).persona.primer_nombre || ""} ${(doctor as any).persona.primer_apellido || ""}`.trim()
      : (doctor as any).nombre || (doctor as any).username || "N/A"
    : "N/A";

  const fechaConsulta = new Date(consulta.fecha_inicio).toLocaleDateString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate items
  const tratamientosLista = consulta.tratamientos || [];
  const conceptosLibres = parseConceptosLibres(consulta.tratamiento);

  const subtotalBrutoCatalogo = tratamientosLista.reduce(
    (acc, t) => acc + (Number(t.precio) || Number(t.tratamiento?.precio) || 0),
    0
  );

  const totalDescuentoCatalogo = tratamientosLista.reduce((acc, t, idx) => {
    const p = Number(t.precio) || Number(t.tratamiento?.precio) || 0;
    const d = customDiscounts[idx] !== undefined ? customDiscounts[idx] : Number(t.descuento) || 0;
    return acc + p * (d / 100);
  }, 0);

  const totalConceptosBruto = conceptosLibres.reduce((acc, c) => acc + c.precio, 0);

  const totalDescuentoConceptos = conceptosLibres.reduce((acc, c, idx) => {
    const d = conceptoDiscounts[idx] ?? c.descuento ?? 0;
    return acc + c.precio * (d / 100);
  }, 0);

  const subtotalBruto = subtotalBrutoCatalogo + totalConceptosBruto;
  const totalDescuento = totalDescuentoCatalogo + totalDescuentoConceptos;
  const totalNeto = subtotalBruto - totalDescuento;

  // Payments calculations
  const pagosAnterioresPaciente = consulta.pagos || [];
  const pagosAnterioresConsulta = consulta.pagosConsulta || [];

  const historicoPlanAbonos = pagosAnterioresConsulta.reduce(
    (acc, p) => acc + Number(p.monto),
    0
  );

  const totalAPagar = tipo === "plan" ? planAbonoAgregado : totalNeto + planAbonoAgregado;

  const todosLosPagos = [
    ...pagosAnterioresPaciente.map((p) => {
      let safeDate = p.fecha;
      if (typeof safeDate === "string" && safeDate.endsWith("T00:00:00.000Z")) {
        safeDate = safeDate.replace("T00:00:00.000Z", "T12:00:00.000Z");
      }
      return {
        fecha: new Date(safeDate).toLocaleDateString("es-HN"),
        monto: Number(p.abono),
        metodo: p.metodo_pago,
        tipo: "Consulta",
      };
    }),
    ...pagosAnterioresConsulta.map((p) => ({
      fecha: new Date(p.fecha).toLocaleDateString("es-HN"),
      monto: Number(p.monto),
      metodo: p.metodoPago,
      tipo: "Plan de Tratamiento",
    })),
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const montoPagadoTratamientos = pagosAnterioresPaciente.reduce((acc, p) => acc + Number(p.abono), 0);
  const montoPagadoPlan = historicoPlanAbonos;
  const totalAbonado = montoPagadoTratamientos + montoPagadoPlan;
  const saldoPendiente = Math.max(0, totalNeto - montoPagadoTratamientos) + (tipo === "plan" ? planAbonoAgregado : 0);

  const tableRowsHtml = [
    ...tratamientosLista.map((t, idx) => {
      const p = Number(t.precio) || Number(t.tratamiento?.precio) || 0;
      const d = customDiscounts[idx] !== undefined ? customDiscounts[idx] : Number(t.descuento) || 0;
      const descAmount = p * (d / 100);
      const st = p - descAmount;
      return `
        <tr>
          <td>${escapeHtml(t.tratamiento?.nombre || "Tratamiento")}</td>
          <td class="text-right">L ${formatNumber(p)}</td>
          <td class="text-right">${d}%</td>
          <td class="text-right">L ${formatNumber(st)}</td>
        </tr>
      `;
    }),
    ...conceptosLibres.map((c, idx) => {
      const d = conceptoDiscounts[idx] ?? c.descuento ?? 0;
      const descAmount = c.precio * (d / 100);
      const st = c.precio - descAmount;
      return `
        <tr>
          <td>${escapeHtml(c.nombre)} (Concepto Libre)</td>
          <td class="text-right">L ${formatNumber(c.precio)}</td>
          <td class="text-right">${d}%</td>
          <td class="text-right">L ${formatNumber(st)}</td>
        </tr>
      `;
    }),
  ].join("");

  const plan = consulta.tratamientoPaciente;
  let planHtml = "";
  if (plan) {
    const planCostoTotal = Number(plan.costoTotal);
    const planAbonos = plan.abonos || [];
    const planTotalPagado = planAbonos.reduce((acc, a) => acc + Number(a.montoAbonado), 0);
    const planSaldoPendiente = Math.max(0, planCostoTotal - planTotalPagado);
    planHtml = `
      <div class="section-title">Plan de Tratamiento Vinculado</div>
      <div style="background: #F4F3FF; border: 1px solid #E2D6FF; border-radius: 8px; padding: 14px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #7C3AED;">${escapeHtml(plan.nombre)}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
          <div><span style="font-size: 11px; color: #64748B;">Costo Plan:</span> <strong style="color: #203F49;">L ${formatNumber(planCostoTotal)}</strong></div>
          <div><span style="font-size: 11px; color: #64748B;">Abonado Plan:</span> <strong style="color: #1D9E75;">L ${formatNumber(planTotalPagado)}</strong></div>
          <div><span style="font-size: 11px; color: #64748B;">Pendiente Plan:</span> <strong style="color: #EF9F27;">L ${formatNumber(planSaldoPendiente)}</strong></div>
        </div>
      </div>
    `;
  }

  const paymentsHtml = todosLosPagos.length > 0
    ? `
      <div class="section-title">Historial de Transacciones</div>
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Método</th>
            <th class="text-right">Abono</th>
          </tr>
        </thead>
        <tbody>
          ${todosLosPagos.map((p) => `
            <tr>
              <td>${p.fecha}</td>
              <td>${p.tipo}</td>
              <td>${p.metodo}</td>
              <td class="text-right" style="color: #1D9E75; font-weight: 600;">+ L ${formatNumber(p.monto)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `
    : "";

  const htmlContent = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Factura_Consulta_${consulta.id_consulta}</title>
        <style>
          ${commonStyles}
        </style>
      </head>
      <body>
        <div class="print-page">
          <div class="header">
            <div class="clinic-info">
              <h1>ARCO <span>Dental Studio</span></h1>
              <p>Colonia Palmira, Edificio Midence Soto, Tegucigalpa</p>
              <p>Teléfono: +504 9999-9999 | Email: info@arcodental.com</p>
              <p>RTN: 0801-9012-345678</p>
            </div>
            <div class="doc-title">
              <h2>Factura / Estado</h2>
              <p>Factura No: FAC-CONS-${consulta.id_consulta}</p>
              <p>Fecha Emisión: ${new Date().toLocaleDateString("es-HN")}</p>
              <p>Estado: <strong>${saldoPendiente <= 0 ? "PAGADO" : "PENDIENTE"}</strong></p>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <h3>Datos del Paciente</h3>
              <p><span>Paciente:</span> ${escapeHtml(patientName)}</p>
              <p><span>Identidad:</span> ${escapeHtml(patientId)}</p>
              <p><span>Teléfono:</span> ${escapeHtml(patientPhone)}</p>
            </div>
            <div class="meta-card">
              <h3>Detalles de la Cita</h3>
              <p><span>Cita ID:</span> #${consulta.id_consulta}</p>
              <p><span>Fecha Consulta:</span> ${fechaConsulta}</p>
              <p><span>Dentista:</span> ${escapeHtml(doctorName)}</p>
            </div>
          </div>

          <div class="section-title">Tratamientos Realizados</div>
          <table class="table">
            <thead>
              <tr>
                <th>Concepto / Tratamiento</th>
                <th class="text-right">Precio Base</th>
                <th class="text-right">Desc %</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml || `<tr><td colspan="4" style="text-align: center; color: #888f94; font-style: italic;">No hay tratamientos directos registrados</td></tr>`}
            </tbody>
          </table>

          ${planHtml}

          ${paymentsHtml}

          <div class="summary-section">
            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal Bruto:</span>
                <span>L ${formatNumber(subtotalBruto)}</span>
              </div>
              <div class="summary-row" style="color: #E24B4A;">
                <span>Descuento Aplicado:</span>
                <span>- L ${formatNumber(totalDescuento)}</span>
              </div>
              <div class="summary-row" style="font-weight: 500;">
                <span>Subtotal Neto:</span>
                <span>L ${formatNumber(totalNeto)}</span>
              </div>
              ${planAbonoAgregado > 0 ? `
                <div class="summary-row" style="color: #7C3AED;">
                  <span>Abono a Plan hoy:</span>
                  <span>+ L ${formatNumber(planAbonoAgregado)}</span>
                </div>
              ` : ""}
              <div class="summary-row total">
                <span>Total Facturado:</span>
                <span>L ${formatNumber(totalAPagar)}</span>
              </div>
              <div class="summary-row paid">
                <span>Total Abonado:</span>
                <span>L ${formatNumber(totalAbonado)}</span>
              </div>
              <div class="summary-row pending">
                <span>Saldo Pendiente:</span>
                <span>L ${formatNumber(saldoPendiente)}</span>
              </div>
            </div>
          </div>



          <div class="footer-note">
            <p>Esta es una factura de servicio médico dental emitida por ARCO Dental Studio.</p>
            <p>¡Gracias por su preferencia y confiar en su salud dental con nosotros!</p>
          </div>
        </div>

        <script>
          window.addEventListener('load', function () {
            window.focus();
            window.print();
          });
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=850,height=1000");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function printPaymentReceipt(consulta: Consultation, payment: any) {
  const patient = consulta.persona;
  const patientName = patient
    ? `${(patient as any).primer_nombre || patient.nombre || ""} ${(patient as any).primer_apellido || patient.apellido || ""}`.trim()
    : "Desconocido";
  const patientId = (patient as any)?.numero_identidad || "N/A";

  const doctor = consulta.doctor;
  const doctorName = doctor
    ? (doctor as any).persona
      ? `Dr. ${(doctor as any).persona.primer_nombre || ""} ${(doctor as any).persona.primer_apellido || ""}`.trim()
      : (doctor as any).nombre || (doctor as any).username || "N/A"
    : "N/A";

  const pId = payment.id || payment.id_pago || "N/A";
  
  // Format Date safely
  let pDateStr = payment.fecha || new Date();
  if (typeof pDateStr === "string" && pDateStr.endsWith("T00:00:00.000Z")) {
    pDateStr = pDateStr.replace("T00:00:00.000Z", "T12:00:00.000Z");
  }
  const paymentDate = new Date(pDateStr).toLocaleString("es-HN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const amount = Number(payment.monto || payment.abono || 0);
  const paymentMethod = payment.metodo || payment.metodoPago || payment.metodo_pago || "Efectivo";
  const observacion = payment.obs || payment.observacion || "Pago de tratamientos";

  const htmlContent = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Recibo_Pago_${pId}</title>
        <style>
          ${commonStyles}
          .receipt-box {
            border: 2px dashed #0BC5DF;
            border-radius: 12px;
            padding: 30px;
            background: #FAFEFF;
          }
        </style>
      </head>
      <body>
        <div class="print-page">
          <div class="receipt-box">
            <div class="header" style="border-bottom: 2px dashed #0BC5DF;">
              <div class="clinic-info">
                <h1>ARCO <span>Dental Studio</span></h1>
                <p>Colonia Palmira, Edificio Midence Soto, Tegucigalpa</p>
                <p>Teléfono: +504 9999-9999</p>
              </div>
              <div class="doc-title">
                <h2>Recibo de Pago</h2>
                <p>Recibo No: REC-PAGO-${pId}</p>
                <p>Fecha: ${paymentDate}</p>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-card" style="background: #ffffff;">
                <h3>Paciente</h3>
                <p><span>Nombre:</span> ${escapeHtml(patientName)}</p>
                <p><span>Identidad:</span> ${escapeHtml(patientId)}</p>
              </div>
              <div class="meta-card" style="background: #ffffff;">
                <h3>Referencia de Consulta</h3>
                <p><span>Consulta ID:</span> #${consulta.id_consulta}</p>
                <p><span>Dentista:</span> ${escapeHtml(doctorName)}</p>
              </div>
            </div>

            <div class="section-title">Detalle del Pago</div>
            <table class="table" style="background: #ffffff;">
              <thead>
                <tr>
                  <th>Concepto / Descripción</th>
                  <th>Método de Pago</th>
                  <th class="text-right">Monto Pagado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: 500;">${escapeHtml(observacion)}</td>
                  <td>${escapeHtml(paymentMethod)}</td>
                  <td class="text-right" style="font-size: 16px; font-weight: 700; color: #1D9E75;">L ${formatNumber(amount)}</td>
                </tr>
              </tbody>
            </table>

            <div style="text-align: right; margin-top: 10px; font-size: 13px;">
              <span>Monto Recibido:</span> <strong>L ${formatNumber(amount)} Lempiras</strong>
            </div>



            <div class="footer-note" style="margin-top: 40px; border-top: 1px dashed #EAECEE;">
              <p>Este documento es un comprobante de abono / pago médico dental.</p>
              <p>¡Muchas gracias por su pago!</p>
            </div>
          </div>
        </div>

        <script>
          window.addEventListener('load', function () {
            window.focus();
            window.print();
          });
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=850,height=800");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
