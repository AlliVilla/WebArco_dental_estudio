import { Clock, FileText, PenLine, ShieldCheck, UserRound, X } from "lucide-react";
import { FormSection, FullWidthField } from "../../../../../components";
import { Button, Card, Input, Select } from "../../../../../context";
import { doctorOptions, procedimientoOptions } from "./consentData";
import type { ConsentFormValues } from "./types";
import { SectionDescription } from "./SectionDescription";

interface ConsentFormStepProps {
  formValues: ConsentFormValues;
  displayConsentCode: string;
  canContinueForm: boolean;
  onChange: (field: keyof ConsentFormValues, value: string) => void;
  onCancel: () => void;
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ color: "var(--foreground)", fontSize: 13, fontWeight: 500 }}>
        {label}{" "}
        <span style={{ color: badge === "required" ? "var(--arco-danger)" : "var(--muted-foreground)", fontSize: 11 }}>
          {hint}
        </span>
      </label>
      <textarea
        readOnly={readOnly}
        value={formValues[field]}
        onChange={(event) => onChange(field, event.target.value)}
        placeholder={field === "riesgos" ? "Describe los riesgos particulares del procedimiento seleccionado..." : undefined}
        rows={rows}
        style={{
          width: "100%",
          resize: readOnly ? "none" : "vertical",
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: readOnly ? "var(--arco-gray-50)" : "var(--card)",
          color: "var(--foreground)",
          fontSize: 14,
          lineHeight: "20px",
          padding: 12,
          outlineColor: "var(--arco-primary)",
          boxSizing: "border-box",
          opacity: readOnly ? 0.92 : 1,
        }}
      />
    </div>
  );
}

export function ConsentFormStep({ formValues, displayConsentCode, canContinueForm, onChange, onCancel, onContinue }: ConsentFormStepProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <FormSection columns={2} icon={<FileText size={18} />} title="Datos del procedimiento">
        <SectionDescription>
          Selecciona el paciente, doctor responsable y procedimiento antes de continuar al flujo de firmas.
        </SectionDescription>

        <FullWidthField>
          <Input badge="required" disabled hint="Generado automáticamente por el sistema" icon={<FileText size={15} />} label="Código del consentimiento" readOnly value={displayConsentCode} />
        </FullWidthField>

        <Input badge="required" icon={<UserRound size={15} />} label="Paciente" onChange={(event) => onChange("paciente", event.target.value)} placeholder="Ej: María Fernanda López García" value={formValues.paciente} />
        <Select badge="required" label="Doctor responsable" onChange={(value) => onChange("doctor", value)} options={doctorOptions} placeholder="Selecciona..." value={formValues.doctor} />
        <Select badge="required" label="Procedimiento a realizar" onChange={(value) => onChange("procedimiento", value)} options={procedimientoOptions} placeholder="Selecciona..." value={formValues.procedimiento} />
        <Input badge="required" icon={<Clock size={15} />} label="Fecha y hora" onChange={(event) => onChange("fechaHora", event.target.value)} type="datetime-local" value={formValues.fechaHora} />
      </FormSection>

      <FormSection columns={1} icon={<ShieldCheck size={18} />} title="Texto legal y riesgos">
        <SectionDescription>
          Contenido que el paciente debe leer y comprender antes de firmar el consentimiento informado.
        </SectionDescription>

        <FullWidthField>
          <ConsentTextArea label="Declaración de veracidad médica" field="declaracion" rows={3} badge="required" hint="(predefinido, no editable)" readOnly formValues={formValues} onChange={onChange} />
        </FullWidthField>
        <FullWidthField>
          <ConsentTextArea label="Descripción de riesgos del procedimiento" field="riesgos" rows={4} badge="required" hint="(editable por doctor)" formValues={formValues} onChange={onChange} />
        </FullWidthField>
        <FullWidthField>
          <ConsentTextArea label="Cláusula de aceptación" field="clausula" rows={3} badge="required" hint="(predefinida)" readOnly formValues={formValues} onChange={onChange} />
        </FullWidthField>
      </FormSection>

      <Card style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Button variant="secondary" type="button" onClick={onCancel}>
            <X size={16} />
            Cancelar
          </Button>
          <Button type="button" disabled={!canContinueForm} onClick={onContinue}>
            <PenLine size={16} />
            Continuar a firma del paciente
          </Button>
        </div>
      </Card>
    </div>
  );
}
