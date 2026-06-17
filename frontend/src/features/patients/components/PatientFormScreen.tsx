import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
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
import { PATIENT_SYSTEMIC_DISEASES } from "../../../config/constants";
import api from "../../../services/api";
import { ubicacionService } from "../../ubicacion/services/ubicacionService";
import type { Departamento, Municipio } from "../../ubicacion/services/ubicacionService";
import { calculateAge } from "../../../utils/formatters";
import { useResponsive } from "../../../hooks/useWindowWidth";
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
  direccion_linea?: string | null;
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
    departamento?: { id_departamento: number };
  };
};

const ADDRESS_MAX_LENGTH = 255;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HONDURAS_PHONE_PATTERN = /^(?:\+?504[\s-]?)?[2389]\d{3}[\s-]?\d{4}$/;

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
  const { isMobile } = useResponsive();

  const parsedPatientId = id ? Number(id) : null;
  const patientId =
    parsedPatientId && Number.isFinite(parsedPatientId)
      ? parsedPatientId
      : null;
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
  const [departamentoOptions, setDepartamentoOptions] = useState<{ value: string; label: string }[]>([]);
  const [municipioOptions, setMunicipioOptions] = useState<{ value: string; label: string }[]>([]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [enfermedades, setEnfermedades] = useState<string[]>([]);
  const [otrasDescription, setOtrasDescription] = useState("");
  const [medicamentos, setMedicamentos] = useState("");
  const [alergias, setAlergias] = useState("");
  const [anestesiaReaction, setAnestesiaReaction] = useState("no");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPatient, setIsLoadingPatient] = useState(isEditMode);
  const errorRef = useRef<HTMLDivElement>(null);
  const todayDate = new Date().toISOString().slice(0, 10);
  const minBirthDateValue = new Date();
  minBirthDateValue.setFullYear(minBirthDateValue.getFullYear() - 110);
  const minBirthDate = minBirthDateValue.toISOString().slice(0, 10);

  const getBirthDateError = (date: string) => {
    if (!date) return "La fecha de nacimiento es obligatoria";

    if (date > todayDate)
      return "La fecha de nacimiento no puede ser mayor a la fecha actual";

    if (date < minBirthDate)
      return "La edad del paciente no puede ser mayor a 110 años";

    return "";
  };

  const handleBirthDateChange = (nextDate: string) => {
    const error = getBirthDateError(nextDate);

    if (error && nextDate) {
      setBirthDate("");
      setFieldErrors((p) => ({
        ...p,
        birthDate: error,
      }));
      return;
    }

    setBirthDate(nextDate);
    setFieldErrors((p) => ({
      ...p,
      birthDate: "",
    }));
  };

  function scrollToError() {
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  const displayCode =
    isEditMode && patientId
      ? `PAC-${String(patientId).padStart(6, "0")}`
      : "Se generará al guardar";
  const otrasChecked = enfermedades.includes("otras");

  const age = useMemo(() => {
    if (!birthDate) return "";
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
    return departamentoId ? String(departamentoId) : "";
  }, []);

  useEffect(() => {
    if (!patientId) return;
    let ignore = false;

    api
      .get<PersonaDetail>(`/persona/${patientId}`)
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
        setAddressLine(persona.direccion_linea ?? "");
        let enfermedadesList: string[] = [];
        try {
          if (persona.enfermedades)
            enfermedadesList = JSON.parse(persona.enfermedades);
        } catch {
          /* si estaba guardado como texto plano */
        }
        setEnfermedades(enfermedadesList);
        setOtrasDescription(persona.otras_enfermedades ?? "");
        setMedicamentos(persona.medicamentos ?? "");
        setAlergias(persona.alergias ?? "");
        setAnestesiaReaction(persona.reaccion_anestesia ?? "no");
      })
      .catch((err: unknown) => {
        if (ignore) return;
        setSaveStatus("error");
        setMessage(
          err instanceof Error ? err.message : "No se pudo cargar el paciente."
        );
      })
      .finally(() => {
        if (!ignore) setIsLoadingPatient(false);
      });

    return () => {
      ignore = true;
    };
  }, [getDepartamentoFromPersona, patientId]);

  useEffect(() => {
    ubicacionService.getDepartamentos().then((res) => {
      if (res.success) {
        setDepartamentoOptions(
          res.data.map((d: Departamento) => ({
            value: String(d.id_departamento),
            label: d.nombre,
          })),
        );
      }
    });
  }, []);

  useEffect(() => {
    if (!departamento) {
      setMunicipioOptions([]);
      return;
    }
    ubicacionService.getMunicipiosPorDepartamento(Number(departamento)).then((res) => {
      if (res.success) {
        setMunicipioOptions(
          res.data.map((m: Municipio) => ({
            value: String(m.id_municipio),
            label: m.nombre,
          })),
        );
      }
    });
  }, [departamento]);

  const handleSave = async () => {
    const identityDigits = identityNumber.replace(/\D/g, "");

    // Validación por campo
    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "El primer nombre es obligatorio";
    if (!firstLastName.trim())
      errors.firstLastName = "El primer apellido es obligatorio";
    if (!identityNumber.trim())
      errors.identityNumber = "El número de identidad es obligatorio";
    else if (identityDigits.length !== 13)
      errors.identityNumber = "La identidad debe tener exactamente 13 dígitos";
    const birthDateError = getBirthDateError(birthDate);
    if (birthDateError) errors.birthDate = birthDateError;
    if (sex !== "M" && sex !== "F")
      errors.sex = "Selecciona el sexo del paciente";
    if (!departamento) errors.departamento = "Selecciona un departamento";
    if (!municipio) errors.municipio = "Selecciona un municipio";
    if (!phone.trim()) errors.phone = "El teléfono es obligatorio";
    else if (!HONDURAS_PHONE_PATTERN.test(phone.trim()))
      errors.phone = "Ingresa un teléfono válido de Honduras (8 dígitos, puede incluir +504)";
    if (email.trim() && !EMAIL_PATTERN.test(email.trim()))
      errors.email = "Ingresa un correo electrónico válido";
    if (addressLine.length > ADDRESS_MAX_LENGTH)
      errors.addressLine = `La dirección no puede superar ${ADDRESS_MAX_LENGTH} caracteres`;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveStatus("error");
      setMessage("Revisá los campos marcados en rojo.");
      scrollToError();
      return;
    }

    setFieldErrors({});

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
      direccion_linea: addressLine.trim() || null,
      sexo: sex as "M" | "F",
      enfermedades: JSON.stringify(enfermedades),
      otras_enfermedades: otrasDescription.trim() || undefined,
      medicamentos: medicamentos.trim() || undefined,
      alergias: alergias.trim() || undefined,
      reaccion_anestesia: anestesiaReaction || undefined,
    };

    try {
      setIsSaving(true);
      const response =
        isEditMode && patientId
          ? await api.put(`/persona/${patientId}`, payload)
          : await api.post("/persona", payload);

      const savedPatientId = response?.data?.id_persona ?? patientId;
      setMessage(
        isEditMode
          ? "Paciente actualizado correctamente."
          : "Paciente guardado correctamente."
      );
      setSaveStatus("success");
      navigate(
        savedPatientId
          ? `/patients/profile/${savedPatientId}`
          : "/patients/list"
      );
    } catch (err: unknown) {
      setSaveStatus("error");
      setMessage(
        err instanceof Error ? err.message : "No se pudo guardar el paciente."
      );
      setFieldErrors({});
      scrollToError();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        alignSelf: "stretch",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        width: "100%",
      }}
    >
      {/* Fix 2: flecha de volver */}
      <button
        onClick={() =>
          navigate(isEditMode ? `/patients/profile/${patientId}` : "/patients")
        }
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
        {isEditMode ? "Volver al perfil" : "Volver a pacientes"}
      </button>

      {/* Fix 3: ref en el Alert de error para autoscroll */}
      {saveStatus !== "idle" && (
        <div ref={errorRef}>
          <Alert
            message={message}
            onClose={() => setSaveStatus("idle")}
            variant={saveStatus === "success" ? "success" : "error"}
          />
        </div>
      )}
      {isLoadingPatient && (
        <Alert message="Cargando datos del paciente..." variant="info" />
      )}

      <FormSection
        columns={isMobile ? 1 : 2}
        icon={<User size={18} />}
        title="Información personal"
      >
        <SectionDescription>
          Datos de identificación y contacto del paciente
        </SectionDescription>
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
          onChange={(e) => {
            setFirstName(e.target.value);
            setFieldErrors((p) => ({ ...p, firstName: "" }));
          }}
          placeholder="Ej: María"
          value={firstName}
          error={fieldErrors.firstName}
        />
        <Input
          label="Segundo nombre"
          onChange={(e) => setSecondName(e.target.value)}
          placeholder="Ej: Fernanda"
          value={secondName}
        />
        <Input
          badge="required"
          label="Primer apellido"
          onChange={(e) => {
            setFirstLastName(e.target.value);
            setFieldErrors((p) => ({ ...p, firstLastName: "" }));
          }}
          placeholder="Ej: López"
          value={firstLastName}
          error={fieldErrors.firstLastName}
        />
        <Input
          label="Segundo apellido"
          onChange={(e) => setSecondLastName(e.target.value)}
          placeholder="Ej: García"
          value={secondLastName}
        />
        <Input
          badge="required"
          icon={<IdCard size={15} />}
          label="Número de identidad"
          onChange={(e) => {
            setIdentityNumber(e.target.value);
            setFieldErrors((p) => ({ ...p, identityNumber: "" }));
          }}
          placeholder="Ej: 0801-1990-12345"
          value={identityNumber}
          error={fieldErrors.identityNumber}
        />
        <Input
          badge="required"
          icon={<Calendar size={15} />}
          label="Fecha de nacimiento"
          min={minBirthDate}
          max={todayDate}
          onChange={(e) => handleBirthDateChange(e.target.value)}
          type="date"
          value={birthDate}
          error={fieldErrors.birthDate}
        />
        <Input
          badge="required"
          disabled
          hint="Calculada"
          label="Edad"
          placeholder="-"
          readOnly
          value={age}
        />
        <Select
          badge="required"
          label="Sexo"
          onChange={(v) => {
            setSex(v === "M" || v === "F" ? v : "");
            setFieldErrors((p) => ({ ...p, sex: "" }));
          }}
          options={[
            { value: "M", label: "Masculino" },
            { value: "F", label: "Femenino" },
          ]}
          placeholder="Selecciona..."
          value={sex}
          error={fieldErrors.sex}
        />
        <Select
          badge="required"
          label="Departamento"
          onChange={(v) => {
            handleDepartamentoChange(v);
            setFieldErrors((p) => ({ ...p, departamento: "", municipio: "" }));
          }}
          options={departamentoOptions}
          placeholder="Selecciona..."
          value={departamento}
          error={fieldErrors.departamento}
        />
        <Select
          badge="required"
          disabled={!departamento}
          label="Ciudad / Municipio"
          onChange={(v) => {
            setMunicipio(v);
            setFieldErrors((p) => ({ ...p, municipio: "" }));
          }}
          options={municipioOptions}
          placeholder={
            departamento ? "Selecciona..." : "Primero elige un departamento"
          }
          value={municipio}
          error={fieldErrors.municipio}
        />
        <Input
          badge="required"
          icon={<Phone size={15} />}
          label="Teléfono"
          onChange={(e) => {
            setPhone(e.target.value);
            setFieldErrors((p) => ({ ...p, phone: "" }));
          }}
          placeholder="Ej: +504 9876-5432"
          value={phone}
          error={fieldErrors.phone}
        />
        <Input
          icon={<Mail size={15} />}
          label="Correo electrónico"
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors((p) => ({ ...p, email: "" }));
          }}
          placeholder="Ej: maria@correo.com"
          type="email"
          value={email}
          error={fieldErrors.email}
        />
        <FullWidthField>
          <Textarea
            badge="optional"
            error={fieldErrors.addressLine}
            hint={`${addressLine.length}/${ADDRESS_MAX_LENGTH} caracteres`}
            label="Dirección"
            maxLength={ADDRESS_MAX_LENGTH}
            onChange={(value) => {
              setAddressLine(value);
              setFieldErrors((p) => ({ ...p, addressLine: "" }));
            }}
            placeholder="Ej: Barrio El Centro, frente al parque principal"
            rows={2}
            value={addressLine}
          />
        </FullWidthField>
      </FormSection>

      <FormSection
        columns={1}
        icon={<Stethoscope size={18} />}
        title="Información médica"
      >
        <SectionDescription>
          Antecedentes de salud relevantes para el tratamiento dental
        </SectionDescription>
        <FullWidthField>
          <CheckboxGroup
            label="Enfermedades sistémicas"
            onChange={setEnfermedades}
            options={PATIENT_SYSTEMIC_DISEASES}
            selected={enfermedades}
          />
        </FullWidthField>
        {otrasChecked && (
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
        )}
        <FullWidthField>
          <Textarea
            label="Medicamentos actuales"
            onChange={setMedicamentos}
            placeholder="Lista los medicamentos que el paciente consume actualmente..."
            rows={3}
            value={medicamentos}
          />
        </FullWidthField>
        <FullWidthField>
          <Textarea
            label="Alergias a medicamentos"
            onChange={setAlergias}
            placeholder="Describe alergias conocidas a medicamentos..."
            rows={3}
            value={alergias}
          />
        </FullWidthField>
        <FullWidthField>
          <RadioGroup
            label="Historial de anestesia — ¿Ha tenido reacciones?"
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
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Button
            disabled={isSaving}
            onClick={() => navigate("/patients/list")}
            variant="secondary"
            style={{ width: isMobile ? "100%" : undefined }}
          >
            <X size={16} /> Cancelar
          </Button>
          <Button
            disabled={isLoadingPatient}
            loading={isSaving}
            onClick={handleSave}
            variant="primary"
            style={{ width: isMobile ? "100%" : undefined }}
          >
            <Save size={16} />{" "}
            {isEditMode ? "Guardar cambios" : "Guardar paciente"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default PatientFormScreen;
