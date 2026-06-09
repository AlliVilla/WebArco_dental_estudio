import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  ClipboardList,
  Hash,
  IdCard,
  Mail,
  Phone,
  Save,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { Alert, Button, Card, FieldBadge, Input, Select } from "../../../context";
import api from "../../../services/api";

type BadgeType = "required" | "optional" | "conditional";

type PatientPayload = {
  numero_identidad: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento: string;
  telefono: string;
  correo_electronico?: string;
  id_municipio: number;
  direccion_linea?: string;
  sexo: "M" | "F";
};

type PersonaDetail = {
  id_persona: number;
  numero_identidad: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  fecha_nacimiento: string;
  telefono: string;
  correo_electronico?: string | null;
  id_municipio: number;
  direccion_linea?: string | null;
  sexo: "M" | "F";
  municipio?: {
    id_municipio: number;
    id_departamento: number;
    departamento?: {
      id_departamento: number;
    };
  };
};

const DEPARTAMENTOS = [
  { value: "2", label: "Choluteca" },
  { value: "6", label: "Cortés" },
  { value: "8", label: "Francisco Morazán" },
  { value: "10", label: "Intibucá" },
  { value: "15", label: "Olancho" },
  { value: "16", label: "Santa Bárbara" },
];

const MUNICIPIOS: Record<string, { value: string; label: string }[]> = {
  "2": [
    { value: "9", label: "Choluteca" },
    { value: "14", label: "El Triunfo" },
    { value: "23", label: "San Marcos de Colón" },
  ],
  "6": [
    { value: "79", label: "San Pedro Sula" },
    { value: "80", label: "Choloma" },
    { value: "89", label: "Villanueva" },
    { value: "90", label: "La Lima" },
  ],
  "8": [
    { value: "110", label: "Tegucigalpa" },
    { value: "118", label: "Lepaterique" },
    { value: "132", label: "Santa Lucía" },
    { value: "135", label: "Valle de Ángeles" },
  ],
  "10": [
    { value: "144", label: "La Esperanza" },
    { value: "149", label: "Intibucá" },
    { value: "150", label: "Jesús de Otoro" },
  ],
  "15": [
    { value: "228", label: "Juticalpa" },
    { value: "230", label: "Catacamas" },
    { value: "250", label: "Patuca" },
  ],
  "16": [
    { value: "251", label: "Santa Bárbara" },
    { value: "262", label: "Las Vegas" },
    { value: "278", label: "Trinidad" },
  ],
};

const ENFERMEDADES = [
  { id: "diabetes", label: "Diabetes" },
  { id: "hipertension", label: "Hipertensión" },
  { id: "cardiopatias", label: "Cardiopatías" },
  { id: "epoc", label: "EPOC" },
  { id: "hepatitis", label: "Hepatitis" },
  { id: "cancer", label: "Cáncer" },
  { id: "osteoporosis", label: "Osteoporosis" },
  { id: "renal", label: "Enfermedad renal" },
  { id: "inmunologica", label: "Enfermedad hepática" },
  { id: "otras", label: "Otras" },
];

