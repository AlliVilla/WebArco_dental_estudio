import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle } from "lucide-react";
import { Input, Combobox, Button, Alert } from "../../../context";
import {
  treatmentService,
  especialidadService,
} from "../services/treatmentService";
import { type TreatmentInput, type Especialidad } from "../types";
import { useAuthStore } from "../../../features/auth/hooks/useAuthStore";

function useHasPrivilege(privilegeIds: number[]) {
  const user = useAuthStore((state) => state.user);
  return useMemo(() => {
    if (!user?.privilegios) return false;
    return privilegeIds.some((id) => user.privilegios?.includes(id));
  }, [user?.privilegios]);
}

const COLORS = {
  primary: "#0BC5DF",
  navy: "#203F49",
  danger: "#E24B4A",
  gray50: "#F8F9FA",
  gray300: "#D3D7DA",
  gray500: "#888F94",
  gray700: "#5F656A",
};

const EMPTY: TreatmentInput = {
  idEspecialidad: 0,
  nombre: "",
  descripcion: "",
  precio: 0,
};

export interface TreatmentFormProps {
  mode: "create" | "edit";
}

export function TreatmentForm({ mode }: TreatmentFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hasManagePrivilege = useHasPrivilege([66]);
  const [formData, setFormData] = useState<TreatmentInput>(EMPTY);
  const [especialidadText, setEspecialidadText] = useState("");
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const alertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (alertTimer.current) clearTimeout(alertTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!hasManagePrivilege) {
      navigate("/treatments");
    }
  }, [hasManagePrivilege, navigate]);

  useEffect(() => {
    especialidadService
      .getAll()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setEspecialidades(Array.isArray(data) ? data : []);
      })
      .catch(() =>
        setAlert({
          variant: "error",
          message: "Error al cargar especialidades.",
        })
      );

    if (mode === "edit" && id) {
      treatmentService
        .getById(Number(id))
        .then((res) => {
          const t = res.data?.data ?? res.data;
          if (t) {
            setFormData({
              idEspecialidad: t.idEspecialidad,
              nombre: t.nombre,
              descripcion: t.descripcion ?? "",
              precio: t.precio,
            });
            setEspecialidadText(t.especialidad);
          }
        })
        .catch(() => {
          setAlert({
            variant: "error",
            message: "Error al cargar el tratamiento.",
          });
          navigate("/treatments");
        });
    }
  }, [mode, id, navigate]);

  function setField<K extends keyof TreatmentInput>(
    key: K,
    value: TreatmentInput[K]
  ) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function clearFieldError(field: string) {
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function stripAccents(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function scrollToFirstError() {
    setTimeout(() => {
      const first = document.querySelector<HTMLElement>("[data-field-error]");
      if (first) {
        const rect = first.getBoundingClientRect();
        window.scrollTo({
          top: window.scrollY + rect.top - 100,
          behavior: "smooth",
        });
      }
    }, 0);
  }

  async function handleSave() {
    // Validación por campo con scroll al primero con error
    const errors: Record<string, string> = {};
    if (!especialidadText.trim())
      errors.especialidad = "La especialidad es obligatoria";
    if (!formData.nombre.trim())
      errors.nombre = "El nombre del tratamiento es obligatorio";
    if (formData.precio <= 0) errors.precio = "El precio debe ser mayor a 0";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      scrollToFirstError();
      return;
    }

    setSaving(true);
    setFieldErrors({});

    try {
      const plainText = stripAccents(especialidadText.trim()).toLowerCase();
      const match = especialidades.find(
        (e) => stripAccents(e.nombre).toLowerCase() === plainText
      );
      let idEspecialidad = match ? match.id : 0;

      if (!match) {
        const res = await especialidadService.create(especialidadText.trim());
        const created = res.data?.data ?? res.data;
        idEspecialidad = created.id;
        setEspecialidades((prev) => [...prev, created]);
      }

      const payload = { ...formData, idEspecialidad };
      const request =
        mode === "create"
          ? treatmentService.create(payload)
          : treatmentService.update(Number(id), payload);

      await request;
      setAlert({
        variant: "success",
        message:
          mode === "create"
            ? "Tratamiento creado correctamente."
            : "Tratamiento actualizado correctamente.",
      });
      if (alertTimer.current) clearTimeout(alertTimer.current);
      alertTimer.current = setTimeout(() => navigate("/treatments"), 1500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Error al guardar el tratamiento.";
      setAlert({ variant: "error", message: msg });
      if (alertTimer.current) clearTimeout(alertTimer.current);
      alertTimer.current = setTimeout(() => setAlert(null), 4000);
    } finally {
      setSaving(false);
    }
  }

  const sectionStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 12,
    border: `1px solid ${COLORS.gray300}`,
    padding: 24,
  };
  const iconBoxStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "rgba(11,197,223,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <button
        onClick={() => navigate("/treatments")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: COLORS.gray700,
          fontSize: 14,
          fontWeight: 500,
          padding: 0,
          width: "fit-content",
        }}
      >
        <ArrowLeft size={18} /> Volver al catálogo
      </button>

      {alert && (
        <Alert
          variant={alert.variant}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div style={sectionStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={iconBoxStyle}>
            <FileText size={18} style={{ color: COLORS.primary }} />
          </div>
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: COLORS.navy,
                margin: 0,
              }}
            >
              Datos del Tratamiento
            </h3>
            <p
              style={{ fontSize: 12, color: COLORS.gray500, margin: "2px 0 0" }}
            >
              Información general del procedimiento
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Especialidad */}
          <div
            {...(fieldErrors.especialidad ? { "data-field-error": true } : {})}
          >
            <Combobox
              label="Especialidad clínica"
              badge="required"
              value={especialidadText}
              onChange={(v) => {
                setEspecialidadText(v);
                clearFieldError("especialidad");
              }}
              placeholder="Seleccionar o escribir nueva especialidad"
              options={especialidades.map((e) => ({
                value: String(e.id),
                label: e.nombre,
              }))}
              error={fieldErrors.especialidad}
            />
          </div>

          {/* Nombre */}
          <div {...(fieldErrors.nombre ? { "data-field-error": true } : {})}>
            <Input
              label="Nombre del Tratamiento"
              badge="required"
              placeholder="ej. Profilaxis, Extracción de terceras molares"
              value={formData.nombre}
              onChange={(e) => {
                setField("nombre", e.target.value);
                clearFieldError("nombre");
              }}
              error={fieldErrors.nombre}
            />
          </div>

          {/* Precio */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: 6 }}
            {...(fieldErrors.precio ? { "data-field-error": true } : {})}
          >
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: fieldErrors.precio ? COLORS.danger : COLORS.navy,
              }}
            >
              Precio <span style={{ color: COLORS.danger }}>*</span>
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 41,
                border: `1px solid ${
                  fieldErrors.precio ? COLORS.danger : COLORS.gray300
                }`,
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
                boxShadow: fieldErrors.precio
                  ? `0 0 0 3px rgba(226,75,74,0.1)`
                  : undefined,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 12px",
                  height: "100%",
                  background: COLORS.gray50,
                  borderRight: `1px solid ${COLORS.gray300}`,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.navy,
                  flexShrink: 0,
                }}
              >
                L
              </div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={formData.precio === 0 ? "" : formData.precio}
                onChange={(e) => {
                  let v = e.target.value.replace(/[^0-9.]/g, "");
                  const parts = v.split(".");
                  if (parts.length > 2)
                    v = parts[0] + "." + parts.slice(1).join("");
                  const parsed = v === "" ? 0 : parseFloat(v);
                  setField("precio", isNaN(parsed) ? 0 : parsed);
                  clearFieldError("precio");
                }}
                style={{
                  flex: 1,
                  height: "100%",
                  border: "none",
                  outline: "none",
                  padding: "0 12px",
                  fontSize: 14,
                  color: COLORS.navy,
                  background: "transparent",
                }}
              />
            </div>
            {fieldErrors.precio ? (
              <span style={{ fontSize: 12, color: COLORS.danger }}>
                {fieldErrors.precio}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: COLORS.gray500 }}>
                Precio base del tratamiento en Lempiras (HNL)
              </span>
            )}
          </div>

          {/* Descripción */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy }}
            >
              Descripción / Notas técnicas
            </label>
            <textarea
              value={formData.descripcion ?? ""}
              onChange={(e) => setField("descripcion", e.target.value)}
              placeholder="Especificaciones, indicaciones o variaciones del procedimiento"
              rows={3}
              style={{
                width: "100%",
                border: `1px solid ${COLORS.gray300}`,
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                color: COLORS.navy,
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate("/treatments")}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          loading={saving}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <CheckCircle size={16} />
          {mode === "create" ? "Guardar Tratamiento" : "Actualizar Tratamiento"}
        </Button>
      </div>
    </div>
  );
}

export default TreatmentForm;
