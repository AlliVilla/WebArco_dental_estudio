import {
  CheckCircle2,
  Clock,
  FileText,
  PenLine,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { FormSection, FullWidthField } from "../../../components";
import { Alert } from "../../../context";
import type { ConsentFormValues, SignatureTarget } from "../types";
import { SignaturePad } from "./SignaturePad";
import { useResponsive } from "../../../hooks/useWindowWidth";

interface ConsentSignatureStepProps {
  formValues: ConsentFormValues;
  signatureTarget: SignatureTarget;
  patientSignature: string;
  doctorSignature: string;
  onPatientSignatureChange: (value: string) => void;
  onDoctorSignatureChange: (value: string) => void;
}

function SignatureInfoCard({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--background)",
        padding: 14,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: "var(--arco-primary-light)",
          color: "var(--arco-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span
          style={{
            color: "var(--muted-foreground)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span
          style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 600 }}
        >
          {value}
        </span>
        <span
          style={{
            color: "var(--muted-foreground)",
            fontSize: 12,
            lineHeight: "18px",
          }}
        >
          {helper}
        </span>
      </div>
    </div>
  );
}

export function ConsentSignatureStep({
  formValues,
  signatureTarget,
  patientSignature,
  doctorSignature,
  onPatientSignatureChange,
  onDoctorSignatureChange,
}: ConsentSignatureStepProps) {
  const { isMobile } = useResponsive();
  const isPatient = signatureTarget === "patient";
  const signerLabel = isPatient ? formValues.paciente : formValues.doctor;
  const title = isPatient
    ? "Firma digital del paciente"
    : "Firma digital del doctor";
  const message = isPatient
    ? "El paciente debe confirmar que leyó y comprendió el consentimiento antes de firmar."
    : "La pizarra fue reiniciada. El doctor responsable debe firmar para completar el consentimiento.";

  return (
    <FormSection
      title={isPatient ? "Firma del paciente" : "Firma del doctor"}
      icon={<PenLine size={18} />}
      columns={1}
      style={{ background: "var(--card)" }}
    >
      <FullWidthField>
        <div
          style={{
            border: "1px solid var(--arco-primary)",
            borderRadius: 14,
            background: "var(--arco-primary-light)",
            padding: 16,
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <SignatureInfoCard
            icon={<FileText size={18} />}
            label="Consentimiento"
            value={formValues.procedimiento}
            helper="Documento listo para captura de firma."
          />
          <SignatureInfoCard
            icon={<UserRound size={18} />}
            label={isPatient ? "Firmante actual" : "Responsable clínico"}
            value={signerLabel}
            helper={
              isPatient
                ? "Debe firmar el paciente seleccionado."
                : "Debe firmar el doctor responsable."
            }
          />
          <SignatureInfoCard
            icon={<ShieldCheck size={18} />}
            label="Validación"
            value={isPatient ? "Paso 2 de 4" : "Paso 3 de 4"}
            helper={message}
          />
        </div>
      </FullWidthField>
      <FullWidthField>
        <Alert variant="info" message={message} />
      </FullWidthField>
      <FullWidthField>
        <SignaturePad
          key={signatureTarget}
          title={title}
          signerName={signerLabel}
          value={isPatient ? patientSignature : doctorSignature}
          onChange={
            isPatient ? onPatientSignatureChange : onDoctorSignatureChange
          }
        />
      </FullWidthField>
    </FormSection>
  );
}

export function ConsentCompletedStep() {
  return (
    <div
      style={{
        border: "1px solid var(--arco-success)",
        borderRadius: 14,
        background: "var(--arco-success-soft)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        textAlign: "center",
      }}
    >
      <CheckCircle2 size={42} style={{ color: "var(--arco-success)" }} />
      <div
        style={{ color: "var(--foreground)", fontSize: 18, fontWeight: 600 }}
      >
        Consentimiento completado
      </div>
      <p
        style={{
          color: "var(--muted-foreground)",
          fontSize: 14,
          maxWidth: 540,
          margin: 0,
        }}
      >
        El formulario fue completado y las firmas del paciente y del doctor
        quedaron capturadas.
      </p>
    </div>
  );
}