function SectionHeader({
  icon,
  subtitle,
  title,
}: {
  icon: ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 10, marginBottom: 20 }}>
      <div
        style={{
          alignItems: "center",
          background: "rgba(11,197,223,0.1)",
          borderRadius: 8,
          color: "var(--arco-primary)",
          display: "flex",
          flexShrink: 0,
          height: 36,
          justifyContent: "center",
          width: 36,
        }}
      >
        {icon}
      </div>
      <div>
        <h3
          style={{
            color: "var(--arco-navy)",
            fontSize: 15,
            fontWeight: 600,
            margin: 0,
          }}
        >
          {title}
        </h3>
        {subtitle ? (
          <p
            style={{
              color: "var(--arco-gray-500)",
              fontSize: 12,
              margin: "2px 0 0",
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Textarea({
  badge,
  disabled,
  hint,
  label,
  onChange,
  placeholder,
  rows = 3,
  value,
}: {
  badge?: BadgeType;
  disabled?: boolean;
  hint?: string;
  label?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label || badge ? (
        <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
          {label ? (
            <label style={{ color: "var(--arco-navy)", fontSize: 13, fontWeight: 500 }}>
              {label}
            </label>
          ) : null}
          {badge ? <FieldBadge type={badge} /> : null}
        </div>
      ) : null}
      <textarea
        disabled={disabled}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange?.(event.target.value)}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        rows={rows}
        value={value}
        style={{
          background: disabled ? "#F1F3F4" : "#FFFFFF",
          border: `1px solid ${focused ? "#0BC5DF" : "#D3D7DA"}`,
          borderRadius: 8,
          boxShadow: focused ? "0 0 0 3px rgba(11,197,223,0.12)" : "none",
          color: "#203F49",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 14,
          minHeight: rows * 38,
          outline: "none",
          padding: "10px 12px",
          resize: "vertical",
          transition: "border-color 0.15s, box-shadow 0.15s",
          width: "100%",
        }}
      />
      {hint ? <span style={{ color: "var(--arco-gray-500)", fontSize: 11 }}>{hint}</span> : null}
    </div>
  );
}

function CheckboxGroup({
  badge,
  label,
  onChange,
  options,
  selected,
}: {
  badge?: BadgeType;
  label?: string;
  onChange: (ids: string[]) => void;
  options: { id: string; label: string }[];
  selected: string[];
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label || badge ? (
        <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
          {label ? (
            <label style={{ color: "var(--arco-navy)", fontSize: 13, fontWeight: 500 }}>
              {label}
            </label>
          ) : null}
          {badge ? <FieldBadge type={badge} /> : null}
        </div>
      ) : null}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #0BC5DF",
          borderRadius: 8,
          display: "flex",
          flexWrap: "wrap",
          gap: "10px 24px",
          padding: "10px 14px",
        }}
      >
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              onClick={() => toggle(option.id)}
              style={{
                alignItems: "center",
                cursor: "pointer",
                display: "flex",
                gap: 7,
                userSelect: "none",
              }}
            >
              <span
                style={{
                  alignItems: "center",
                  background: checked ? "#0BC5DF" : "#FFFFFF",
                  border: `2px solid ${checked ? "#0BC5DF" : "#D3D7DA"}`,
                  borderRadius: 4,
                  display: "flex",
                  flexShrink: 0,
                  height: 16,
                  justifyContent: "center",
                  transition: "all 0.15s",
                  width: 16,
                }}
              >
                {checked ? (
                  <svg fill="none" height="7" viewBox="0 0 9 7" width="9">
                    <path
                      d="M1 3.5L3.5 6L8 1"
                      stroke="white"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                ) : null}
              </span>
              <span style={{ color: "#203F49", fontSize: 13 }}>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function RadioGroup({
  badge,
  label,
  onChange,
  options,
  value,
}: {
  badge?: BadgeType;
  label?: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  value: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label || badge ? (
        <div style={{ alignItems: "center", display: "flex", gap: 6 }}>
          {label ? (
            <label style={{ color: "var(--arco-navy)", fontSize: 13, fontWeight: 500 }}>
              {label}
            </label>
          ) : null}
          {badge ? <FieldBadge type={badge} /> : null}
        </div>
      ) : null}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #D3D7DA",
          borderRadius: 8,
          display: "flex",
          gap: 16,
          padding: "10px 14px",
        }}
      >
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              onClick={() => onChange(option.value)}
              style={{
                alignItems: "center",
                cursor: "pointer",
                display: "flex",
                gap: 7,
                userSelect: "none",
              }}
            >
              <span
                style={{
                  alignItems: "center",
                  background: "#FFFFFF",
                  border: `2px solid ${checked ? "#0BC5DF" : "#D3D7DA"}`,
                  borderRadius: "50%",
                  display: "flex",
                  flexShrink: 0,
                  height: 16,
                  justifyContent: "center",
                  transition: "all 0.15s",
                  width: 16,
                }}
              >
                {checked ? (
                  <span
                    style={{
                      background: "#0BC5DF",
                      borderRadius: "50%",
                      height: 8,
                      width: 8,
                    }}
                  />
                ) : null}
              </span>
              <span style={{ color: "#203F49", fontSize: 13 }}>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function PatientFormScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const patientId = id ? Number(id) : null;
  const isEditMode = Boolean(patientId);

  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [firstLastName, setFirstLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [enfermedades, setEnfermedades] = useState<string[]>([]);
  const [otrasDescription, setOtrasDescription] = useState("");
  const [medicamentos, setMedicamentos] = useState("");
  const [alergias, setAlergias] = useState("");
  const [anestesiaReaction, setAnestesiaReaction] = useState("no");
  const [lastVisitDate, setLastVisitDate] = useState("");
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);

  const generatedCode = useMemo(() => `PAC-${String(Math.floor(Math.random() * 900) + 100).padStart(6, "0")}`, []);
  const autoCode = isEditMode && patientId ? `PAC-${String(patientId).padStart(6, "0")}` : generatedCode;
  const municipioOptions = departamento ? MUNICIPIOS[departamento] ?? [] : [];
  const otrasChecked = enfermedades.includes("otras");

  useEffect(() => {
    if (!birthDate) {
      setAge("");
      return;
    }

    const today = new Date();
    const birth = new Date(birthDate);
    let years = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      years -= 1;
    }

    setAge(years >= 0 ? String(years) : "");
  }, [birthDate]);

  useEffect(() => {
    if (patientId) {
      void loadPatient(patientId);
    }
  }, [patientId]);

  const handleDepartamentoChange = (value: string) => {
    setDepartamento(value);
    setMunicipio("");
  };

  const getDepartamentoFromPersona = (persona: PersonaDetail) => {
    const departamentoId =
      persona.municipio?.id_departamento ??
      persona.municipio?.departamento?.id_departamento;

    if (departamentoId) return String(departamentoId);

    const match = Object.entries(MUNICIPIOS).find(([, municipios]) =>
      municipios.some((option) => Number(option.value) === persona.id_municipio),
    );

    return match?.[0] ?? "";
  };

  const loadPatient = async (currentPatientId: number) => {
    try {
      setIsLoadingPatient(true);
      setSaveStatus("idle");
      const response = await api.get<PersonaDetail>(`/persona/${currentPatientId}`);
      const persona = response.data;

      setFirstName(persona.primer_nombre ?? "");
      setSecondName(persona.segundo_nombre ?? "");
      setFirstLastName(persona.primer_apellido ?? "");
      setSecondLastName(persona.segundo_apellido ?? "");
      setIdentityNumber(persona.numero_identidad ?? "");
      setBirthDate((persona.fecha_nacimiento ?? "").slice(0, 10));
      setSex(persona.sexo ?? "");
      setDepartamento(getDepartamentoFromPersona(persona));
      setMunicipio(String(persona.id_municipio ?? ""));
      setPhone(persona.telefono ?? "");
      setEmail(persona.correo_electronico ?? "");
    } catch (error) {
      const apiError = error as { message?: string };
      setSaveStatus("error");
      setMessage(apiError.message ?? "No se pudo cargar el paciente.");
    } finally {
      setIsLoadingPatient(false);
    }
  };

  const handleSave = async () => {
    const identityDigits = identityNumber.replace(/\D/g, "");
    const requiredFilled =
      firstName &&
      firstLastName &&
      identityDigits.length === 13 &&
      birthDate &&
      sex &&
      municipio &&
      phone;

    if (!requiredFilled) {
      setSaveStatus("error");
      setMessage("Completa los campos requeridos. La identidad debe tener 13 dígitos.");
      return;
    }

    const payload: PatientPayload = {
      numero_identidad: identityDigits,
      primer_nombre: firstName.trim(),
      segundo_nombre: secondName.trim() || undefined,
      primer_apellido: firstLastName.trim(),
      segundo_apellido: secondLastName.trim() || undefined,
      fecha_nacimiento: birthDate,
      telefono: phone.trim(),
      correo_electronico: email.trim() || undefined,
      id_municipio: Number(municipio),
      sexo: sex as "M" | "F",
    };

    try {
      setIsSaving(true);
      if (isEditMode && patientId) {
        await api.put(`/persona/${patientId}`, payload);
      } else {
        await api.post("/persona", payload);
      }
      setSaveStatus("success");
      setMessage(isEditMode ? "Paciente actualizado correctamente." : "Paciente guardado correctamente.");
      setTimeout(() => navigate("/patients/list"), 900);
    } catch (error) {
      const apiError = error as { message?: string };
      setSaveStatus("error");
      setMessage(apiError.message ?? "No se pudo guardar el paciente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 980 }}>
      {saveStatus !== "idle" ? (
        <Alert
          message={message}
          onClose={() => setSaveStatus("idle")}
          variant={saveStatus === "success" ? "success" : "error"}
        />
      ) : null}

      {isLoadingPatient ? <Alert message="Cargando datos del paciente..." variant="info" /> : null}

      <Card>
        <SectionHeader
          icon={<User size={18} />}
          subtitle="Datos de identificación y contacto del paciente"
          title="Información personal"
        />

        <div style={{ marginBottom: 20 }}>
          <Input
            badge="required"
            disabled
            hint="Generado automáticamente por el sistema"
            icon={<Hash size={15} />}
            label="Código del paciente"
            readOnly
            value={autoCode}
          />
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
          <Input
            badge="required"
            label="Primer nombre"
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="Ej: María"
            value={firstName}
          />
          <Input
            badge="optional"
            label="Segundo nombre"
            onChange={(event) => setSecondName(event.target.value)}
            placeholder="Ej: Fernanda"
            value={secondName}
          />
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
          <Input
            badge="required"
            label="Primer apellido"
            onChange={(event) => setFirstLastName(event.target.value)}
            placeholder="Ej: López"
            value={firstLastName}
          />
          <Input
            badge="optional"
            label="Segundo apellido"
            onChange={(event) => setSecondLastName(event.target.value)}
            placeholder="Ej: García"
            value={secondLastName}
          />
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr 120px", marginBottom: 16 }}>
          <Input
            badge="required"
            icon={<IdCard size={15} />}
            label="Número de identidad"
            onChange={(event) => setIdentityNumber(event.target.value)}
            placeholder="Ej: 0801-1990-12345"
            value={identityNumber}
          />
          <Input
            badge="required"
            icon={<Calendar size={15} />}
            label="Fecha de nacimiento"
            onChange={(event) => setBirthDate(event.target.value)}
            type="date"
            value={birthDate}
          />
          <Input badge="required" disabled hint="Calculada" label="Edad" placeholder="-" readOnly value={age} />
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 16 }}>
          <Select
            badge="required"
            label="Sexo"
            onChange={setSex}
            options={[
              { value: "M", label: "Masculino" },
              { value: "F", label: "Femenino" },
            ]}
            placeholder="Selecciona..."
            value={sex}
          />
          <Select
            badge="required"
            label="Departamento"
            onChange={handleDepartamentoChange}
            options={DEPARTAMENTOS}
            placeholder="Selecciona..."
            value={departamento}
          />
          <Select
            badge="required"
            disabled={!departamento}
            label="Ciudad / Municipio"
            onChange={setMunicipio}
            options={municipioOptions}
            placeholder={departamento ? "Selecciona..." : "Primero elige un departamento"}
            value={municipio}
          />
        </div>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <Input
            badge="required"
            icon={<Phone size={15} />}
            label="Teléfono"
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Ej: +504 9876-5432"
            value={phone}
          />
          <Input
            badge="optional"
            icon={<Mail size={15} />}
            label="Correo electrónico"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Ej: maria@correo.com"
            type="email"
            value={email}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader
          icon={<Stethoscope size={18} />}
          subtitle="Antecedentes de salud relevantes para el tratamiento dental"
          title="Información médica"
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <CheckboxGroup
            badge="optional"
            label="Enfermedades sistémicas"
            onChange={setEnfermedades}
            options={ENFERMEDADES}
            selected={enfermedades}
          />
          {otrasChecked ? (
            <div
              style={{
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                borderRadius: 8,
                padding: 14,
              }}
            >
              <Textarea
                badge="conditional"
                hint='Este campo es obligatorio porque seleccionaste "Otras".'
                label='Descripción de "Otras" enfermedades'
                onChange={setOtrasDescription}
                placeholder="Describe las enfermedades sistémicas no listadas..."
                rows={3}
                value={otrasDescription}
              />
            </div>
          ) : null}
          <Textarea
            badge="optional"
            label="Medicamentos actuales"
            onChange={setMedicamentos}
            placeholder="Lista los medicamentos que el paciente consume actualmente..."
            rows={3}
            value={medicamentos}
          />
          <Textarea
            badge="optional"
            label="Alergias a medicamentos"
            onChange={setAlergias}
            placeholder="Describe alergias conocidas a medicamentos..."
            rows={3}
            value={alergias}
          />
          <RadioGroup
            badge="optional"
            label="Historial de anestesia - ¿Ha tenido reacciones a la anestesia?"
            onChange={setAnestesiaReaction}
            options={[
              { value: "no", label: "No ha tenido reacciones" },
              { value: "si", label: "Sí, ha tenido reacciones" },
            ]}
            value={anestesiaReaction}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader
          icon={<ClipboardList size={18} />}
          subtitle="Historial previo y motivo de la primera consulta"
          title="Información odontológica inicial"
        />

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "240px 1fr", alignItems: "start" }}>
          <Input
            badge="optional"
            hint="Si viene de otra clínica"
            icon={<Calendar size={15} />}
            label="Fecha de última visita previa"
            onChange={(event) => setLastVisitDate(event.target.value)}
            type="date"
            value={lastVisitDate}
          />
          <Textarea
            badge="optional"
            label="Motivo de consulta inicial"
            onChange={setMotivoConsulta}
            placeholder="Describe el motivo principal de la primera visita del paciente..."
            rows={4}
            value={motivoConsulta}
          />
        </div>
      </Card>

      <Card style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Button disabled={isSaving} onClick={() => navigate("/patients/list")} variant="secondary">
            <X size={16} />
            Cancelar
          </Button>
          <Button disabled={isLoadingPatient} loading={isSaving} onClick={handleSave} variant="primary">
            <Save size={16} />
            {isEditMode ? "Guardar cambios" : "Guardar paciente"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default PatientFormScreen;
