import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Hash,
  IdCard,
  Mail,
  Phone,
  Save,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { FormSection, FullWidthField } from "../../../components";
import { Alert, Button, Card, Input, Select } from "../../../context";
import {
  PATIENT_DEPARTMENTS,
  PATIENT_MUNICIPALITIES,
  PATIENT_SYSTEMIC_DISEASES,
} from "../../../config/constants";
import api from "../../../services/api";
import { calculateAge } from "../../../utils/formatters";
import { CheckboxGroup, RadioGroup, Textarea } from "./formControls";

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
  enfermedades?: string;
  otras_enfermedades?: string;
  medicamentos?: string;
  alergias?: string;
  reaccion_anestesia?: string;
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
  enfermedades?: string | null;
  otras_enfermedades?: string | null;
  medicamentos?: string | null;
  alergias?: string | null;
  reaccion_anestesia?: string | null;
  municipio?: {
    id_municipio: number;
    id_departamento: number;
    departamento?: {
      id_departamento: number;
    };
  };
};

function SectionDescription({ children }: { children: string }) {
  return (
    <FullWidthField>
      <p style={{ color: "var(--arco-gray-500)", fontSize: 12, margin: 0 }}>
        {children}
      </p>
    </FullWidthField>
  );
}

export function PatientFormScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const parsedPatientId = id ? Number(id) : null;
  const patientId = parsedPatientId && Number.isFinite(parsedPatientId) ? parsedPatientId : null;
  const isEditMode = patientId !== null;

  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [firstLastName, setFirstLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<"M" | "F" | "">("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [enfermedades, setEnfermedades] = useState<string[]>([]);
  const [otrasDescription, setOtrasDescription] = useState("");
  const [medicamentos, setMedicamentos] = useState("");
  const [alergias, setAlergias] = useState("");
  const [anestesiaReaction, setAnestesiaReaction] = useState("no");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPatient, setIsLoadingPatient] = useState(isEditMode);

  const displayCode = isEditMode && patientId ? `PAC-${String(patientId).padStart(6, "0")}` : "Se generará al guardar";
  const municipioOptions = departamento ? PATIENT_MUNICIPALITIES[departamento] ?? [] : [];
  const otrasChecked = enfermedades.includes("otras");

  const age = useMemo(() => {
    if (!birthDate) {
      return "";
    }

    const years = calculateAge(birthDate);
    return years >= 0 ? String(years) : "";
  }, [birthDate]);

  const handleDepartamentoChange = (value: string) => {
    setDepartamento(value);
    setMunicipio("");
  };

  const getDepartamentoFromPersona = useCallback((persona: PersonaDetail) => {
    const departamentoId =
      persona.municipio?.id_departamento ??
      persona.municipio?.departamento?.id_departamento;

    if (departamentoId) return String(departamentoId);

    const match = Object.entries(PATIENT_MUNICIPALITIES).find(([, municipios]) =>
      municipios.some((option) => Number(option.value) === persona.id_municipio),
    );

    return match?.[0] ?? "";
  }, []);

  useEffect(() => {
    if (!patientId) return;

    let ignore = false;

    api.get<PersonaDetail>(`/persona/${patientId}`)
      .then((response) => {
        if (ignore) return;

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

        const enfermedadesStr = persona.enfermedades;
        let enfermedadesList = [];
        try {
          if (enfermedadesStr) enfermedadesList = JSON.parse(enfermedadesStr);
        } catch {
          // If it was stored as plain text by accident, handle it
        }
        setEnfermedades(enfermedadesList);
        setOtrasDescription(persona.otras_enfermedades ?? "");
        setMedicamentos(persona.medicamentos ?? "");
        setAlergias(persona.alergias ?? "");
        setAnestesiaReaction(persona.reaccion_anestesia ?? "no");
      })
      .catch((error: { message?: string }) => {
        if (ignore) return;
        setSaveStatus("error");
        setMessage(error.message ?? "No se pudo cargar el paciente.");
      })
      .finally(() => {
        if (!ignore) setIsLoadingPatient(false);
      });

    return () => {
      ignore = true;
    };
  }, [getDepartamentoFromPersona, patientId]);

  const handleSave = async () => {
    const identityDigits = identityNumber.replace(/\D/g, "");
    const requiredFilled =
      firstName &&
      firstLastName &&
      identityDigits.length === 13 &&
      birthDate &&
      (sex === "M" || sex === "F") &&
      municipio &&
      phone;

    if (!requiredFilled) {
      setSaveStatus("error");
      setMessage("Completa los campos requeridos. La identidad debe tener 13 dígitos.");
      return;
    }

    if (sex !== "M" && sex !== "F") {
      setSaveStatus("error");
      setMessage("Selecciona el sexo del paciente.");
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
      sexo: sex,
      enfermedades: JSON.stringify(enfermedades),
      otras_enfermedades: otrasDescription.trim() || undefined,
      medicamentos: medicamentos.trim() || undefined,
      alergias: alergias.trim() || undefined,
      reaccion_anestesia: anestesiaReaction || undefined,
    };

    try {
      setIsSaving(true);
      const response = isEditMode && patientId
        ? await api.put(`/persona/${patientId}`, payload)
        : await api.post("/persona", payload);

      const savedPatientId = response?.data?.id_persona ?? patientId;

      if (isEditMode && patientId) {
        setMessage("Paciente actualizado correctamente.");
      } else {
        setMessage("Paciente guardado correctamente.");
      }

      setSaveStatus("success");

      if (savedPatientId) {
        navigate(`/patients/profile/${savedPatientId}`);
        return;
      }

      navigate("/patients/list");
    } catch (error) {
      const apiError = error as { message?: string };
      setSaveStatus("error");
      setMessage(apiError.message ?? "No se pudo guardar el paciente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      {saveStatus !== "idle" ? (
        <Alert
          message={message}
          onClose={() => setSaveStatus("idle")}
          variant={saveStatus === "success" ? "success" : "error"}
        />
      ) : null}

      {isLoadingPatient ? <Alert message="Cargando datos del paciente..." variant="info" /> : null}

      <FormSection columns={2} icon={<User size={18} />} title="Información personal">
        <SectionDescription>Datos de identificación y contacto del paciente</SectionDescription>
        <FullWidthField>
          <Input
            badge="required"
            disabled
            hint="Generado automáticamente por el sistema"
            icon={<Hash size={15} />}
            label="Código del paciente"
            readOnly
            value={displayCode}
          />
        </FullWidthField>
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
        <Select
          badge="required"
          label="Sexo"
          onChange={(value) => setSex(value === "M" || value === "F" ? value : "")}
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
          options={PATIENT_DEPARTMENTS}
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
      </FormSection>

      <FormSection columns={1} icon={<Stethoscope size={18} />} title="Información médica">
        <SectionDescription>Antecedentes de salud relevantes para el tratamiento dental</SectionDescription>
        <FullWidthField>
          <CheckboxGroup
            badge="optional"
            label="Enfermedades sistémicas"
            onChange={setEnfermedades}
            options={PATIENT_SYSTEMIC_DISEASES}
            selected={enfermedades}
          />
        </FullWidthField>
        {otrasChecked ? (
          <FullWidthField
            style={{
              background: "var(--arco-warning-soft)",
              border: "1px solid var(--arco-warning)",
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
          </FullWidthField>
        ) : null}
        <FullWidthField>
          <Textarea
            badge="optional"
            label="Medicamentos actuales"
            onChange={setMedicamentos}
            placeholder="Lista los medicamentos que el paciente consume actualmente..."
            rows={3}
            value={medicamentos}
          />
        </FullWidthField>
        <FullWidthField>
          <Textarea
            badge="optional"
            label="Alergias a medicamentos"
            onChange={setAlergias}
            placeholder="Describe alergias conocidas a medicamentos..."
            rows={3}
            value={alergias}
          />
        </FullWidthField>
        <FullWidthField>
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
        </FullWidthField>
      </FormSection>



      <Card style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
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
