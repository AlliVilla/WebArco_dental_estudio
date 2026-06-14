import { Save, X } from "lucide-react";
import { Alert, Button, Card } from "../../../context";
import type {
  ConsentFormValues,
  ConsentRecord,
  ConsentStep,
  SignatureTarget,
} from "../types";
import { ConsentFormStep } from "./ConsentFormStep";
import {
  ConsentCompletedStep,
  ConsentSignatureStep,
} from "./ConsentSignatureStep";
import { Stepper } from "./Stepper";
import { useResponsive } from "../../../hooks/useWindowWidth";

interface ConsentFormFlowProps {
  isEditing: boolean;
  selectedConsent?: ConsentRecord;
  formValues: ConsentFormValues;
  currentStep: ConsentStep;
  signatureTarget: SignatureTarget;
  patientSignature: string;
  doctorSignature: string;
  canContinueForm: boolean;
  onFormChange: (field: keyof ConsentFormValues, value: string) => void;
  onCancel: () => void;
  onContinueFromForm: () => void;
  onPatientSignatureChange: (value: string) => void;
  onDoctorSignatureChange: (value: string) => void;
  onStepChange: (step: ConsentStep) => void;
  onSignatureTargetChange: (target: SignatureTarget) => void;
  onSavePatientSignature: () => void;
  onSaveDoctorSignature: () => void;
  onFinish: () => void;
}

export function ConsentFormFlow({
  isEditing,
  selectedConsent,
  formValues,
  currentStep,
  signatureTarget,
  patientSignature,
  doctorSignature,
  canContinueForm,
  onFormChange,
  onCancel,
  onContinueFromForm,
  onPatientSignatureChange,
  onDoctorSignatureChange,
  onStepChange,
  onSignatureTargetChange,
  onSavePatientSignature,
  onSaveDoctorSignature,
  onFinish,
}: ConsentFormFlowProps) {
  const { isMobile } = useResponsive();
  const canSaveSignature =
    signatureTarget === "patient"
      ? Boolean(patientSignature)
      : Boolean(doctorSignature);
  const displayConsentCode =
    isEditing && selectedConsent
      ? selectedConsent.id
      : "Se generará al guardar";

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
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              color: "var(--foreground)",
              fontSize: isMobile ? 15 : 16,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {isEditing
              ? `Editando: ${formValues.procedimiento}`
              : "Nuevo Consentimiento Informado"}
          </h2>
          <p
            style={{
              color: "var(--muted-foreground)",
              fontSize: 13,
              margin: "4px 0 0 0",
            }}
          >
            {isEditing
              ? `Paciente: ${formValues.paciente}`
              : "Completa los pasos para generar el consentimiento firmado"}
          </p>
        </div>
        <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
          <X size={16} />
        </Button>
      </div>

      <Stepper currentStep={currentStep} />
      <Alert
        variant="info"
        message="Formulario de Consentimiento Informado. El paciente debe leer y comprender el contenido antes de firmar."
      />

      {currentStep === 1 && (
        <ConsentFormStep
          formValues={formValues}
          displayConsentCode={displayConsentCode}
          canContinueForm={canContinueForm}
          onChange={onFormChange}
          onCancel={onCancel}
          onContinue={onContinueFromForm}
        />
      )}
      {(currentStep === 2 || currentStep === 3) && (
        <ConsentSignatureStep
          formValues={formValues}
          signatureTarget={signatureTarget}
          patientSignature={patientSignature}
          doctorSignature={doctorSignature}
          onPatientSignatureChange={onPatientSignatureChange}
          onDoctorSignatureChange={onDoctorSignatureChange}
        />
      )}
      {currentStep === 4 && <ConsentCompletedStep />}

      {/* Acciones del footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {(currentStep === 2 || currentStep === 3) && (
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                if (currentStep === 2) onStepChange(1);
                if (currentStep === 3) {
                  onStepChange(2);
                  onSignatureTargetChange("patient");
                }
              }}
            >
              Volver
            </Button>
            <Button
              type="button"
              disabled={!canSaveSignature}
              onClick={
                signatureTarget === "patient"
                  ? onSavePatientSignature
                  : onSaveDoctorSignature
              }
              style={{ width: isMobile ? "100%" : undefined }}
            >
              <Save size={16} />
              {isMobile
                ? signatureTarget === "patient"
                  ? "Guardar firma"
                  : "Guardar firma doctor"
                : signatureTarget === "patient"
                ? "Guardar firma del paciente"
                : "Guardar firma del doctor"}
            </Button>
          </>
        )}
        {currentStep === 4 && (
          <Button type="button" onClick={onFinish}>
            Volver al listado
          </Button>
        )}
      </div>
    </Card>
  );
}
