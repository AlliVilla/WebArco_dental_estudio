import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Check, Save, PenLine, ShieldCheck, FileText, UserRound, Clock,
} from "lucide-react";
import { Alert, Button, Input, Select } from "../../../context";
import type { ConsentFormValues, ConsentRecord, ConsentStep, SignatureTarget } from "../types";
import { ConsentCompletedStep, ConsentSignatureStep } from "./ConsentSignatureStep";
import { useResponsive } from "../../../hooks/useWindowWidth";
import { privilegeService } from "../../patients/components/expediente/services/privilegeService"; 
import { patientService } from "../../patients/services/patientService";
import { treatmentService } from "../../treatments/services/treatmentService";
import type { UsuarioDoctor } from "../types/consentimiento";

const C = {
  primary: "#0BC5DF",
  navy: "#203F49",
  success: "#1D9E75",
  danger: "#E24B4A",
  gray50: "#F8F9FA",
  gray100: "#F1F3F4",
  gray300: "#D3D7DA",
  gray500: "#888F94",
  white: "#ffffff",
  primaryBg: "#E6F8FB",
};

const STEP_LABELS = ["Formulario", "Firma paciente", "Firma doctor", "Completado"];

function StepperBar({ step, isMobile }: { step: ConsentStep; isMobile: boolean }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.gray300}`, borderRadius: 12, padding: isMobile ? "12px 16px" : "16px 24px", display: "flex", alignItems: "center", overflowX: "auto" }}>
      {STEP_LABELS.map((label, i) => {
        const num = (i + 1) as ConsentStep;
        const done = step > num;
        const active = step === num;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEP_LABELS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: done ? C.success : active ? C.primary : C.gray100, color: done || active ? C.white : C.gray500, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
                {done ? <Check size={13} /> : num}
              </div>
              {!isMobile && (
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.navy : done ? C.success : C.gray500, whiteSpace: "nowrap" }}>
                  {label}
                </span>
              )}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: "0 10px", background: done ? C.success : C.gray300, borderRadius: 2 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    /* Eliminamos overflow: hidden para que el dropdown absolute sea visible */
    <div style={{ background: C.white, border: `1px solid ${C.gray300}`, borderRadius: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: `1px solid ${C.gray100}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: C.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: C.primary, flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
      {children}
      {required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ fontSize: 12, color: C.danger, margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>{msg}</p>;
}

