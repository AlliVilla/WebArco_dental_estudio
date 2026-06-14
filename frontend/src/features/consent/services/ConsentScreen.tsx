import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ConfirmModal } from "../../../components";
import { useTheme } from "../../../context";
import { useResponsive } from "../../../hooks/useWindowWidth";
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
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const mode = (searchParams.get("mode") as ConsentMode | null) ?? "list";
  const selectedId = searchParams.get("id");
  const patientNameFromQuery = searchParams.get("patientName") ?? undefined;

  const [consents, setConsents] = useState<ConsentRecord[]>(initialConsents);
  const [formValues, setFormValues] = useState<ConsentFormValues>({
    ...defaultFormValues,
    paciente: patientNameFromQuery ?? patientName ?? defaultFormValues.paciente,
  });
  const [currentStep, setCurrentStep] = useState<ConsentStep>(1);
  const [patientSignature, setPatientSignature] = useState("");
  const [doctorSignature, setDoctorSignature] = useState("");
  const [signatureTarget, setSignatureTarget] =
    useState<SignatureTarget>("patient");
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const selectedConsent = useMemo(
    () => consents.find((c) => c.id === selectedId) ?? consents[0],
    [consents, selectedId]
  );

  const totalFirmados = useMemo(
    () => consents.filter((c) => c.estado === "firmado").length,
    [consents]
  );

  const totalPendientesDoctor = useMemo(
    () => consents.filter((c) => c.estado === "pendiente_doctor").length,
    [consents]
  );

  // ─── Navegación por URL ───────────────────────────────────────────────────
  function openMode(nextMode: ConsentMode, id?: string) {
    const params = new URLSearchParams(location.search);
    if (nextMode === "list") {
      params.delete("mode");
      params.delete("id");
    } else {
      params.set("mode", nextMode);
      if (id) params.set("id", id);
    }
    navigate(
      { pathname: location.pathname, search: params.toString() },
      { replace: false }
    );
  }

  // ─── Helpers de construcción de registro ─────────────────────────────────
  function buildNewRecord(estado: ConsentStatus): ConsentRecord {
    return {
      id: `CON-${String(consents.length + 1).padStart(3, "0")}`,
      paciente: formValues.paciente,
      procedimiento: formValues.procedimiento,
      doctor: formValues.doctor,
      fecha: formatDisplayDate(formValues.fechaHora),
      hora: formatDisplayTime(formValues.fechaHora),
      declaracion: formValues.declaracion,
      riesgos: formValues.riesgos,
      clausula: formValues.clausula,
      estado,
      patientSignature,
      doctorSignature,
    };
  }

  function buildEditedRecord(
    existing: ConsentRecord,
    estado: ConsentStatus
  ): ConsentRecord {
    return {
      ...existing,
      paciente: formValues.paciente,
      procedimiento: formValues.procedimiento,
      doctor: formValues.doctor,
      fecha: formatDisplayDate(formValues.fechaHora),
      hora: formatDisplayTime(formValues.fechaHora),
      declaracion: formValues.declaracion,
      riesgos: formValues.riesgos,
      clausula: formValues.clausula,
      estado,
      patientSignature,
      doctorSignature,
    };
  }

  function saveRecord(estado: ConsentStatus) {
    if (mode === "edit" && selectedConsent) {
      setConsents((prev) =>
        prev.map((c) =>
          c.id === selectedConsent.id ? buildEditedRecord(c, estado) : c
        )
      );
    } else {
      setConsents((prev) => [buildNewRecord(estado), ...prev]);
    }
    setCurrentStep(4);
  }

  // ─── Acciones del formulario ──────────────────────────────────────────────
  function startNewConsent() {
    setFormValues({
      ...defaultFormValues,
      paciente:
        patientNameFromQuery ?? patientName ?? defaultFormValues.paciente,
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
      fechaHora:
        (consent.fechaHora as string | undefined) ??
        new Date().toISOString().slice(0, 16),
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
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }

  // ─── Flujo de pasos ───────────────────────────────────────────────────────
  function handleContinueFromForm() {
    setCurrentStep(2);
    setSignatureTarget("patient");
  }

  // Guardar desde step 1 sin pasar por firmas
  function handleSaveWithoutSignatures() {
    saveRecord("pendiente_paciente");
  }

  // Firma del paciente guardada — avanzar al doctor
  function handleSavePatientSignature() {
    if (!patientSignature) return;
    setDoctorSignature("");
    setCurrentStep(3);
    setSignatureTarget("doctor");
  }

  // Firma del doctor guardada — calcular estado y guardar
  function handleSaveDoctorSignature() {
    if (!doctorSignature) return;
    const estado: ConsentStatus =
      patientSignature && doctorSignature ? "firmado" : "pendiente_doctor";
    saveRecord(estado);
  }

  // Omitir firma (step 2 o 3) sin firmar
  function handleSkipToFinish() {
    const estado: ConsentStatus = patientSignature
      ? "pendiente_doctor"
      : "pendiente_paciente";
    saveRecord(estado);
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 24,
        width: "100%",
      }}
    >
      {/* Flecha volver al perfil — solo si viene desde un paciente */}
      {patientNameFromQuery && (
        <button
          onClick={() => navigate(-1)}
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
          <ArrowLeft size={16} /> Volver al perfil
        </button>
      )}

      {/* Lista */}
      {mode === "list" && (
        <>
          <ConsentSearchCard
            totalConsents={consents.length}
            totalFirmados={totalFirmados}
            totalPendientesDoctor={totalPendientesDoctor}
            consents={consents}
          />
          <ConsentListTable
            consents={consents}
            onPreview={(id) => openMode("preview", id)}
            onEdit={startEdit}
            onNewConsent={startNewConsent}
          />
        </>
      )}

      {/* Formulario nuevo / edición */}
      {(mode === "new" || mode === "edit") && (
        <ConsentFormFlow
          isEditing={mode === "edit"}
          selectedConsent={selectedConsent}
          formValues={formValues}
          currentStep={currentStep}
          signatureTarget={signatureTarget}
          patientSignature={patientSignature}
          doctorSignature={doctorSignature}
          onFormChange={updateFormValue}
          onCancel={() => setConfirmCloseOpen(true)}
          onContinueFromForm={handleContinueFromForm}
          onSaveWithoutSignatures={handleSaveWithoutSignatures}
          onSkipToFinish={handleSkipToFinish}
          onPatientSignatureChange={setPatientSignature}
          onDoctorSignatureChange={setDoctorSignature}
          onStepChange={setCurrentStep}
          onSignatureTargetChange={setSignatureTarget}
          onSavePatientSignature={handleSavePatientSignature}
          onSaveDoctorSignature={handleSaveDoctorSignature}
          onFinish={() => openMode("list")}
        />
      )}

      {/* Vista previa */}
      {mode === "preview" && (
        <ConsentPreview
          selectedConsent={selectedConsent}
          onClose={() => openMode("list")}
        />
      )}

      {/* Modal de confirmación al cancelar */}
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
