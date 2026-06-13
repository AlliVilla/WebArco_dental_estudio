import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Stethoscope, CheckCircle } from "lucide-react";
import { Input, Combobox, Button, Alert } from "../../../context";
import { treatmentService, especialidadService } from "../services/treatmentService";
import { type TreatmentInput, type Especialidad, ESTADOS_ODONTOGRAMA } from "../types";

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
  impactoOdontograma: "",
  precio: 0,
};

export interface TreatmentFormProps {
  mode: "create" | "edit";
}

export function TreatmentForm({ mode }: TreatmentFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<TreatmentInput>(EMPTY);
  const [especialidadText, setEspecialidadText] = useState("");
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    especialidadService.getAll()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setEspecialidades(Array.isArray(data) ? data : []);
      })
      .catch(() => setAlert({ variant: "error", message: "Error al cargar especialidades." }));

    if (mode === "edit" && id) {
      treatmentService.getById(Number(id))
        .then((res) => {
          const t = res.data?.data ?? res.data;
          if (t) {
            setFormData({
              idEspecialidad: t.idEspecialidad,
              nombre: t.nombre,
              descripcion: t.descripcion ?? "",
              impactoOdontograma: t.impactoOdontograma,
              precio: t.precio,
            });
            setEspecialidadText(t.especialidad);
          }
        })
        .catch(() => {
          setAlert({ variant: "error", message: "Error al cargar el tratamiento." });
          navigate("/treatments");
        });
    }
  }, [mode, id, navigate]);

  function setField<K extends keyof TreatmentInput>(key: K, value: TreatmentInput[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function stripAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  async function handleSave() {
    const text = especialidadText.trim();
    if (!text || !formData.nombre || !formData.impactoOdontograma || formData.precio <= 0) {
      setAlert({
        variant: "error",
        message: "Por favor complete todos los campos obligatorios. El precio debe ser mayor a 0.",
      });
      setTimeout(() => setAlert(null), 4000);
      return;
    }
    setSaving(true);

    try {
      const plainText = stripAccents(text).toLowerCase();
      const match = especialidades.find(
        (e) => stripAccents(e.nombre).toLowerCase() === plainText,
      );
      let idEspecialidad = match ? match.id : 0;

      if (!match) {
        const res = await especialidadService.create(text);
        const created = res.data?.data ?? res.data;
        idEspecialidad = created.id;
        setEspecialidades((prev) => [...prev, created]);
      }

      const payload = { ...formData, idEspecialidad };
      const request = mode === "create"
        ? treatmentService.create(payload)
        : treatmentService.update(Number(id), payload);

      await request;
      navigate("/treatments");
    } catch (err: any) {
      const msg = err?.message || "Error al guardar el tratamiento.";
      setAlert({ variant: "error", message: msg });
    } finally {
      setSaving(false);
    }
  }

  const sectionStyle: React.CSSProperties = {
    background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.gray300}`, padding: 24,
  };
  const iconBoxStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 8, background: "rgba(11,197,223,0.1)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <button
        onClick={() => navigate("/treatments")}
        style={{
          display: "flex", alignItems: "center", gap: 8, background: "none",
          border: "none", cursor: "pointer", color: COLORS.gray700,
          fontSize: 14, fontWeight: 500, padding: 0, width: "fit-content",
        }}
      >
        <ArrowLeft size={18} /> Volver al catálogo
      </button>

      {alert && (
        <Alert variant={alert.variant} message={alert.message} onClose={() => setAlert(null)} />
      )}

      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={iconBoxStyle}>
            <FileText size={18} style={{ color: COLORS.primary }} />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.navy, margin: 0 }}>
              Datos del Tratamiento
            </h3>
            <p style={{ fontSize: 12, color: COLORS.gray500, margin: "2px 0 0" }}>
              Información general del procedimiento
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Combobox
            label="Especialidad clínica"
            badge="required"
            value={especialidadText}
            onChange={(v) => setEspecialidadText(v)}
            placeholder="Seleccionar o escribir nueva especialidad"
            options={especialidades.map((e) => ({ value: String(e.id), label: e.nombre }))}
          />

          <Input
            label="Nombre del Tratamiento"
            badge="required"
            placeholder="ej. Profilaxis, Extracción de terceras molares"
            value={formData.nombre}
            onChange={(e) => setField("nombre", e.target.value)}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy }}>
              Precio <span style={{ color: COLORS.danger }}>*</span>
            </label>
            <div style={{
              display: "flex", alignItems: "center", height: 41,
              border: `1px solid ${COLORS.gray300}`, borderRadius: 8, overflow: "hidden",
              background: "#fff",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 12px", height: "100%", background: COLORS.gray50,
                borderRight: `1px solid ${COLORS.gray300}`, fontSize: 13,
                fontWeight: 600, color: COLORS.navy, flexShrink: 0,
              }}>
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
                  if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
                  const parsed = v === "" ? 0 : parseFloat(v);
                  setField("precio", isNaN(parsed) ? 0 : parsed);
                }}
                style={{
                  flex: 1, height: "100%", border: "none", outline: "none",
                  padding: "0 12px", fontSize: 14, color: COLORS.navy, background: "transparent",
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: COLORS.gray500 }}>
              Precio base del tratamiento en Lempiras (HNL)
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy }}>
              Descripción / Notas técnicas
            </label>
            <textarea
              value={formData.descripcion ?? ""}
              onChange={(e) => setField("descripcion", e.target.value)}
              placeholder="Especificaciones, indicaciones o variaciones del procedimiento"
              rows={3}
              style={{
                width: "100%", border: `1px solid ${COLORS.gray300}`, borderRadius: 8,
                padding: "10px 12px", fontSize: 14, color: COLORS.navy,
                outline: "none", resize: "vertical", fontFamily: "inherit",
                background: "#fff", boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={iconBoxStyle}>
            <Stethoscope size={18} style={{ color: COLORS.primary }} />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.navy, margin: 0 }}>
              Integración con Odontograma
            </h3>
            <p style={{ fontSize: 12, color: COLORS.gray500, margin: "2px 0 0" }}>
              Configuración del registro visual automático
            </p>
          </div>
        </div>

        <Combobox
          label="Estado a asignar en Odontograma"
          badge="required"
          value={formData.impactoOdontograma}
          onChange={(v) => setField("impactoOdontograma", v)}
          placeholder="Seleccionar estado"
          options={ESTADOS_ODONTOGRAMA.map((e) => ({ value: e, label: e }))}
        />
        <p style={{ fontSize: 11, color: COLORS.gray500, marginTop: 8 }}>
          Define el cambio gráfico automático en el diente al usar este tratamiento en una consulta
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <Button variant="secondary" size="lg" onClick={() => navigate("/treatments")}>
          Cancelar
        </Button>
        <Button
          variant="primary" size="lg" onClick={handleSave} loading={saving}
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
