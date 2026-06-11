import type { ConsentRecord, ConsentStatus } from "../types";
import { getStatusMeta } from "./consentUtils";

function escapePrintText(value?: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderPrintSignature(title: string, signer: string, signature?: string) {
  const signatureContent = signature?.startsWith("data:image")
    ? `<img src="${signature}" alt="${escapePrintText(title)}" />`
    : `<span class="signature-status">${signature ? "Firmado" : "Pendiente"}</span>`;

  return `
    <div class="signature-box">
      <div class="signature-title">${escapePrintText(title)}</div>
      <div class="signature-canvas">${signatureContent}</div>
      <div class="signature-line">${escapePrintText(signer)}</div>
    </div>
  `;
}

function buildConsentPrintDocument(consent: ConsentRecord) {
  const statusMeta = getStatusMeta(consent.estado);
  const statusColors: Record<ConsentStatus, { background: string; color: string }> = {
    firmado: { background: "#059669", color: "#ffffff" },
    pendiente_doctor: { background: "#f59e0b", color: "#ffffff" },
    pendiente_paciente: { background: "#fef3c7", color: "#b45309" },
  };
  const statusColor = statusColors[consent.estado];

  return `
    <article class="consent-document">
      <header class="document-header">
        <div class="clinic-badge">ARCO Dental Studio</div>
        <h1>Consentimiento Informado</h1>
        <p>${escapePrintText(consent.id)} · Emitido el ${escapePrintText(consent.fecha)}</p>
      </header>

      <section class="procedure-grid">
        <div class="field"><span>Paciente</span><strong>${escapePrintText(consent.paciente)}</strong></div>
        <div class="field"><span>Doctor responsable</span><strong>${escapePrintText(consent.doctor)}</strong></div>
        <div class="field"><span>Procedimiento</span><strong>${escapePrintText(consent.procedimiento)}</strong></div>
        <div class="field"><span>Fecha y hora</span><strong>${escapePrintText(`${consent.fecha} ${consent.hora}`)}</strong></div>
      </section>

      <section class="legal-section">
        <h2>Texto legal</h2>
        <div class="legal-box"><strong>Declaración de veracidad médica</strong><p>${escapePrintText(consent.declaracion)}</p></div>
        <div class="legal-box"><strong>Descripción de riesgos del procedimiento</strong><p>${escapePrintText(consent.riesgos)}</p></div>
        <div class="legal-box"><strong>Cláusula de aceptación</strong><p>${escapePrintText(consent.clausula)}</p></div>
      </section>

      <section class="signatures-section">
        ${renderPrintSignature("Firma del paciente", consent.paciente, consent.patientSignature)}
        ${renderPrintSignature("Firma del doctor", consent.doctor, consent.doctorSignature)}
      </section>

      <footer class="document-footer">
        <span class="status-pill" style="background:${statusColor.background};color:${statusColor.color}">${escapePrintText(statusMeta.label)}</span>
      </footer>
    </article>
  `;
}

function buildPrintHtml(documents: ConsentRecord[]) {
  const documentTitle =
    documents.length === 1
      ? `Consentimiento Informado ${documents[0].id}`
      : "Consentimientos Informados";

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapePrintText(documentTitle)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #f8fafc;
            color: #0f172a;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 12px;
            line-height: 1.5;
          }
          .print-root { padding: 24px; }
          .consent-document {
            width: 100%;
            max-width: 820px;
            min-height: 1060px;
            margin: 0 auto 24px;
            padding: 42px;
            background: #ffffff;
            border: 1px solid #dbe5ea;
            border-radius: 14px;
            page-break-after: always;
          }
          .consent-document:last-child { page-break-after: auto; }
          .document-header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #06b6d4;
            margin-bottom: 20px;
          }
          .clinic-badge {
            display: inline-block;
            padding: 7px 14px;
            margin-bottom: 10px;
            border-radius: 9px;
            background: #cffafe;
            color: #0891b2;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: .04em;
            text-transform: uppercase;
          }
          h1 { margin: 0; font-size: 20px; font-weight: 700; }
          .document-header p { margin: 4px 0 0; color: #64748b; }
          .procedure-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .field {
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            padding: 11px 12px;
            background: #f8fafc;
          }
          .field span, .signature-title {
            display: block;
            color: #64748b;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: .05em;
            text-transform: uppercase;
          }
          .field strong { display: block; margin-top: 3px; font-size: 12px; color: #0f172a; }
          .legal-section h2 {
            margin: 0 0 10px;
            color: #0f172a;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: .06em;
            text-transform: uppercase;
          }
          .legal-box {
            border: 1px solid #e2e8f0;
            border-radius: 9px;
            padding: 12px 14px;
            margin-bottom: 10px;
          }
          .legal-box strong { display: block; margin-bottom: 6px; font-size: 11px; color: #334155; }
          .legal-box p { margin: 0; color: #334155; }
          .signatures-section {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-top: 20px;
          }
          .signature-box {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px;
            min-height: 170px;
          }
          .signature-canvas {
            height: 92px;
            margin: 10px 0;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #059669;
            font-weight: 700;
          }
          .signature-canvas img { max-width: 100%; max-height: 86px; object-fit: contain; }
          .signature-line {
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            color: #475569;
            font-size: 11px;
          }
          .document-footer { display: flex; justify-content: center; margin-top: 20px; }
          .status-pill {
            border-radius: 999px;
            padding: 6px 14px;
            font-size: 11px;
            font-weight: 700;
          }
          @page { size: letter; margin: 12mm; }
          @media print {
            body { background: #ffffff; }
            .print-root { padding: 0; }
            .consent-document {
              max-width: none;
              min-height: auto;
              margin: 0;
              padding: 0;
              border: 0;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <main class="print-root">
          ${documents.map((document) => buildConsentPrintDocument(document)).join("")}
        </main>
        <script>
          window.addEventListener('load', function () {
            window.focus();
            window.print();
          });
        </script>
      </body>
    </html>
  `;
}

export function printConsentDocuments(documents: ConsentRecord[]) {
  if (!documents.length) return;

  const printWindow = window.open("", "_blank", "width=900,height=1100");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(buildPrintHtml(documents));
  printWindow.document.close();
}
