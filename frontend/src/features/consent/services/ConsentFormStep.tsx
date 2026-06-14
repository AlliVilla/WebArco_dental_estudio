import { useState } from "react";
import { Clock, FileText, PenLine, ShieldCheck, UserRound } from "lucide-react";
import { FormSection, FullWidthField } from "../../../components";
import { Button, Card, Input, Select } from "../../../context";
import { doctorOptions, procedimientoOptions } from "./consentData";
import type { ConsentFormValues } from "../types";
import { SectionDescription } from "./SectionDescription";
import { useResponsive } from "../../../hooks/useWindowWidth";

interface ConsentFormStepProps {
  formValues: ConsentFormValues;
  displayConsentCode: string;
  fieldErrors: Record<string, string>;
  onClearError: (field: string) => void;
  onChange: (field: keyof ConsentFormValues, value: string) => void;
  onContinue: () => void;
}

function ConsentTextArea({
  label,
  field,
  rows,
  badge,
  hint,
  readOnly = false,
  formValues,
  onChange,
}: {
  label: string;
  field: keyof ConsentFormValues;
  rows: number;
  badge: "required" | "optional";
  hint?: string;
  readOnly?: boolean;
  formValues: ConsentFormValues;
  onChange: (field: keyof ConsentFormValues, value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 500 }}
      >
        {label}{" "}
        <span
          style={{
            color:
              badge === "required"
                ? "var(--arco-danger)"
                : "var(--muted-foreground)",
            fontSize: 11,
          }}
        >
          {hint}
        </span>
      </label>
      <textarea
        readOnly={readOnly}
        value={formValues[field]}
        onChange={(e) => onChange(field, e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={
          field === "riesgos"
            ? "Describe los riesgos particulares del procedimiento seleccionado..."
            : undefined
        }
        rows={rows}
        style={{
          width: "100%",
          resize: readOnly ? "none" : "vertical",
          border: `1px solid ${focused ? "#0BC5DF" : "#D3D7DA"}`,
          borderRadius: 8,
          background: readOnly ? "var(--arco-gray-50)" : "var(--card)",
          color: "var(--foreground)",
          fontSize: 14,
          lineHeight: "20px",
          padding: 12,
          outline: "none",
          boxSizing: "border-box",
          opacity: readOnly ? 0.92 : 1,
          transition: "border-color 0.18s ease, box-shadow 0.18s ease",
          boxShadow: focused ? "0 0 0 3px rgba(11,197,223,0.12)" : "none",
        }}
      />
    </div>
  );
}

export function ConsentFormStep({
  formValues,
  displayConsentCode,
  fieldErrors,
  onClearError,
  onChange,
  onContinue,
}: ConsentFormStepProps) {
  const { isMobile } = useResponsive();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <FormSection
        columns={isMobile ? 1 : 2}
        icon={<FileText size={18} />}
        title="Datos del procedimiento"
      >
        <SectionDescription>
          Selecciona el paciente, doctor responsable y procedimiento antes de
          continuar al flujo de firmas.
        </SectionDescription>
        <FullWidthField>
          <Input
            badge="required"
            disabled
            hint="Generado automáticamente por el sistema"
            icon={<FileText size={15} />}
            label="Código del consentimiento"
            readOnly
            value={displayConsentCode}
          />
        </FullWidthField>

        {/* Paciente */}
        <div {...(fieldErrors.paciente ? { "data-field-error": true } : {})}>
          <Input
            badge="required"
            icon={<UserRound size={15} />}
            label="Paciente"
            onChange={(e) => {
              onChange("paciente", e.target.value);
              onClearError("paciente");
            }}
            placeholder="Ej: María Fernanda López García"
            value={formValues.paciente}
            error={fieldErrors.paciente}
          />
        </div>

        {/* Doctor */}
        <div {...(fieldErrors.doctor ? { "data-field-error": true } : {})}>
          <Select
            badge="required"
            label="Doctor responsable"
            onChange={(v) => {
              onChange("doctor", v);
              onClearError("doctor");
            }}
            options={doctorOptions}
            placeholder="Selecciona..."
            value={formValues.doctor}
            error={fieldErrors.doctor}
          />
        </div>

        {/* Procedimiento */}
        <div
          {...(fieldErrors.procedimiento ? { "data-field-error": true } : {})}
        >
          <Select
            badge="required"
            label="Procedimiento a realizar"
            onChange={(v) => {
              onChange("procedimiento", v);
              onClearError("procedimiento");
            }}
            options={procedimientoOptions}
            placeholder="Selecciona..."
            value={formValues.procedimiento}
            error={fieldErrors.procedimiento}
          />
        </div>

        {/* Fecha */}
        <div {...(fieldErrors.fechaHora ? { "data-field-error": true } : {})}>
          <Input
            badge="required"
            icon={<Clock size={15} />}
            label="Fecha y hora"
            onChange={(e) => {
              onChange("fechaHora", e.target.value);
              onClearError("fechaHora");
            }}
            type="datetime-local"
            value={formValues.fechaHora}
            error={fieldErrors.fechaHora}
          />
        </div>
      </FormSection>

      <FormSection
        columns={1}
        icon={<ShieldCheck size={18} />}
        title="Texto legal y riesgos"
      >
        <SectionDescription>
          Contenido que el paciente debe leer y comprender antes de firmar el
          consentimiento informado.
        </SectionDescription>
        <FullWidthField>
          <ConsentTextArea
            label="Declaración de veracidad médica"
            field="declaracion"
            rows={3}
            badge="required"
            hint="(predefinido, no editable)"
            readOnly
            formValues={formValues}
            onChange={onChange}
          />
        </FullWidthField>
        <FullWidthField>
          <ConsentTextArea
            label="Descripción de riesgos del procedimiento"
            field="riesgos"
            rows={4}
            badge="required"
            hint="(editable por doctor)"
            formValues={formValues}
            onChange={onChange}
          />
        </FullWidthField>
        <FullWidthField>
          <ConsentTextArea
            label="Cláusula de aceptación"
            field="clausula"
            rows={3}
            badge="required"
            hint="(predefinida)"
            readOnly
            formValues={formValues}
            onChange={onChange}
          />
        </FullWidthField>
      </FormSection>

      <Card style={{ padding: "16px 20px" }}>
        <Button
          type="button"
          onClick={onContinue}
          style={{ width: isMobile ? "100%" : undefined }}
        >
          <PenLine size={16} /> Continuar a firma del paciente
        </Button>
      </Card>
    </div>
  );
}
