import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [signatureError, setSignatureError] = useState("");

  const canSaveSignature =
    signatureTarget === "patient"
      ? Boolean(patientSignature)
      : Boolean(doctorSignature);
  const displayConsentCode =
    isEditing && selectedConsent
      ? selectedConsent.id
      : "Se generará al guardar";

  // Validar campos del step 1 y hacer scroll al primero con error
  const handleContinue = () => {
    const errors: Record<string, string> = {};
    if (!formValues.paciente.trim())
      errors.paciente = "El nombre del paciente es obligatorio";
    if (!formValues.doctor) errors.doctor = "Selecciona un doctor responsable";
    if (!formValues.procedimiento)
      errors.procedimiento = "Selecciona el procedimiento a realizar";
    if (!formValues.fechaHora)
      errors.fechaHora = "La fecha y hora son obligatorias";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTimeout(() => {
        // Buscar en todo el documento — no en un ref — para no depender de si Card pasa el ref
        const first = document.querySelector<HTMLElement>("[data-field-error]");
        if (first) {
          const rect = first.getBoundingClientRect();
          window.scrollTo({
            top: window.scrollY + rect.top - 100,
            behavior: "smooth",
          });
        }
      }, 0);
      return;
    }
    setFieldErrors({});
    onContinueFromForm();
  };

  const handleSaveSignature = () => {
    if (!canSaveSignature) {
      setSignatureError(
        signatureTarget === "patient"
          ? "El paciente debe firmar en la pizarra antes de continuar."
          : "El doctor debe firmar en la pizarra antes de guardar."
      );
      return;
    }
    setSignatureError("");
    if (signatureTarget === "patient") onSavePatientSignature();
    else onSaveDoctorSignature();
  };

  const handleBack = () => {
    setFieldErrors({});
    setSignatureError("");
    if (currentStep === 1) onCancel();
    else if (currentStep === 2) onStepChange(1);
    else if (currentStep === 3) {
      onStepChange(2);
      onSignatureTargetChange("patient");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 20,
      }}
    >
      {/* Flecha sola arriba — igual que otras pantallas */}
      {currentStep !== 4 && (
        <button
          onClick={handleBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#888F94",
            fontSize: 13,
            fontWeight: 500,
            padding: 0,
            width: "fit-content",
          }}
        >
          <ArrowLeft size={16} />
          {currentStep === 1 ? "Volver al listado" : "Volver"}
        </button>
      )}

      <Card
        style={{
          padding: isMobile ? 16 : 20,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Título */}
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

        <Stepper currentStep={currentStep} />

        {signatureError && (
          <Alert
            variant="error"
            message={signatureError}
            onClose={() => setSignatureError("")}
          />
        )}
        <Alert
          variant="info"
          message="Formulario de Consentimiento Informado. El paciente debe leer y comprender el contenido antes de firmar."
        />

        {currentStep === 1 && (
          <ConsentFormStep
            formValues={formValues}
            displayConsentCode={displayConsentCode}
            fieldErrors={fieldErrors}
            onClearError={(field) =>
              setFieldErrors((p) => ({ ...p, [field]: "" }))
            }
            onChange={onFormChange}
            onContinue={handleContinue}
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

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {(currentStep === 2 || currentStep === 3) && (
            <Button
              type="button"
              onClick={handleSaveSignature}
              style={{ width: isMobile ? "100%" : undefined }}
            >
              <Save size={16} />
              {isMobile
                ? "Guardar firma"
                : signatureTarget === "patient"
                ? "Guardar firma del paciente"
                : "Guardar firma del doctor"}
            </Button>
          )}
          {currentStep === 4 && (
            <Button type="button" onClick={onFinish}>
              Volver al listado
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