function ConsentTextArea({ label, field, rows, hint, readOnly = false, formValues, onChange }: {
  label: string; field: keyof ConsentFormValues; rows: number;
  hint?: string; readOnly?: boolean;
  formValues: ConsentFormValues; onChange: (field: keyof ConsentFormValues, value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <FieldLabel>
        {label}
        {hint && <span style={{ fontSize: 11, color: C.gray500, fontWeight: 400, marginLeft: 6 }}>{hint}</span>}
      </FieldLabel>
      <textarea
        readOnly={readOnly}
        value={formValues[field]}
        onChange={(e) => onChange(field, e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={field === "riesgos" ? "Describe los riesgos particulares..." : undefined}
        rows={rows}
        style={{
          width: "100%", resize: readOnly ? "none" : "vertical",
          border: `1px solid ${focused ? C.primary : C.gray300}`, borderRadius: 8,
          background: readOnly ? C.gray50 : C.white, color: C.navy,
          fontSize: 14, lineHeight: "20px", padding: 12, outline: "none",
          boxSizing: "border-box", opacity: readOnly ? 0.9 : 1,
          boxShadow: focused ? "0 0 0 3px rgba(11,197,223,0.12)" : "none",
          transition: "border-color 0.18s, box-shadow 0.18s", fontFamily: "inherit",
        }}
      />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ConsentFormFlowProps {
  isEditing: boolean;
  selectedConsent?: ConsentRecord;
  formValues: ConsentFormValues;
  currentStep: ConsentStep;
  signatureTarget: SignatureTarget;
  patientSignature: string;
  doctorSignature: string;
  // ↓ nuevo: id del doctor seleccionado para enviarlo a la API
  selectedDoctorId: number | null;
  selectedPatientId: number | null;
  onPatientIdChange: (id: number | null) => void;
  onDoctorIdChange: (id: number) => void;
  onFormChange: (field: keyof ConsentFormValues, value: string) => void;
  onCancel: () => void;
  onContinueFromForm: () => void;
  onSaveWithoutSignatures: () => void;
  onSkipToFinish: () => void;
  onPatientSignatureChange: (value: string) => void;
  onDoctorSignatureChange: (value: string) => void;
  onStepChange: (step: ConsentStep) => void;
  onSignatureTargetChange: (target: SignatureTarget) => void;
  onSavePatientSignature: () => void;
  onSaveDoctorSignature: () => void;
  onFinish: () => void;
}

export function ConsentFormFlow({
  isEditing, selectedConsent, formValues, currentStep, signatureTarget, 
  patientSignature, doctorSignature, selectedDoctorId, selectedPatientId,
  onPatientIdChange, onDoctorIdChange,
  onFormChange, onCancel, onContinueFromForm, onSaveWithoutSignatures,
  onSkipToFinish, onPatientSignatureChange, onDoctorSignatureChange,
  onStepChange, onSignatureTargetChange, onSavePatientSignature,
  onSaveDoctorSignature, onFinish,
}: ConsentFormFlowProps) {
  const { isMobile } = useResponsive();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [signatureError, setSignatureError] = useState("");

  // ─── Carga de doctores (igual que NuevaConsulta) ──────────────────────────
  const [doctores, setDoctores] = useState<UsuarioDoctor[]>([]);
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    privilegeService.getAllDoctores().then((response) => {
      const list: UsuarioDoctor[] = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      setDoctores(list);
      // Selecciona el primero por defecto si no hay ninguno seleccionado
      if (list.length > 0 && !selectedDoctorId) {
        onDoctorIdChange(list[0].id_usuario);
      }
    });

    // Carga de tratamientos para los checkboxes
    treatmentService.getAll({ activo: "true" }).then((res) => {
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data;
        setTreatments(list || []);
      }
    });
  }, []);

  // ─── Búsqueda de pacientes ──────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Solo buscar si hay texto y el dropdown está abierto
      if (!formValues.paciente || formValues.paciente.length < 2 || !showDropdown || selectedPatientId) {
        setPatientResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Usamos el servicio de pacientes con el filtro por nombre
        const res = await patientService.getAll({ 
          nombre: formValues.paciente, 
          limit: 6 
        });
        if (res.success) {
          // Si la API es paginada, los datos vienen en res.data.data
          // Si es un array simple, viene en res.data
          const results = Array.isArray(res.data) ? res.data : (res.data as any)?.data;
          setPatientResults(results || []);
        }
      } catch (err) {
        console.error("Error buscando pacientes:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formValues.paciente, showDropdown, selectedPatientId]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Opciones para el Select del contexto (label/value)
  const doctorSelectOptions = doctores.map((d) => ({
    label: `${d.sexo === "M" ? "Dr." : "Dra."} ${d.primer_nombre} ${d.primer_apellido}`,
    value: String(d.id_usuario),
  }));

  const canSaveSignature = signatureTarget === "patient" ? Boolean(patientSignature) : Boolean(doctorSignature);
  const displayConsentCode = isEditing && selectedConsent ? selectedConsent.id : "Se generará al guardar";

  // Verificamos si la firma ya existía en el registro original para bloquear edición
  const isAlreadySigned = signatureTarget === "patient" 
    ? !!selectedConsent?.patientSignature 
    : !!selectedConsent?.doctorSignature;

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formValues.paciente.trim()) errors.paciente = "El nombre del paciente es obligatorio";
    if (!selectedPatientId) errors.paciente = "Debes seleccionar un paciente de la lista";
    if (!selectedDoctorId) errors.doctor = "Selecciona un doctor responsable";
    if (!formValues.procedimiento) errors.procedimiento = "Selecciona el procedimiento";
    if (!formValues.fechaHora) errors.fechaHora = "La fecha y hora son obligatorias";
    return errors;
  };

  const scrollToFirstError = () => {
    setTimeout(() => {
      const first = document.querySelector<HTMLElement>("[data-field-error]");
      if (first) window.scrollTo({ top: window.scrollY + first.getBoundingClientRect().top - 100, behavior: "smooth" });
    }, 0);
  };

  const handleContinue = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); scrollToFirstError(); return; }
    setFieldErrors({});
    onContinueFromForm();
  };

  const handleSaveWithoutSigs = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); scrollToFirstError(); return; }
    setFieldErrors({});
    onSaveWithoutSignatures();
  };

  const handleSaveSignature = () => {
    if (!canSaveSignature) {
      setSignatureError(signatureTarget === "patient" ? "El paciente debe firmar antes de continuar." : "El doctor debe firmar antes de guardar.");
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
    else if (currentStep === 3) { onStepChange(2); onSignatureTargetChange("patient"); }
  };

  const cols2 = isMobile ? "1fr" : "1fr 1fr";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 16 : 20 }}>
      {currentStep !== 4 && (
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: C.gray500, fontSize: 13, fontWeight: 500, padding: 0, width: "fit-content" }}>
          <ArrowLeft size={16} />
          {currentStep === 1 ? "Volver al listado" : "Volver"}
        </button>
      )}

      <StepperBar step={currentStep} isMobile={isMobile} />

      {signatureError && <Alert variant="error" message={signatureError} onClose={() => setSignatureError("")} />}

      {/* ── STEP 1: Formulario ── */}
      {currentStep === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20 }}>
          <SectionCard icon={<FileText size={17} />} title="Datos del procedimiento">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <FieldLabel>Código del consentimiento</FieldLabel>
                <Input disabled readOnly value={displayConsentCode} hint="Generado automáticamente" icon={<FileText size={15} />} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: cols2, gap: 14 }}>

                {/* Paciente — Autocomplete */}
                <div ref={dropdownRef} style={{ position: "relative" }} {...(fieldErrors.paciente ? { "data-field-error": true } : {})}>
                  <FieldLabel required>Paciente</FieldLabel>
                  <Input
                    icon={<UserRound size={15} />}
                    placeholder="Buscar por nombre o identidad..."
                    value={formValues.paciente}
                    onChange={(e) => { 
                      onFormChange("paciente", e.target.value); 
                      setFieldErrors((p) => ({ ...p, paciente: "" }));
                      if (selectedPatientId) onPatientIdChange(null); // Resetear ID si el usuario escribe
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    error={fieldErrors.paciente}
                    hint={isSearching ? "Buscando..." : undefined}
                  />
                  {showDropdown && patientResults.length > 0 && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100,
                      background: C.white, border: `1px solid ${C.gray300}`, borderRadius: 8,
                      marginTop: 4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 240, overflowY: "auto"
                    }}>
                      {patientResults.map(p => (
                        <div 
                          key={p.id_persona}
                          onClick={() => {
                            const fullName = [p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido].filter(Boolean).join(" ");
                            onFormChange("paciente", fullName);
                            onPatientIdChange(p.id_persona);
                            setShowDropdown(false);
                            setPatientResults([]);
                          }}
                          style={{ 
                            padding: "10px 12px", cursor: "pointer", borderBottom: `1px solid ${C.gray100}`,
                            transition: "background 0.15s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = C.gray50}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                            {p.primer_nombre} {p.primer_apellido}
                          </div>
                          <div style={{ fontSize: 11, color: C.gray500 }}>
                            Identidad: {p.numero_identidad}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <FieldError msg={fieldErrors.paciente} />
                </div>

                {/* Doctor — select con datos reales de la API */}
                <div {...(fieldErrors.doctor ? { "data-field-error": true } : {})}>
                  <FieldLabel required>Doctor responsable</FieldLabel>
                  {doctores.length === 0 ? (
                    <div style={{ fontSize: 13, color: C.gray500, padding: "10px 0" }}>Cargando doctores...</div>
                  ) : (
                    <select
                      value={selectedDoctorId ?? ""}
                      onChange={(e) => {
                        onDoctorIdChange(Number(e.target.value));
                        setFieldErrors((p) => ({ ...p, doctor: "" }));
                      }}
                      style={{
                        width: "100%", height: 42, padding: "0 12px",
                        border: `1px solid ${fieldErrors.doctor ? C.danger : C.gray300}`,
                        borderRadius: 8, fontSize: 13, color: C.navy,
                        background: C.white, outline: "none", cursor: "pointer",
                      }}
                    >
                      <option value="" disabled>Selecciona un doctor...</option>
                      {doctorSelectOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  )}
                  <FieldError msg={fieldErrors.doctor} />
                </div>

                {/* Procedimiento */}
                <div {...(fieldErrors.procedimiento ? { "data-field-error": true } : {})}>
                  <FieldLabel required>Procedimiento a realizar</FieldLabel>
                  <Select
                    placeholder={treatments.length === 0 ? "Cargando..." : "Selecciona un procedimiento..."}
                    value={formValues.procedimiento}
                    onChange={(v) => { 
                      onFormChange("procedimiento", v); 
                      setFieldErrors((p) => ({ ...p, procedimiento: "" })); 
                    }}
                    options={treatments.map((t) => ({
                      label: t.nombre,
                      value: t.nombre,
                    }))}
                    error={fieldErrors.procedimiento}
                  />
                  <FieldError msg={fieldErrors.procedimiento} />
                </div>

                {/* Fecha */}
                <div {...(fieldErrors.fechaHora ? { "data-field-error": true } : {})}>
                  <FieldLabel required>Fecha y hora</FieldLabel>
                  <Input
                    type="datetime-local"
                    icon={<Clock size={15} />}
                    value={formValues.fechaHora}
                    onChange={(e) => { onFormChange("fechaHora", e.target.value); setFieldErrors((p) => ({ ...p, fechaHora: "" })); }}
                    error={fieldErrors.fechaHora}
                  />
                  <FieldError msg={fieldErrors.fechaHora} />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={<ShieldCheck size={17} />} title="Texto legal y riesgos">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <ConsentTextArea label="Declaración de veracidad médica" field="declaracion" rows={3} hint="(predefinido, no editable)" readOnly formValues={formValues} onChange={onFormChange} />
              <ConsentTextArea label="Descripción de riesgos" field="riesgos" rows={4} hint="(editable por doctor)" formValues={formValues} onChange={onFormChange} />
              <ConsentTextArea label="Cláusula de aceptación" field="clausula" rows={3} hint="(predefinida)" readOnly formValues={formValues} onChange={onFormChange} />
            </div>
          </SectionCard>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4, flexWrap: "wrap" }}>
            <Button type="button" variant="secondary" onClick={handleSaveWithoutSigs} style={{ width: isMobile ? "100%" : undefined }}>
              Guardar sin firmas
            </Button>
            <Button type="button" onClick={handleContinue} style={{ width: isMobile ? "100%" : undefined }}>
              <PenLine size={16} /> Continuar a firma del paciente
            </Button>
          </div>
        </div>
      )}

      {/* ── STEPS 2 y 3: Firmas ── */}
      {(currentStep === 2 || currentStep === 3) && (
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 14 : 20 }}>
          <ConsentSignatureStep
            formValues={formValues}
            signatureTarget={signatureTarget}
            patientSignature={patientSignature}
            doctorSignature={doctorSignature}
            readOnly={isAlreadySigned}
            onPatientSignatureChange={onPatientSignatureChange}
            onDoctorSignatureChange={onDoctorSignatureChange}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <Button type="button" variant="secondary" onClick={() => { setSignatureError(""); if (currentStep === 2) { onStepChange(3); onSignatureTargetChange("doctor"); } else { onSkipToFinish(); } }} style={{ width: isMobile ? "100%" : undefined }}>
              {isAlreadySigned ? "Continuar" : "Omitir"}
            </Button>
            {!isAlreadySigned && (
              <Button type="button" onClick={handleSaveSignature} style={{ width: isMobile ? "100%" : undefined }}>
                <Save size={16} />
                {isMobile ? "Guardar firma" : signatureTarget === "patient" ? "Guardar firma del paciente" : "Guardar firma del doctor"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 4: Completado ── */}
      {currentStep === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ConsentCompletedStep />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button type="button" onClick={onFinish}>Volver al listado</Button>
          </div>
        </div>
      )}
    </div>
  );
}