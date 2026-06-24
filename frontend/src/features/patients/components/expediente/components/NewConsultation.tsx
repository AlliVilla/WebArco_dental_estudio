import { useState, useRef, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronDown,
  Upload,
  X,
  Search,
  Plus,
  Trash2,
  FileText,
  Image as ImageIcon,
  Stethoscope,
  Check,
  AlertCircle,
  Loader2,
  Tag,
  Zap,
  ClipboardList,
  Clock,
  User,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { ExpedientePaciente } from "../types/getAllPacientes";
import { OdontogramScreen } from "../../odontograma/components/OdontogramaScreen";
import type { ToothData } from "../../odontograma/types";
import { odontogramaService } from "../../odontograma/services/odontogramaService";
import {
  loadOdontogramaDraft,
  clearOdontogramaDraft,
} from "../../odontograma/services/odontogramaDraftStorage";
import { Button, Input } from "../../../../../context";
import { useResponsive } from "../../../../../hooks/useWindowWidth";
import api from "../../../../../services/api";
import { calcularEdad, formatDate } from "../services/miscelaneousService";
import {
  expedientService,
  type PreguntaConsulta,
  type RespuestaConsulta,
  type RegistrarConsultaPayload,
} from "../services/expedientService";
import { UsuarioDoctor } from "../types/getAllDoctores";
import { privilegeService } from "../services/privilegeService";
import { ConsultationQuestions } from "./ConsultationQuestions";
import { treatmentService } from "../../../../treatments/services/treatmentService";
import type { Treatment } from "../../../../treatments/types";
import {
  tratamientoPacienteService,
  type TratamientoPacienteResponse,
} from "../services/tratamientoPacienteService";
import { pagoConsultaService } from "../services/pagoConsultaService";

const ToothIcon = ({
  size = 16,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5.5 13C3 8 4 6 6 4.5c2-1 4 .5 6 .5s4-1.5 6-.5c2 1.5 3 3.5.5 8.5-1 2 1 1.5-1.5 6.5-3.5 1-3.5-8-5-8s-1.5 9-5 8c-2.5-5-1-4.5-1.5-6.5" />
  </svg>
);

// ── Design tokens (CSS vars from theme.css) ───────────────────────────────────
const C = {
  primary: "var(--arco-primary, #0BC5DF)",
  navy: "var(--arco-navy, #203F49)",
  success: "var(--arco-success, #1D9E75)",
  warning: "var(--arco-warning, #EF9F27)",
  danger: "var(--arco-danger, #E24B4A)",
  gray50: "var(--arco-gray-50, #F8F9FA)",
  gray100: "var(--arco-gray-100, #F1F3F4)",
  gray300: "var(--arco-gray-300, #D3D7DA)",
  gray500: "var(--arco-gray-500, #888F94)",
  gray700: "var(--arco-gray-700, #5F656A)",
  white: "#ffffff",
  primaryBg: "var(--accent, #E6F8FB)",
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3;

type PrismaTipoArchivo = "Tomografia" | "Radiografia" | "Imagen";

interface ArchivoItem {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
}

interface TratamientoConsulta {
  id: string; // unique key for React
  id_tratamiento?: number; // if from catalog
  nombre: string;
  precio: number;
  tratamientoPacienteId?: number; // if linked to an existing plan
}

interface ToastMsg {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

const STEP_LABELS = [
  "Paciente y Cita",
  "Odontograma",
  "Tratamientos y Diagnóstico",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Toast({
  toasts,
  remove,
}: {
  toasts: ToastMsg[];
  remove: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 24,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        const colors = {
          success: { bg: C.success, icon: <Check size={16} /> },
          error: { bg: C.danger, icon: <AlertCircle size={16} /> },
          info: { bg: C.primary, icon: <Zap size={16} /> },
        }[t.type];
        return (
          <div
            key={t.id}
            style={{
              pointerEvents: "all",
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: C.white,
              border: `1.5px solid ${colors.bg}`,
              borderRadius: 10,
              padding: "12px 16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              minWidth: 280,
              maxWidth: 380,
              animation: "slideIn 0.2s ease",
            }}
          >
            <span style={{ color: colors.bg, flexShrink: 0 }}>
              {colors.icon}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: C.navy }}>
              {t.message}
            </span>
            <button
              onClick={() => remove(t.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.gray500,
                display: "flex",
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function StepperBar({ step }: { step: Step }) {
  const { isMobile } = useResponsive();
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.gray300}`,
        borderRadius: 12,
        padding: isMobile ? "14px 16px" : "16px 24px",
        display: "flex",
        alignItems: "center",
      }}
    >
      {STEP_LABELS.map((label, i) => {
        const num = (i + 1) as Step;
        const done = step > num;
        const active = step === num;
        return (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              flex: i < STEP_LABELS.length - 1 ? 1 : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 6 : 10,
                flexShrink: 0,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: done ? C.success : active ? C.primary : C.gray100,
                  color: done || active ? C.white : C.gray500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  transition: "background 0.2s",
                }}
              >
                {done ? <Check size={14} /> : num}
              </div>
              {/* En móvil solo se muestra el label del paso activo para evitar overflow */}
              {(!isMobile || active) && (
                <span
                  style={{
                    fontSize: isMobile ? 12 : 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? C.navy : done ? C.success : C.gray500,
                    whiteSpace: isMobile ? "normal" : "nowrap",
                    overflow: isMobile ? "hidden" : undefined,
                    textOverflow: isMobile ? "ellipsis" : undefined,
                  }}
                >
                  {label}
                </span>
              )}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  margin: isMobile ? "0 8px" : "0 16px",
                  background: done ? C.success : C.gray300,
                  borderRadius: 2,
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const { isMobile } = useResponsive();
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.gray300}`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: isMobile ? "14px 16px" : "18px 24px",
          borderBottom: `1px solid ${C.gray100}`,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: C.primaryBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.primary,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>
          {title}
        </span>
      </div>
      <div style={{ padding: isMobile ? 16 : 24 }}>{children}</div>
    </div>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 11,
        fontWeight: 600,
        color: C.gray500,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: 6,
      }}
    >
      {children}
      {required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
    </label>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  readOnly = false,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder: string;
  rows?: number;
  readOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = focused
    ? "var(--arco-primary, #0BC5DF)"
    : "var(--border, #D3D7DA)";
  return (
    <textarea
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      rows={rows}
      disabled={readOnly}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%",
        padding: "10px 12px",
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        fontSize: 13,
        color: "var(--foreground, #203F49)",
        background: readOnly
          ? "var(--background, #F8F9FA)"
          : "var(--card, #ffffff)",
        resize: "vertical",
        fontFamily: "Inter, system-ui, sans-serif",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: focused ? `0 0 0 3px rgba(11,197,223,0.12)` : "none",
      }}
    />
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  readOnly = false,
  type = "text",
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <Input
      type={type}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      placeholder={placeholder}
      disabled={readOnly}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  patient: ExpedientePaciente;
  onBack: () => void;
  onSave: () => void;
}

export function NuevaConsulta({ patient, onBack, onSave }: Props) {
  const { isMobile } = useResponsive();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // Catalog tratamientos
  const [catalogTratamientos, setCatalogTratamientos] = useState<Treatment[]>(
    []
  );
  const [loadingTratamientos, setLoadingTratamientos] = useState(false);

  // ── STEP 1: Paciente y Cita ──
  const [primerNombre, setPrimerNombre] = useState(patient.primer_nombre || "");
  const [segundoNombre, setSegundoNombre] = useState(
    patient.segundo_nombre || ""
  );
  const [primerApellido, setPrimerApellido] = useState(
    patient.primer_apellido || ""
  );
  const [segundoApellido, setSegundoApellido] = useState(
    patient.segundo_apellido || ""
  );
  const [identidad, setIdentidad] = useState(patient.numero_identidad || "");
  const [fechaNacimiento, setFechaNacimiento] = useState(
    patient.fecha_nacimiento || ""
  );
  const [telefono, setTelefono] = useState(patient.telefono || "");
  const [correo, setCorreo] = useState(patient.correo_electronico || "");
  const [departamento, setDepartamento] = useState(
    patient.municipio.departamento.nombre || ""
  );
  const [ciudad, setCiudad] = useState(patient.municipio.nombre || "");
  const [direccion, setDireccion] = useState(patient.direccion_linea || "");
  const [doctores, setDoctores] = useState<UsuarioDoctor[]>([]);
  const [preguntas, setPreguntas] = useState<PreguntaConsulta[]>([]);
  const [respuestas, setRespuestas] = useState<
    Record<number, { respuestaBoolean?: boolean; explanation?: string }>
  >({});

  // Editable fields for visit setup

  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(
      d.getMinutes()
    ).padStart(2, "0")}`;
  });
  const [doctor, setDoctor] = useState<UsuarioDoctor | null>(null);

  // ── STEP 2: Motivo y Odontograma ──
  const [showOdontogram, setShowOdontogram] = useState(false);
  const [teethState, setTeethState] = useState<Record<
    number,
    ToothData
  > | null>(null);
  const [modifiedTeethList, setModifiedTeethList] = useState<number[]>([]);
  const [modifiedTeethCount, setModifiedTeethCount] = useState(0);

  // ── STEP 3: Tratamientos y Cobro + Diagnóstico y Archivos ──
  const [diagnostico, setDiagnostico] = useState("");
  const [notas, setNotas] = useState("");
  const [archivos, setArchivos] = useState<ArchivoItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [busqueda, setBusqueda] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tratamientos, setTratamientos] = useState<TratamientoConsulta[]>([]);
  const [conceptoLibre, setConceptoLibre] = useState("");
  const [precioLibre, setPrecioLibre] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Planes activos del paciente ──
  const [tratamientosPaciente, setTratamientosPaciente] = useState<
    TratamientoPacienteResponse[]
  >([]);
  const [busquedaPlan, setBusquedaPlan] = useState("");

  // ── Creación de plan desde tratamiento seleccionado ──
  const [planForm, setPlanForm] = useState<{
    treatmentId: string | null;
    nombre: string;
    costoTotal: string;
    fechaInicio: string;
  }>({ treatmentId: null, nombre: "", costoTotal: "", fechaInicio: "" });

  // Planes pendientes de crear al guardar la consulta
  const [pendingPlans, setPendingPlans] = useState<
    Array<{
      treatmentId: string;
      nombre: string;
      costoTotal: number;
      fechaInicio: string;
    }>
  >([]);

  const loadTratamientosPaciente = useCallback(async () => {
    try {
      const res = await tratamientoPacienteService.findByPaciente(
        patient.id_persona
      );
      setTratamientosPaciente(
        Array.isArray(res.data)
          ? res.data.filter(
              (t: TratamientoPacienteResponse) => t.estado === "ACTIVO"
            )
          : []
      );
    } catch {
      /* ignore */
    }
  }, [patient.id_persona]);

  const addToast = useCallback((type: ToastMsg["type"], message: string) => {
    const id = uid();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      4500
    );
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadDoctores = useCallback(async () => {
    await privilegeService.getAllDoctores().then((response) => {
      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      setDoctores(list);
      if (list.length > 0) {
        setDoctor(list[0]);
      }
    });
  }, []);

  const loadTratamientos = useCallback(async () => {
    setLoadingTratamientos(true);
    try {
      const res = await treatmentService.getAll({ activo: "true" });
      const data = Array.isArray(res.data)
        ? res.data
        : (res.data as any)?.data || [];
      setCatalogTratamientos(data);
    } catch (err) {
      console.error("Error loading tratamientos:", err);
    } finally {
      setLoadingTratamientos(false);
    }
  }, []);

  const loadOdontograma = useCallback(async () => {
    try {
      const res = await odontogramaService.getByPatientId(patient.id_persona);
      const data = res.data;
      if (data && data.dientes) {
        const teethMap: Record<number, ToothData> = {};
        data.dientes.forEach((tooth: any) => {
          teethMap[tooth.numero_diente] = {
            number: tooth.numero_diente,
            state: tooth.estado || "Sano",
            observation: tooth.observacion || "",
          };
        });
        setTeethState(teethMap);
      }
    } catch (err) {
      console.error("Error loading odontograma:", err);
    }
  }, [patient.id_persona]);

  useEffect(() => {
    loadDoctores();
    loadTratamientos();
    loadOdontograma();
    loadTratamientosPaciente();
    Promise.all([
      expedientService.getPreguntas(),
      expedientService.getUltimasRespuestas(patient.id_persona),
    ])
      .then(([pregRes, respRes]) => {
        const preguntasData = Array.isArray(pregRes.data)
          ? pregRes.data
          : (pregRes.data as any)?.data || [];
        setPreguntas(preguntasData);
        const medicasIds = new Set(
          preguntasData
            .filter((p: any) => p.categoria === "Antecedentes Médicos")
            .map((p: any) => p.id_pregunta)
        );
        const respuestasArr = Array.isArray(respRes.data)
          ? respRes.data
          : (respRes.data as any)?.data || [];
        if (respuestasArr.length > 0) {
          const prefill: Record<
            number,
            { respuestaBoolean?: boolean; explanation?: string }
          > = {};
          for (const r of respuestasArr) {
            if (medicasIds.has(r.id_pregunta)) {
              prefill[r.id_pregunta] = {
                respuestaBoolean: r.respuesta_boolean ?? undefined,
                explanation: r.explanation ?? undefined,
              };
            }
          }
          setRespuestas(prefill);
        }
      })
      .catch(() => {});
  }, [loadOdontograma, loadTratamientosPaciente]);

  const syncOdontogramDraft = useCallback(() => {
    const draft = loadOdontogramaDraft(patient.id_persona);
    if (!draft) return;
    setTeethState(draft.teeth);
    setModifiedTeethList(draft.modifiedTeethList);
    setModifiedTeethCount(draft.modifiedTeethList.length);
  }, [patient.id_persona]);

  useEffect(() => {
    syncOdontogramDraft();
  }, [syncOdontogramDraft]);

  useEffect(() => {
    if (!showOdontogram) {
      syncOdontogramDraft();
    }
  }, [showOdontogram, syncOdontogramDraft]);

  // ── File handling ──────────────────────────────────────────────────────────
  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const allowed = ["image/png", "image/jpeg", "image/jpg"];
      Array.from(files).forEach((file) => {
        if (!allowed.includes(file.type)) {
          addToast(
            "error",
            `"${file.name}" no es PNG ni JPEG. Solo se aceptan imágenes.`
          );
          return;
        }
        const id = uid();
        const reader = new FileReader();
        reader.onload = (ev) => {
          const preview = ev.target?.result as string;
          setArchivos((prev) => [
            ...prev,
            { id, file, preview, uploading: true },
          ]);
          // Simulate upload
          setTimeout(() => {
            setArchivos((prev) =>
              prev.map((a) => (a.id === id ? { ...a, uploading: false } : a))
            );
          }, 1200 + Math.random() * 800);
        };
        reader.readAsDataURL(file);
      });
    },
    [addToast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  // ── Treatments search / manual addition ──────────────────────────────────────
  const suggestions = catalogTratamientos.filter((t) =>
    t.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const addTratamiento = (t: Treatment) => {
    const uniqueId = `${t.id}-${uid()}`;
    setTratamientos((prev) => [
      ...prev,
      {
        id: uniqueId,
        id_tratamiento: t.id,
        nombre: t.nombre,
        precio: t.precio,
      },
    ]);
    setBusqueda("");
    setShowSuggestions(false);
  };

  const addConceptoLibre = () => {
    const nombre = conceptoLibre.trim();
    const precio = parseFloat(precioLibre);
    if (!nombre) {
      addToast("error", "Escribe un nombre para el concepto libre.");
      return;
    }
    if (isNaN(precio) || precio <= 0) {
      addToast("error", "El precio debe ser un número mayor a 0.");
      return;
    }
    setTratamientos((prev) => [...prev, { id: uid(), nombre, precio }]);
    setConceptoLibre("");
    setPrecioLibre("");
    addToast("info", `Concepto "${nombre}" agregado.`);
  };

  const initPlanForm = (t: TratamientoConsulta) => {
    const today = new Date().toISOString().slice(0, 10);
    setPlanForm({
      treatmentId: t.id,
      nombre: t.nombre,
      costoTotal: String(t.precio),
      fechaInicio: today,
    });
  };

  const handleCreatePlan = () => {
    const current = planForm;
    if (!current.treatmentId || !current.nombre || !current.costoTotal) return;
    const costo = parseFloat(current.costoTotal);
    if (isNaN(costo) || costo <= 0) {
      addToast("error", "El costo total debe ser un número válido mayor a 0.");
      return;
    }

    setPendingPlans((prev) => [
      ...prev,
      {
        treatmentId: current.treatmentId!,
        nombre: current.nombre,
        costoTotal: costo,
        fechaInicio:
          current.fechaInicio || new Date().toISOString().slice(0, 10),
      },
    ]);
    setPlanForm({
      treatmentId: null,
      nombre: "",
      costoTotal: "",
      fechaInicio: "",
    });
    addToast("info", "Plan pendiente. Se creará al guardar la consulta.");
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    setShowConfirmModal(true);
  };

  const performSave = async () => {
    setShowConfirmModal(false);
    // Find "motivo de consulta" in the answered questions
    const motivoRespuesta = Object.entries(respuestas).find(([id]) => {
      const q = preguntas.find((p) => p.id_pregunta === Number(id));
      return q?.pregunta.toLowerCase().includes("motivo de consulta");
    });
    const motivoFinal = motivoRespuesta ? motivoRespuesta[1].explanation : "";

    if (!motivoFinal?.trim()) {
      addToast(
        "error",
        "El motivo de consulta es requerido en las preguntas del Paso 1."
      );
      setStep(1);
      return;
    }
    if (!diagnostico.trim()) {
      addToast("error", "El diagnóstico clínico es requerido.");
      setStep(3);
      return;
    }
    if (archivos.some((a) => a.uploading)) {
      addToast(
        "error",
        "Espera a que terminen de cargarse todas las imágenes."
      );
      return;
    }
    if (tratamientos.length === 0) {
      addToast(
        "error",
        "Debe agregar al menos un tratamiento antes de finalizar la consulta."
      );
      setStep(3);
      return;
    }

    setSaving(true);

    // ── Crear planes pendientes antes de guardar la consulta ──
    let tratamientosFinal = [...tratamientos];
    if (pendingPlans.length > 0) {
      for (const plan of pendingPlans) {
        const treatmentExists = tratamientosFinal.some(
          (t) => t.id === plan.treatmentId
        );
        if (!treatmentExists) continue;
        try {
          const res = await tratamientoPacienteService.create({
            pacienteId: patient.id_persona,
            nombre: plan.nombre,
            costoTotal: plan.costoTotal,
            fechaInicio: plan.fechaInicio,
          });
          const planData = res.data;
          if (res.success && planData?.id) {
            tratamientosFinal = tratamientosFinal.map((t) =>
              t.id === plan.treatmentId
                ? { ...t, tratamientoPacienteId: planData.id }
                : t
            );
          } else {
            throw new Error(res.message || "Error al crear el plan");
          }
        } catch (e: any) {
          addToast("error", e?.message || "Error al crear plan de tratamiento");
          setSaving(false);
          return;
        }
      }
      setPendingPlans([]);
      setTratamientos(tratamientosFinal);
    }

    const fechaISO = new Date(`${fecha}T${hora}:00`).toISOString();
    const idUsuario = doctor?.id_usuario ?? 1;

    // Prepare tratamientos payload
    const catalogTratamientosPayload = tratamientosFinal
      .filter((t) => t.id_tratamiento && !t.tratamientoPacienteId)
      .map((t) => ({
        id_tratamiento: t.id_tratamiento!,
        precio: t.precio,
        descuento: 0,
      }));

    // Free concepts + plan items (those without catalog id go to text)
    const planItems = tratamientosFinal.filter((t) => t.tratamientoPacienteId);
    const freeConceptsText = tratamientosFinal
      .filter((t) => !t.id_tratamiento && !t.tratamientoPacienteId)
      .map(
        (t) =>
          `${t.nombre} — L. ${t.precio.toLocaleString("es-HN", {
            minimumFractionDigits: 2,
          })}`
      )
      .join("\n");

    const planText = planItems
      .map(
        (t) =>
          `${t.nombre} — L. ${t.precio.toLocaleString("es-HN", {
            minimumFractionDigits: 2,
          })}`
      )
      .join("\n");

    const finalTratamientoText =
      [
        ...(catalogTratamientosPayload.length > 0
          ? ["Servicios del catálogo facturados por separado."]
          : []),
        ...(freeConceptsText ? [`Conceptos libres:\n${freeConceptsText}`] : []),
        ...(planText ? [`Planes activos:\n${planText}`] : []),
      ].join("\n") || undefined;

    const respuestasArr: RespuestaConsulta[] = Object.entries(respuestas)
      .filter(
        ([_, v]) =>
          v.respuestaBoolean !== undefined ||
          (v.explanation && v.explanation.trim())
      )
      .map(([id, v]) => ({
        id_pregunta: Number(id),
        respuestaBoolean: v.respuestaBoolean,
        explanation: v.explanation?.trim() || undefined,
      }));

    const payload: Record<string, any> = {
      id_usuario: idUsuario,
      fecha_inicio: fechaISO,
      fecha_fin: new Date().toISOString(),
      motivo: motivoFinal.trim() || undefined,
      diagnostico: diagnostico.trim() || undefined,
      tratamiento: finalTratamientoText,
      notas_adicionales: notas.trim() || undefined,
      tratamientos:
        catalogTratamientosPayload.length > 0
          ? catalogTratamientosPayload
          : undefined,
      respuestas: respuestasArr.length > 0 ? respuestasArr : undefined,
    };

    const primerPlanId = planItems[0]?.tratamientoPacienteId;
    if (primerPlanId) {
      payload.tratamientoPacienteId = primerPlanId;
    }

    try {
      const res = await expedientService.registrarConsulta(
        patient.id_persona,
        payload as RegistrarConsultaPayload
      );
      if (res.success) {
        const consultaId = res.data?.consulta?.id_consulta;

        // Subir archivos y vincularlos a la consulta
        if (consultaId && archivos.length > 0) {
          const archivosVinculados: Array<{
            nombre: string;
            url: string;
            categoria: string;
          }> = [];

          for (const archivo of archivos) {
            const formData = new FormData();
            formData.append("file", archivo.file);

            try {
              const uploadRes = await api.post("/upload/single", formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
              if (uploadRes.data?.success) {
                archivosVinculados.push({
                  nombre: archivo.file.name,
                  url: uploadRes.data.data.filename,
                  categoria: "Imagen",
                });
              }
            } catch {
              /* ignore single file error */
            }
          }

          if (archivosVinculados.length > 0) {
            try {
              await api.post(
                `/expediente-clinico/${patient.id_persona}/visits/${consultaId}/archivos`,
                {
                  archivos: archivosVinculados,
                }
              );
            } catch {
              /* ignore link error */
            }
          }
        }

        if (consultaId && teethState && modifiedTeethList.length > 0) {
          try {
            const items = modifiedTeethList.map((num) => ({
              id_diente: num,
              estado: teethState[num].state,
              observacion: teethState[num].observation || undefined,
            }));
            await odontogramaService.bulkSave(consultaId, items);
          } catch {
            /* ignore odontogram save error */
          }
        }

        clearOdontogramaDraft(patient.id_persona);

        addToast("success", res.message || "Consulta registrada exitosamente");
        setTimeout(onSave, 1000);
      } else {
        addToast("error", res.message || "Error al guardar la consulta.");
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        "Error al guardar la consulta.";
      addToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseOdontogram = useCallback(() => {
    syncOdontogramDraft();
    setShowOdontogram(false);
  }, [syncOdontogramDraft]);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (showOdontogram) {
    return (
      <div
        style={{
          animation: "slideIn 0.2s ease",
          background: "#F8F9FA",
          padding: 20,
          borderRadius: 12,
          border: `1px solid ${C.gray300}`,
        }}
      >
        <Toast
          toasts={toasts}
          remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            borderBottom: `1px solid ${C.gray100}`,
            paddingBottom: 12,
          }}
        >
          <button
            onClick={handleCloseOdontogram}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.gray500,
              fontSize: 13,
              padding: 0,
            }}
          >
            <ChevronLeft size={16} /> Volver al formulario de consulta
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>
            Odontograma de la Consulta
          </div>
          <div style={{ fontSize: 13, color: C.gray700 }}>
            Paciente:{" "}
            <strong style={{ color: C.primary }}>
              {primerNombre} {primerApellido}
            </strong>
          </div>
        </div>
        <OdontogramScreen
          isEmbedded={true}
          patientId={patient.id_persona}
          patientName={`${primerNombre} ${primerApellido}`}
          patientIdentidad={identidad}
          initialDentition={
            calcularEdad(patient.fecha_nacimiento) < 12 ? "child" : "adult"
          }
          initialTeeth={teethState}
          initialModifiedTeeth={modifiedTeethList}
          embeddedDoctorName={
            doctor
              ? `${doctor.primer_nombre} ${doctor.primer_apellido}`
              : undefined
          }
          onSaveEmbedded={(updatedTeeth, modifiedList) => {
            setTeethState(updatedTeeth);
            setModifiedTeethList(modifiedList);
            setModifiedTeethCount(modifiedList.length);
            setShowOdontogram(false);
            addToast(
              "success",
              modifiedList.length > 0
                ? `Odontograma actualizado. Se modificaron ${modifiedList.length} piezas.`
                : "Odontograma revisado sin cambios pendientes."
            );
          }}
          onCancelEmbedded={handleCloseOdontogram}
        />
      </div>
    );
  }

  return (
    <>
      <style>{`
                @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

      <Toast
        toasts={toasts}
        remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: isMobile ? 10 : 0,
            borderBottom: `1px solid ${C.gray300}`,
            paddingBottom: 12,
          }}
        >
          <button
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.gray500,
              fontSize: 13,
              padding: 0,
            }}
          >
            <ChevronLeft size={16} /> Volver al expediente
          </button>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: C.navy,
              order: isMobile ? -1 : 0,
            }}
          >
            Registrar Nueva Consulta
          </div>
          <div style={{ fontSize: 13, color: C.gray700 }}>
            Paciente seleccionado:{" "}
            <strong style={{ color: C.primary }}>
              {[
                patient.primer_nombre,
                patient.segundo_nombre,
                patient.primer_apellido,
                patient.segundo_apellido,
              ]
                .filter(Boolean)
                .join(" ")}
            </strong>
          </div>
        </div>

        {/* ── Stepper ── */}
        <StepperBar step={step} />

        {/* ══════════════════════════════════════════════════════════════════
                    STEP 1 — Datos de Cita y Paciente
                ══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 1. Datos de la Cita */}
            <SectionCard
              icon={<Clock size={17} />}
              title="Información de la Cita / Doctor"
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                }}
              >
                <div>
                  <FieldLabel required>Fecha de consulta</FieldLabel>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${C.gray300}`,
                      borderRadius: 8,
                      fontSize: 13,
                      color: C.navy,
                      background: C.white,
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <FieldLabel required>Hora de consulta</FieldLabel>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${C.gray300}`,
                      borderRadius: 8,
                      fontSize: 13,
                      color: C.navy,
                      background: C.white,
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <FieldLabel required>Doctor responsable</FieldLabel>
                  <select
                    value={doctor?.id_usuario}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const selected =
                        doctores.find((d) => d.id_usuario === id) || null;
                      setDoctor(selected);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: `1px solid ${C.gray300}`,
                      borderRadius: 8,
                      fontSize: 13,
                      color: C.navy,
                      background: C.white,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    {doctores.map((d) => (
                      <option key={d.id_usuario} value={d.id_usuario}>
                        {`${d.sexo === "M" ? "Dr. " : "Dra. "}`}
                        {d.primer_nombre} {d.primer_apellido}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </SectionCard>

            {/* 2. Datos del Paciente (Autocompletado) */}
            <SectionCard
              icon={<User size={17} />}
              title="Información Personal (Autocompletado del Expediente)"
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
                  gap: 16,
                }}
              >
                <div style={{ gridColumn: isMobile ? "span 1" : "span 1" }}>
                  <FieldLabel>Primer Nombre</FieldLabel>
                  <TextInput
                    value={primerNombre}
                    readOnly
                    placeholder="Primer nombre"
                  />
                </div>
                <div style={{ gridColumn: isMobile ? "span 1" : "span 1" }}>
                  <FieldLabel>Segundo Nombre</FieldLabel>
                  <TextInput
                    value={segundoNombre}
                    readOnly
                    placeholder="Segundo nombre"
                  />
                </div>
                <div style={{ gridColumn: isMobile ? "span 1" : "span 1" }}>
                  <FieldLabel>Primer Apellido</FieldLabel>
                  <TextInput
                    value={primerApellido}
                    readOnly
                    placeholder="Primer apellido"
                  />
                </div>
                <div style={{ gridColumn: isMobile ? "span 1" : "span 1" }}>
                  <FieldLabel>Segundo Apellido</FieldLabel>
                  <TextInput
                    value={segundoApellido}
                    readOnly
                    placeholder="Segundo apellido"
                  />
                </div>
                <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
                  <FieldLabel>Nº Identidad</FieldLabel>
                  <TextInput
                    value={identidad}
                    readOnly
                    placeholder="Número de identidad"
                  />
                </div>
                <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
                  <FieldLabel>Fecha de Nacimiento</FieldLabel>
                  <TextInput
                    type="date"
                    value={formatDate(fechaNacimiento)}
                    readOnly
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
                  <FieldLabel>Teléfono</FieldLabel>
                  <TextInput
                    value={telefono}
                    readOnly
                    placeholder="Número de teléfono"
                  />
                </div>
                <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
                  <FieldLabel>Correo Electrónico</FieldLabel>
                  <TextInput
                    value={correo}
                    readOnly
                    placeholder="Correo electrónico"
                  />
                </div>
                <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
                  <FieldLabel>Departamento</FieldLabel>
                  <TextInput
                    value={departamento}
                    readOnly
                    placeholder="Departamento de residencia"
                  />
                </div>
                <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}>
                  <FieldLabel>Ciudad / Municipio</FieldLabel>
                  <TextInput
                    value={ciudad}
                    readOnly
                    placeholder="Ciudad o municipio de residencia"
                  />
                </div>
                <div style={{ gridColumn: isMobile ? "span 1" : "span 4" }}>
                  <FieldLabel>Dirección Completa</FieldLabel>
                  <Textarea
                    value={direccion}
                    readOnly
                    placeholder="Dirección exacta de residencia..."
                    rows={2}
                  />
                </div>
              </div>
            </SectionCard>

            {/* 3. Antecedentes y Estado Salud */}
            <SectionCard
              icon={<ShieldAlert size={17} />}
              title="Historial Clínico y Estado de Salud"
            >
              <ConsultationQuestions
                preguntas={preguntas}
                respuestas={respuestas || {}}
                onPreguntasChange={setPreguntas}
                onRespuestaChange={(id, field, value) =>
                  setRespuestas((prev) => ({
                    ...prev,
                    [id]: { ...prev?.[id], [field]: value },
                  }))
                }
                onError={(msg) => addToast("error", msg)}
                onSuccess={(msg) => addToast("success", msg)}
              />
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
                    STEP 2 — Odontograma
                ══════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Odontograma Access Box */}
            <div
              style={{
                background: `linear-gradient(135deg, ${C.primaryBg}, #d0f4fa)`,
                border: `1.5px solid ${C.primary}`,
                borderRadius: 16,
                padding: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.navy,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ToothIcon size={18} color={C.primary} /> Odontograma de la
                  Consulta
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: C.gray700,
                    marginTop: 6,
                    maxWidth: 600,
                  }}
                >
                  Actualiza el odontograma del paciente en tiempo real.
                </div>
                {modifiedTeethCount > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.success,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Check size={14} /> Se modificaron {modifiedTeethCount}{" "}
                    piezas dentales en esta sesión (guardado localmente).
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowOdontogram(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: C.primary,
                  color: C.white,
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                  width: isMobile ? "100%" : undefined,
                }}
              >
                <ToothIcon size={16} /> Abrir Odontograma Interactivo
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
                    STEP 3 — Diagnóstico, Archivos y Tratamientos
                ══════════════════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 1. Diagnóstico y Notas */}
            <SectionCard
              icon={<Stethoscope size={17} />}
              title="Diagnóstico Clínico y Notas"
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <div>
                  <FieldLabel required>Diagnóstico de evolución</FieldLabel>
                  <Textarea
                    value={diagnostico}
                    onChange={setDiagnostico}
                    placeholder="Describa el diagnóstico clínico completo de la consulta..."
                    rows={3}
                  />
                </div>
                <div>
                  <FieldLabel>Notas clínicas adicionales</FieldLabel>
                  <Textarea
                    value={notas}
                    onChange={setNotas}
                    placeholder="Indicaciones para el hogar, receta de analgésicos, recordatorios para la recepción..."
                    rows={2}
                  />
                </div>
              </div>
            </SectionCard>

            {/* 2. Carga de Archivos */}
            <SectionCard
              icon={<ImageIcon size={17} />}
              title="Radiografías y Fotos Clínicas"
            >
              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? C.primary : C.gray300}`,
                  borderRadius: 12,
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  background: isDragging ? C.primaryBg : C.gray50,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: C.primaryBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Upload size={20} color={C.primary} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                    Arrastra imágenes aquí
                  </div>
                  <div style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>
                    o haz clic para seleccionar · PNG, JPEG · Máx. 10 MB por
                    archivo
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={(e) => processFiles(e.target.files)}
                />
              </div>

              {/* Previews */}
              {archivos.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.gray500,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 12,
                    }}
                  >
                    {archivos.length} archivo{archivos.length !== 1 ? "s" : ""}{" "}
                    cargado{archivos.length !== 1 ? "s" : ""}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {archivos.map((archivo) => (
                      <div
                        key={archivo.id}
                        style={{
                          position: "relative",
                          borderRadius: 10,
                          overflow: "hidden",
                          border: `1px solid ${C.gray300}`,
                          background: C.gray50,
                        }}
                      >
                        <img
                          src={archivo.preview}
                          alt={archivo.file.name}
                          style={{
                            width: "100%",
                            height: 90,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                        {archivo.uploading && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(32,63,73,0.55)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Loader2
                              size={18}
                              color="#fff"
                              style={{ animation: "spin 1s linear infinite" }}
                            />
                          </div>
                        )}
                        {!archivo.uploading && (
                          <div
                            style={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: C.success,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check size={10} color="#fff" />
                          </div>
                        )}
                        <button
                          onClick={() =>
                            setArchivos((prev) =>
                              prev.filter((a) => a.id !== archivo.id)
                            )
                          }
                          style={{
                            position: "absolute",
                            top: 6,
                            left: 6,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: C.danger,
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <X size={10} color="#fff" />
                        </button>
                        <div
                          style={{ padding: "6px 8px", background: C.white }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 500,
                              color: C.navy,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {archivo.file.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* 3. Selección de Tratamientos */}
            <SectionCard
              icon={<Search size={17} />}
              title="Selección de Tratamientos y Facturación"
            >
              <div
                style={{
                  background: `linear-gradient(135deg, ${C.primaryBg}, #d0f4fa)`,
                  border: `1.5px solid ${C.primary}`,
                  borderRadius: 12,
                  padding: "20px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: C.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.white,
                      boxShadow: "0 4px 12px rgba(11, 197, 223, 0.3)",
                    }}
                  >
                    <Search size={18} />
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 14, fontWeight: 700, color: C.navy }}
                    >
                      Buscador de Servicios
                    </div>
                    <div
                      style={{ fontSize: 12, color: C.gray700, marginTop: 2 }}
                    >
                      Escribe para buscar tratamientos del catálogo y agrégalos
                      a la consulta
                    </div>
                  </div>
                </div>
                <div ref={searchRef} style={{ position: "relative" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      border: `2px solid ${C.primary}`,
                      borderRadius: 10,
                      padding: "0 14px",
                      height: 48,
                      background: C.white,
                      boxShadow: "0 2px 8px rgba(11, 197, 223, 0.12)",
                    }}
                  >
                    <Search size={18} color={C.primary} />
                    <input
                      value={busqueda}
                      onChange={(e) => {
                        setBusqueda(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Buscar tratamiento por nombre..."
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        fontSize: 14,
                        fontWeight: 500,
                        color: C.navy,
                        background: "transparent",
                      }}
                    />
                    {loadingTratamientos && (
                      <Loader2
                        size={16}
                        color={C.gray500}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    )}
                    {busqueda && (
                      <button
                        onClick={() => {
                          setBusqueda("");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          color: C.gray500,
                          padding: 4,
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        color: C.gray500,
                        padding: 4,
                        borderLeft: `1px solid ${C.gray300}`,
                        marginLeft: 4,
                      }}
                    >
                      <ChevronDown
                        size={18}
                        style={{
                          transform: showSuggestions
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                  </div>

                  {/* Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: C.white,
                        border: `2px solid ${C.primary}`,
                        borderRadius: 10,
                        marginTop: 4,
                        boxShadow: "0 12px 32px rgba(11, 197, 223, 0.2)",
                        zIndex: 9999,
                        overflowY: "auto",
                        maxHeight: 280,
                      }}
                    >
                      <div
                        style={{
                          padding: "8px 14px",
                          fontSize: 11,
                          fontWeight: 600,
                          color: C.gray500,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          borderBottom: `1px solid ${C.gray100}`,
                          background: C.gray50,
                        }}
                      >
                        {suggestions.length} tratamiento
                        {suggestions.length !== 1 ? "s" : ""} encontrado
                        {suggestions.length !== 1 ? "s" : ""}
                      </div>
                      {suggestions.map((t) => (
                        <button
                          key={t.id}
                          onMouseDown={() => addTratamiento(t)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: 13,
                            color: C.navy,
                            textAlign: "left",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = C.gray50;
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = "none";
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>{t.nombre}</span>
                          <span
                            style={{
                              fontWeight: 700,
                              color: C.success,
                              fontSize: 14,
                            }}
                          >
                            L. {t.precio.toLocaleString("es-HN")}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Concepto libre */}
              <div
                style={{
                  background: C.gray50,
                  border: `1px solid ${C.gray100}`,
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  <Tag size={14} color={C.warning} />
                  <span
                    style={{ fontSize: 12, fontWeight: 600, color: C.navy }}
                  >
                    Agregar concepto libre (no en catálogo)
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    value={conceptoLibre}
                    onChange={(e) => setConceptoLibre(e.target.value)}
                    placeholder="Nombre del servicio o concepto"
                    style={{
                      flex: 1,
                      minWidth: 200,
                      padding: "9px 12px",
                      border: `1px solid ${C.gray300}`,
                      borderRadius: 8,
                      fontSize: 13,
                      color: C.navy,
                      outline: "none",
                      background: C.white,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      border: `1px solid ${C.gray300}`,
                      borderRadius: 8,
                      padding: "0 10px",
                      background: C.white,
                    }}
                  >
                    <span style={{ fontSize: 12, color: C.gray500 }}>L.</span>
                    <input
                      value={precioLibre}
                      onChange={(e) => setPrecioLibre(e.target.value)}
                      placeholder="0.00"
                      type="number"
                      min="0"
                      style={{
                        width: 90,
                        border: "none",
                        outline: "none",
                        fontSize: 13,
                        color: C.navy,
                        background: "transparent",
                      }}
                    />
                  </div>
                  <button
                    onClick={addConceptoLibre}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: C.warning,
                      color: C.white,
                      border: "none",
                      borderRadius: 8,
                      padding: "9px 16px",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    <Plus size={15} /> Agregar
                  </button>
                </div>
              </div>

              {/* Treatment list */}
              {tratamientos.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "28px 0",
                    color: C.gray500,
                    fontSize: 13,
                    border: `1px dashed ${C.gray300}`,
                    borderRadius: 8,
                  }}
                >
                  <FileText
                    size={28}
                    style={{
                      marginBottom: 8,
                      opacity: 0.35,
                      display: "inline-block",
                    }}
                  />
                  <div>
                    No se han seleccionado tratamientos. Completa el odontograma
                    en el Paso 2 o agrega servicios manualmente arriba.
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {tratamientos.map((t, idx) => {
                    const isPlan = !!t.tratamientoPacienteId;
                    const isCreating = planForm.treatmentId === t.id;
                    const isPendingPlan = pendingPlans.some(
                      (p) => p.treatmentId === t.id
                    );
                    return (
                      <div
                        key={t.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          background: C.white,
                          border: `1.5px solid ${
                            isCreating ? C.primary : C.gray300
                          }`,
                          borderRadius: 10,
                          overflow: "hidden",
                          boxShadow: isCreating
                            ? "0 4px 16px rgba(11, 197, 223, 0.15)"
                            : "0 1px 4px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: isMobile ? "column" : "row",
                            justifyContent: "space-between",
                            alignItems: isMobile ? "stretch" : "center",
                            gap: isMobile ? 10 : 0,
                            padding: isMobile ? "14px 16px" : "16px 18px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: C.gray500,
                              }}
                            >
                              {isPlan
                                ? "Plan activo"
                                : isPendingPlan
                                ? "Plan pendiente"
                                : `Item ${idx + 1}`}
                            </span>
                            <span
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: C.navy,
                              }}
                            >
                              {t.nombre}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: isMobile
                                ? "space-between"
                                : "flex-end",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 16,
                                fontWeight: 800,
                                color: C.success,
                              }}
                            >
                              L.{" "}
                              {t.precio.toLocaleString("es-HN", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            {!isPlan && !isCreating && !isPendingPlan && (
                              <button
                                onClick={() => initPlanForm(t)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  background: C.primary,
                                  color: C.white,
                                  border: "none",
                                  borderRadius: 8,
                                  padding: "6px 12px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  boxShadow: `0 4px 12px ${C.primary}55`,
                                }}
                              >
                                <ClipboardList size={13} /> Crear Plan
                              </button>
                            )}
                            {isPlan && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "4px 10px",
                                  borderRadius: 12,
                                  background: C.primaryBg,
                                  color: C.primary,
                                  border: `1px solid ${C.primary}33`,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Plan activo
                              </span>
                            )}
                            {isPendingPlan && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "4px 10px",
                                  borderRadius: 12,
                                  background: "#fff7e6",
                                  color: C.warning,
                                  border: `1px solid ${C.warning}44`,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                Pendiente
                              </span>
                            )}
                            {!isPlan && (
                              <button
                                onClick={() => {
                                  setTratamientos((prev) =>
                                    prev.filter((x) => x.id !== t.id)
                                  );
                                  setPendingPlans((prev) =>
                                    prev.filter((p) => p.treatmentId !== t.id)
                                  );
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  color: C.danger,
                                  padding: 4,
                                }}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </div>

                        {isCreating && (
                          <div
                            style={{
                              borderTop: `1px solid ${C.gray100}`,
                              padding: "18px",
                              background: C.gray50,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: C.navy,
                                marginBottom: 14,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <ClipboardList size={15} color={C.primary} />{" "}
                              Nuevo Plan de Tratamiento
                            </div>
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: isMobile
                                  ? "1fr"
                                  : "1fr 1fr 1fr",
                                gap: 12,
                                marginBottom: 14,
                              }}
                            >
                              <div>
                                <FieldLabel>Nombre del plan</FieldLabel>
                                <input
                                  value={planForm.nombre}
                                  onChange={(e) =>
                                    setPlanForm((prev) => ({
                                      ...prev,
                                      nombre: e.target.value,
                                    }))
                                  }
                                  placeholder="Nombre del plan"
                                  style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: `1px solid ${C.gray300}`,
                                    borderRadius: 8,
                                    fontSize: 13,
                                    color: C.navy,
                                    outline: "none",
                                    background: C.white,
                                    boxSizing: "border-box",
                                  }}
                                />
                              </div>
                              <div>
                                <FieldLabel>Costo total (L.)</FieldLabel>
                                <input
                                  value={planForm.costoTotal}
                                  onChange={(e) =>
                                    setPlanForm((prev) => ({
                                      ...prev,
                                      costoTotal: e.target.value,
                                    }))
                                  }
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: `1px solid ${C.gray300}`,
                                    borderRadius: 8,
                                    fontSize: 13,
                                    color: C.navy,
                                    outline: "none",
                                    background: C.white,
                                    boxSizing: "border-box",
                                  }}
                                />
                              </div>
                              <div>
                                <FieldLabel>Fecha de inicio</FieldLabel>
                                <input
                                  value={planForm.fechaInicio}
                                  onChange={(e) =>
                                    setPlanForm((prev) => ({
                                      ...prev,
                                      fechaInicio: e.target.value,
                                    }))
                                  }
                                  type="date"
                                  style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: `1px solid ${C.gray300}`,
                                    borderRadius: 8,
                                    fontSize: 13,
                                    color: C.navy,
                                    outline: "none",
                                    background: C.white,
                                    boxSizing: "border-box",
                                  }}
                                />
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                onClick={() =>
                                  setPlanForm({
                                    treatmentId: null,
                                    nombre: "",
                                    costoTotal: "",
                                    fechaInicio: "",
                                  })
                                }
                                style={{
                                  padding: "8px 16px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: C.white,
                                  color: C.gray500,
                                  border: `1px solid ${C.gray300}`,
                                  cursor: "pointer",
                                }}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleCreatePlan}
                                style={{
                                  padding: "8px 20px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  background: C.primary,
                                  color: C.white,
                                  border: "none",
                                  cursor: "pointer",
                                  boxShadow: `0 4px 12px ${C.primary}55`,
                                }}
                              >
                                Guardar Plan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* 4. Planes activos del paciente */}
            <SectionCard
              icon={<Activity size={17} />}
              title="Planes de Tratamiento Activos"
            >
              <div
                style={{
                  background: `linear-gradient(135deg, #fff7e6, #fff0cc)`,
                  border: `1.5px solid ${C.warning}`,
                  borderRadius: 12,
                  padding: "20px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: C.warning,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.white,
                      boxShadow: "0 4px 12px rgba(239, 159, 39, 0.3)",
                    }}
                  >
                    <Search size={18} />
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 14, fontWeight: 700, color: C.navy }}
                    >
                      Buscador de Planes Activos
                    </div>
                    <div
                      style={{ fontSize: 12, color: C.gray700, marginTop: 2 }}
                    >
                      Busca y selecciona planes activos del paciente para
                      agregarlos a esta consulta
                    </div>
                  </div>
                </div>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      border: `2px solid ${C.warning}`,
                      borderRadius: 10,
                      padding: "0 14px",
                      height: 48,
                      background: C.white,
                      boxShadow: "0 2px 8px rgba(239, 159, 39, 0.12)",
                    }}
                  >
                    <Search size={18} color={C.warning} />
                    <input
                      value={busquedaPlan}
                      onChange={(e) => setBusquedaPlan(e.target.value)}
                      placeholder="Buscar plan activo por nombre..."
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        fontSize: 14,
                        fontWeight: 500,
                        color: C.navy,
                        background: "transparent",
                      }}
                    />
                    {busquedaPlan && (
                      <button
                        onClick={() => setBusquedaPlan("")}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          color: C.gray500,
                          padding: 4,
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {tratamientosPaciente.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "28px 0",
                    color: C.gray500,
                    fontSize: 13,
                    border: `1px dashed ${C.gray300}`,
                    borderRadius: 8,
                  }}
                >
                  <div>
                    No hay planes de tratamiento activos para este paciente.
                  </div>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {tratamientosPaciente
                    .filter(
                      (p) =>
                        !busquedaPlan ||
                        p.nombre
                          .toLowerCase()
                          .includes(busquedaPlan.toLowerCase())
                    )
                    .map((plan) => {
                      const yaAgregado = tratamientos.some(
                        (t) => t.tratamientoPacienteId === plan.id
                      );
                      return (
                        <div
                          key={plan.id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            background: C.white,
                            border: `1.5px solid ${
                              yaAgregado ? C.success : C.gray300
                            }`,
                            borderRadius: 10,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: isMobile ? "column" : "row",
                              justifyContent: "space-between",
                              alignItems: isMobile ? "stretch" : "center",
                              gap: isMobile ? 6 : 0,
                              padding: isMobile ? "12px 16px" : "14px 18px",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 15,
                                  fontWeight: 700,
                                  color: C.navy,
                                }}
                              >
                                {plan.nombre}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: C.gray500,
                                  marginTop: 4,
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 4,
                                }}
                              >
                                <span>
                                  Costo total:{" "}
                                  <strong>
                                    L. {plan.costoTotal.toLocaleString("es-HN")}
                                  </strong>
                                </span>
                                <span>
                                  &nbsp;·&nbsp; Abonado:{" "}
                                  <strong>
                                    L.{" "}
                                    {plan.totalAbonado.toLocaleString("es-HN")}
                                  </strong>
                                </span>
                                <span>
                                  &nbsp;·&nbsp; Saldo:{" "}
                                  <strong>
                                    L.{" "}
                                    {plan.saldoPendiente.toLocaleString(
                                      "es-HN"
                                    )}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </div>
                          {!yaAgregado && (
                            <div
                              style={{
                                borderTop: `1px solid ${C.gray100}`,
                                padding: "12px 18px",
                                display: "flex",
                                justifyContent: "flex-end",
                                background: C.gray50,
                              }}
                            >
                              <button
                                onClick={() => {
                                  setTratamientos((prev) => [
                                    ...prev,
                                    {
                                      id: uid(),
                                      nombre: `${plan.nombre} (Plan activo)`,
                                      precio: 0,
                                      tratamientoPacienteId: plan.id,
                                    },
                                  ]);
                                }}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: C.success,
                                  color: C.white,
                                  border: "none",
                                  borderRadius: 8,
                                  padding: "7px 16px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                <Plus size={14} /> Agregar a consulta
                              </button>
                            </div>
                          )}
                          {yaAgregado && (
                            <div
                              style={{
                                borderTop: `1px solid ${C.success}20`,
                                padding: "10px 18px",
                                background: "rgba(29,158,117,0.06)",
                                fontSize: 12,
                                fontWeight: 600,
                                color: C.success,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <Check size={14} /> Ya agregado a la consulta
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            gap: isMobile ? 10 : 0,
            paddingTop: 8,
            borderTop: `1px solid ${C.gray300}`,
          }}
        >
          <Button
            variant="secondary"
            onClick={
              step === 1 ? onBack : () => setStep((s) => (s - 1) as Step)
            }
            style={isMobile ? { width: "100%", order: 2 } : undefined}
          >
            {step === 1 ? "Cancelar" : "← Anterior"}
          </Button>

          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 10,
              order: isMobile ? 1 : undefined,
            }}
          >
            {step < 3 && (
              <Button
                style={isMobile ? { width: "100%" } : undefined}
                onClick={() => {
                  if (step === 1) {
                    // Patient info validation
                    if (identidad && !/^\d{13}$/.test(identidad)) {
                      addToast(
                        "error",
                        "El número de identidad debe contener exactamente 13 números, sin guiones."
                      );
                      return;
                    }
                    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
                      addToast(
                        "error",
                        "El formato del correo electrónico es inválido."
                      );
                      return;
                    }
                    if (
                      telefono &&
                      !/^\d{8,}$/.test(telefono.replace(/\D/g, ""))
                    ) {
                      addToast(
                        "error",
                        "El número de teléfono debe tener al menos 8 dígitos."
                      );
                      return;
                    }
                    // Questions validation (only required ones)
                    for (const pq of preguntas) {
                      if (!pq.obligatorio) continue;
                      const resp = respuestas[pq.id_pregunta] || {};
                      if (pq.requiere_explicacion) {
                        if (resp.respuestaBoolean === undefined) {
                          addToast(
                            "error",
                            `Falta responder (Sí/No) a: "${pq.pregunta}"`
                          );
                          return;
                        }
                        if (
                          resp.respuestaBoolean === true &&
                          (!resp.explanation || !resp.explanation.trim())
                        ) {
                          addToast(
                            "error",
                            `Falta brindar explicación en: "${pq.pregunta}"`
                          );
                          return;
                        }
                      } else {
                        if (!resp.explanation || !resp.explanation.trim()) {
                          addToast(
                            "error",
                            `Falta responder la pregunta: "${pq.pregunta}"`
                          );
                          return;
                        }
                      }
                    }
                  }
                  setStep((s) => (s + 1) as Step);
                }}
              >
                Siguiente →
              </Button>
            )}
            {step === 3 && (
              <Button
                onClick={handleSave}
                loading={saving}
                style={{
                  background: saving
                    ? undefined
                    : "var(--arco-success, #1D9E75)",
                  borderColor: saving
                    ? undefined
                    : "var(--arco-success, #1D9E75)",
                  ...(isMobile ? { width: "100%" } : {}),
                }}
              >
                <Check size={15} /> Guardar Consulta
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirmModal(false);
          }}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 16,
              maxWidth: "500px",
              width: "100%",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #0BC5DF, #08a3b9)",
                padding: "20px 24px",
                color: C.white,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <ShieldAlert size={20} /> Confirmar Guardado de Consulta
              </div>
            </div>
            {/* Modal Body */}
            <div style={{ padding: "24px" }}>
              <div style={{ fontSize: 14, color: C.navy, marginBottom: 16 }}>
                Está a punto de guardar la consulta médica del paciente{" "}
                <strong style={{ color: C.primary }}>
                  {primerNombre} {primerApellido}
                </strong>
                .
              </div>
              <div
                style={{
                  background: C.primaryBg,
                  borderLeft: `4px solid ${C.primary}`,
                  padding: "12px 16px",
                  borderRadius: 8,
                  fontSize: 13,
                  color: C.navy,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  Por favor, verifique que:
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <li>Los datos del paciente sean correctos</li>
                  <li>El odontograma esté actualizado (si aplica)</li>
                  <li>El diagnóstico y las notas estén completos</li>
                  <li>
                    Los archivos adjuntos (radiografías, fotos) estén cargados
                  </li>
                </ul>
              </div>
            </div>
            {/* Modal Footer */}
            <div
              style={{
                borderTop: `1px solid ${C.gray100}`,
                padding: "16px 24px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <Button
                variant="secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={performSave}
                style={{
                  background: "var(--arco-success, #1D9E75)",
                  borderColor: "var(--arco-success, #1D9E75)",
                }}
              >
                <Check size={15} /> Confirmar y Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
