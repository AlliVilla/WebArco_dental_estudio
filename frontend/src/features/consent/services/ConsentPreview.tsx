import { CheckCircle2, Clock, Info, Printer, X } from "lucide-react";
import { FormSection } from "../../../components";
import { Button, Card, Input } from "../../../context";
import type { ConsentRecord } from "../types";
import { getStatusMeta } from "./consentUtils";
import { printConsentDocuments } from "./printConsentDocuments";
import { useResponsive } from "../../../hooks/useWindowWidth";

interface ConsentPreviewProps {
  selectedConsent: ConsentRecord;
  onClose: () => void;
}

function ReadOnlySignature({
  title,
  signer,
  signature,
}: {
  title: string;
  signer: string;
  signature?: string;
}) {
  const hasImageSignature = signature?.startsWith("data:image");
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 16,
        minHeight: 150,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
        {title}
      </span>
      <div
        style={{
          border: "1px dashed var(--border)",
          borderRadius: 8,
          background: "var(--input-background)",
          minHeight: 74,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 6,
          color: signature ? "var(--arco-success)" : "var(--arco-warning)",
          fontSize: 13,
        }}
      >
        {hasImageSignature ? (
          <img
            src={signature}
            alt={title}
            style={{ maxWidth: "100%", maxHeight: 70, objectFit: "contain" }}
          />
        ) : (
          <>
            {signature ? <CheckCircle2 size={16} /> : <Clock size={16} />}
            {signature ? "Firmado" : "Pendiente"}
          </>
        )}
      </div>
      <span
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 8,
          color: "var(--muted-foreground)",
          fontSize: 12,
        }}
      >
        {signer}
      </span>
    </div>
  );
}

export function ConsentPreview({
  selectedConsent,
  onClose,
}: ConsentPreviewProps) {
  const { isMobile } = useResponsive();

  return (
    <Card
      style={{
        padding: isMobile ? 16 : 20,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              color: "var(--foreground)",
              fontSize: 16,
              fontWeight: 600,
              margin: 0,
            }}
          >
            Vista previa — Consentimiento {selectedConsent.id}
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: 13,
                margin: 0,
              }}
            >
              Documento en modo solo lectura
            </p>
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "var(--muted-foreground)",
                opacity: 0.4,
              }}
            />
            {(() => {
              const meta = getStatusMeta(selectedConsent.estado);
              return (
                <span
                  style={{
                    background: meta.background,
                    color: meta.color,
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {meta.label}
                </span>
              );
            })()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => printConsentDocuments([selectedConsent])}
          >
            <Printer size={16} />
            {!isMobile && " Imprimir"}
          </Button>
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "var(--card)",
          padding: isMobile ? 16 : 30,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Título centrado */}
        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span
            style={{
              background: "var(--arco-primary-light)",
              color: "var(--arco-primary)",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            ARCO Dental Studio
          </span>
          <h3
            style={{
              color: "var(--foreground)",
              fontSize: isMobile ? 15 : 18,
              fontWeight: 600,
              margin: 0,
            }}
          >
            Consentimiento Informado
          </h3>
          <p
            style={{
              color: "var(--muted-foreground)",
              fontSize: 12,
              margin: 0,
            }}
          >
            {selectedConsent.id} · Emitido el {selectedConsent.fecha}
          </p>
        </div>

        <div style={{ height: 1, background: "var(--arco-primary)" }} />

        <FormSection
          title="Datos del Procedimiento"
          icon={<Info size={18} />}
          columns={isMobile ? 1 : 2}
          style={{ background: "var(--card)", padding: 0, border: "none" }}
        >
          <Input label="Paciente" value={selectedConsent.paciente} disabled />
          <Input
            label="Doctor responsable"
            value={selectedConsent.doctor}
            disabled
          />
          <Input
            label="Procedimiento"
            value={selectedConsent.procedimiento}
            disabled
          />
          <Input label="Fecha" value={selectedConsent.fecha} disabled />
        </FormSection>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h4
            style={{
              color: "var(--foreground)",
              fontSize: 13,
              fontWeight: 600,
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            Texto legal
          </h4>
          {[
            selectedConsent.declaracion,
            selectedConsent.riesgos,
            selectedConsent.clausula,
          ].map((text) => (
            <div
              key={text}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 14,
                fontSize: 13,
                color: "var(--foreground)",
                lineHeight: "20px",
              }}
            >
              {text}
            </div>
          ))}
        </div>

        {/* Firmas: 1 col móvil, 2 cols desktop */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: 16,
          }}
        >
          <ReadOnlySignature
            title="Firma del paciente"
            signer={selectedConsent.paciente}
            signature={selectedConsent.patientSignature}
          />
          <ReadOnlySignature
            title="Firma del doctor"
            signer={selectedConsent.doctor}
            signature={selectedConsent.doctorSignature}
          />
        </div>
      </div>
    </Card>
  );
}
