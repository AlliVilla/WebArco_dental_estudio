import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ConfirmModal } from "../../../components";
import { useTheme } from "../../../context";
import { ConsentFormFlow } from "./ConsentFormFlow";
import { ConsentListTable } from "./ConsentListTable";
import { ConsentPreview } from "./ConsentPreview";
import { ConsentSearchCard } from "./ConsentSearchCard";
import { defaultFormValues, initialConsents } from "./consentData";
import { formatDisplayDate, formatDisplayTime } from "./consentUtils";
import type {
  ConsentFormValues,
  ConsentMode,
  ConsentRecord,
  ConsentScreenProps,
  ConsentStatus,
  ConsentStep,
  SignatureTarget,
} from "../types";

export function ConsentScreen({ patientName }: ConsentScreenProps) {
  useTheme();

  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const mode = (searchParams.get("mode") as ConsentMode | null) ?? "list";
  const selectedId = searchParams.get("id");

  const [consents, setConsents] = useState<ConsentRecord[]>(initialConsents);

  const [formValues, setFormValues] = useState<ConsentFormValues>({
    ...defaultFormValues,
    paciente: patientName ?? defaultFormValues.paciente,
  });

  const [currentStep, setCurrentStep] = useState<ConsentStep>(1);
  const [patientSignature, setPatientSignature] = useState("");
  const [doctorSignature, setDoctorSignature] = useState("");
  const [signatureTarget, setSignatureTarget] = useState<SignatureTarget>("patient");
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const selectedConsent = useMemo(
    () => consents.find((consent) => consent.id === selectedId) ?? consents[0],
    [consents, selectedId],
  );

  const totalFirmados = useMemo(
    () => consents.filter((consent) => consent.estado === "firmado").length,
    [consents],
  );

  const totalPendientesDoctor = useMemo(
    () => consents.filter((consent) => consent.estado === "pendiente_doctor").length,
    [consents],
  );

  const canContinueForm = Boolean(
    formValues.paciente &&
      formValues.doctor &&
      formValues.procedimiento &&
      formValues.fechaHora,
  );

  function openMode(nextMode: ConsentMode, id?: string) {
    const params = new URLSearchParams(location.search);

    if (nextMode === "list") {
      params.delete("mode");
      params.delete("id");
    } else {
      params.set("mode", nextMode);

      if (id) {
        params.set("id", id);
      }
    }

    navigate(
      {
        pathname: location.pathname,
        search: params.toString(),
      },
      { replace: false },
    );
  }

  function startNewConsent() {
    setFormValues({
      ...defaultFormValues,
      paciente: patientName ?? defaultFormValues.paciente,
    });

    setPatientSignature("");
    setDoctorSignature("");
    setSignatureTarget("patient");
    setCurrentStep(1);
    openMode("new");
  }

  function startEdit(consent: ConsentRecord) {
    setFormValues({
      paciente: consent.paciente,
      doctor: consent.doctor,
      procedimiento: consent.procedimiento,
      fechaHora: "2026-06-05T10:30",
      declaracion: consent.declaracion,
      riesgos: consent.riesgos,
      clausula: consent.clausula,
    });

    setPatientSignature(consent.patientSignature ?? "");
    setDoctorSignature(consent.doctorSignature ?? "");
    setSignatureTarget(consent.patientSignature ? "doctor" : "patient");
    setCurrentStep(1);
    openMode("edit", consent.id);
  }

  function updateFormValue(field: keyof ConsentFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleContinueFromForm() {
    setCurrentStep(2);
    setSignatureTarget("patient");
  }

  function handleSavePatientSignature() {
    if (!patientSignature) return;

    setDoctorSignature("");
    setCurrentStep(3);
    setSignatureTarget("doctor");
  }

  function handleSaveDoctorSignature() {
    if (!doctorSignature) return;

    const status: ConsentStatus =
      patientSignature && doctorSignature ? "firmado" : "pendiente_doctor";

    if (mode === "edit" && selectedConsent) {
      setConsents((current) =>
        current.map((consent) =>
          consent.id === selectedConsent.id
            ? {
                ...consent,
                paciente: formValues.paciente,
                procedimiento: formValues.procedimiento,
                doctor: formValues.doctor,
                fecha: formatDisplayDate(formValues.fechaHora),
                hora: formatDisplayTime(formValues.fechaHora),
                declaracion: formValues.declaracion,
                riesgos: formValues.riesgos,
                clausula: formValues.clausula,
                estado: status,
                patientSignature,
                doctorSignature,
              }
            : consent,
        ),
      );
    } else {
      const nextNumber = consents.length + 1;

      const newConsent: ConsentRecord = {
        id: `CON-${String(nextNumber).padStart(3, "0")}`,
        paciente: formValues.paciente,
        procedimiento: formValues.procedimiento,
        doctor: formValues.doctor,
        fecha: formatDisplayDate(formValues.fechaHora),
        hora: formatDisplayTime(formValues.fechaHora),
        declaracion: formValues.declaracion,
        riesgos: formValues.riesgos,
        clausula: formValues.clausula,
        estado: status,
        patientSignature,
        doctorSignature,
      };

      setConsents((current) => [newConsent, ...current]);
    }

    setCurrentStep(4);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      {mode === "list" && (
        <>
          <ConsentSearchCard
            totalConsents={consents.length}
            totalFirmados={totalFirmados}
            totalPendientesDoctor={totalPendientesDoctor}
          />

          <ConsentListTable
            consents={consents}
            onPreview={(id) => openMode("preview", id)}
            onEdit={startEdit}
            onNewConsent={startNewConsent}
          />
        </>
      )}

      {(mode === "new" || mode === "edit") && (
        <ConsentFormFlow
          isEditing={mode === "edit"}
          selectedConsent={selectedConsent}
          formValues={formValues}
          currentStep={currentStep}
          signatureTarget={signatureTarget}
          patientSignature={patientSignature}
          doctorSignature={doctorSignature}
          canContinueForm={canContinueForm}
          onFormChange={updateFormValue}
          onCancel={() => setConfirmCloseOpen(true)}
          onContinueFromForm={handleContinueFromForm}
          onPatientSignatureChange={setPatientSignature}
          onDoctorSignatureChange={setDoctorSignature}
          onStepChange={setCurrentStep}
          onSignatureTargetChange={setSignatureTarget}
          onSavePatientSignature={handleSavePatientSignature}
          onSaveDoctorSignature={handleSaveDoctorSignature}
          onFinish={() => openMode("list")}
        />
      )}

      {mode === "preview" && (
        <ConsentPreview
          selectedConsent={selectedConsent}
          onClose={() => openMode("list")}
        />
      )}

      <ConfirmModal
        open={confirmCloseOpen}
        variant="danger"
        title="Cancelar consentimiento"
        description="Se perderán los cambios del formulario y las firmas capturadas que no hayan sido guardadas."
        confirmLabel="Sí, cancelar"
        cancelLabel="Seguir editando"
        onClose={() => setConfirmCloseOpen(false)}
        onConfirm={() => {
          setConfirmCloseOpen(false);
          openMode("list");
        }}
      />
    </div>
  );
}