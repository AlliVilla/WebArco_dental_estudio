import { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { Button, Input, Select, Alert } from "../../../../../context";
import { useResponsive } from "../../../../../hooks/useWindowWidth";
import { ConfirmModal } from "../../../../../components/ConfirmModal";
import {
  expedientService,
  type PreguntaConsulta,
} from "../services/expedientService";

// ── Constants ────────────────────────────────────────────────────────────────
const CATEGORIAS_OPTIONS = [
  { value: "Antecedentes Médicos", label: "Antecedentes Médicos" },
  { value: "Antecedentes Odontológicos", label: "Antecedentes Odontológicos" },
  { value: "Motivo de Consulta", label: "Motivo de Consulta" },
  { value: "Otro", label: "Otro" },
];

// ── Design tokens (minimal, only what isn't from UIKit) ───────────────────────
const C = {
  primary: "var(--arco-primary, #0BC5DF)",
  navy: "var(--arco-navy, #203F49)",
  success: "var(--arco-success, #1D9E75)",
  danger: "var(--arco-danger, #E24B4A)",
  gray300: "var(--arco-gray-300, #D3D7DA)",
  gray500: "var(--arco-gray-500, #888F94)",
  white: "#ffffff",
  primaryBg: "var(--accent, #E6F8FB)",
};

// ── Small inline label (not in UIKit – UIKit's label is part of Input props) ──
function QuestionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 11,
        fontWeight: 600,
        color: C.gray500,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: 0,
      }}
    >
      {children}
    </label>
  );
}

// ── Yes / No toggle buttons ───────────────────────────────────────────────────
interface YesNoBtnProps {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}
function YesNoButtons({ value, onChange }: YesNoBtnProps) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {([true, false] as const).map((opt) => {
        const isSelected = value === opt;
        const selectedColor = opt ? C.success : C.danger;
        const selectedBg = opt ? "#E8F7F2" : "#FDF0F0";
        return (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: "4px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              border: `1.5px solid ${isSelected ? selectedColor : C.gray300}`,
              background: isSelected ? selectedBg : C.white,
              color: isSelected ? selectedColor : C.gray500,
            }}
          >
            {opt ? "Sí" : "No"}
          </button>
        );
      })}
    </div>
  );
}

// ── Inline edit form ─────────────────────────────────────────────────────────
interface EditFormProps {
  pregunta: PreguntaConsulta;
  onSave: (updated: PreguntaConsulta) => void;
  onCancel: () => void;
  onError: (msg: string) => void;
}
function EditPreguntaForm({
  pregunta,
  onSave,
  onCancel,
  onError,
}: EditFormProps) {
  const { isMobile } = useResponsive();
  const [text, setText] = useState(pregunta.pregunta);
  const [categoria, setCategoria] = useState(pregunta.categoria);
  const [requiere, setRequiere] = useState(pregunta.requiere_explicacion);
  const [obligatorio, setObligatorio] = useState(pregunta.obligatorio);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) {
      onError("El texto de la pregunta no puede estar vacío.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      if (text.trim() !== pregunta.pregunta) payload.pregunta = text.trim();
      if (categoria !== pregunta.categoria) payload.categoria = categoria;
      if (requiere !== pregunta.requiere_explicacion)
        payload.requiere_explicacion = requiere;
      if (obligatorio !== pregunta.obligatorio)
        payload.obligatorio = obligatorio;
      const res = await expedientService.updatePregunta(
        pregunta.id_pregunta,
        payload
      );
      const updated = (res.data as any)?.data ?? (res.data as any);
      onSave({
        ...pregunta,
        pregunta: updated.pregunta ?? text.trim(),
        categoria: updated.categoria ?? categoria,
        requiere_explicacion: updated.requiere_explicacion ?? requiere,
        obligatorio: updated.obligatorio ?? obligatorio,
      });
    } catch (e: any) {
      onError(
        e?.response?.data?.message ??
          e?.message ??
          "Error al actualizar la pregunta."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 14,
        borderRadius: 10,
        border: `1.5px solid ${C.primary}`,
        background: C.primaryBg,
      }}
    >
      {/* Reuse UIKit Input */}
      <Input
        label="Texto de la pregunta"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ej: ¿Tiene alguna alergia?"
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr auto auto",
          gap: 12,
          alignItems: "end",
        }}
      >
        <Select
          label="Categoría"
          options={CATEGORIAS_OPTIONS}
          value={categoria}
          onChange={setCategoria}
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: C.navy,
            cursor: "pointer",
            paddingBottom: 4,
          }}
        >
          <input
            type="checkbox"
            checked={requiere}
            onChange={(e) => setRequiere(e.target.checked)}
            style={{ width: 14, height: 14, cursor: "pointer" }}
          />
          Sí/No
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: C.navy,
            cursor: "pointer",
            paddingBottom: 4,
          }}
        >
          <input
            type="checkbox"
            checked={obligatorio}
            onChange={(e) => setObligatorio(e.target.checked)}
            style={{ width: 14, height: 14, cursor: "pointer" }}
          />
          Obligatorio
        </label>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <Button size="sm" onClick={handleSave} loading={saving}>
          {!saving && <Check size={13} />} Guardar
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ── New question form ────────────────────────────────────────────────────────
interface NewPreguntaFormProps {
  nextOrder: number;
  onCreated: (p: PreguntaConsulta) => void;
  onClose: () => void;
  onError: (msg: string) => void;
}
function NewPreguntaForm({
  nextOrder,
  onCreated,
  onClose,
  onError,
}: NewPreguntaFormProps) {
  const { isMobile } = useResponsive();
  const [text, setText] = useState("");
  const [categoria, setCategoria] = useState("Antecedentes Médicos");
  const [requiere, setRequiere] = useState(true);
  const [obligatorio, setObligatorio] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!text.trim()) {
      onError("Escribe el texto de la nueva pregunta.");
      return;
    }
    setSaving(true);
    try {
      const res = await expedientService.crearPregunta({
        pregunta: text.trim(),
        orden_num: nextOrder,
        requiere_explicacion: requiere,
        obligatorio,
        categoria,
      });
      const created = (res.data as any)?.data ?? (res.data as any);
      onCreated(created);
    } catch (e: any) {
      onError(
        e?.response?.data?.message ?? e?.message ?? "Error al crear pregunta."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        border: `1.5px dashed ${C.primary}`,
        background: C.primaryBg,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Reuse UIKit Input */}
        <Input
          label="Texto de la nueva pregunta"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ej: ¿Tiene historial de presión arterial alta?"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr auto auto",
            gap: 12,
            alignItems: "end",
          }}
        >
          <Select
            label="Categoría"
            options={CATEGORIAS_OPTIONS}
            value={categoria}
            onChange={setCategoria}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: C.navy,
              cursor: "pointer",
              paddingBottom: 4,
            }}
          >
            <input
              type="checkbox"
              checked={requiere}
              onChange={(e) => setRequiere(e.target.checked)}
              style={{ width: 14, height: 14, cursor: "pointer" }}
            />
            Sí/No
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: C.navy,
              cursor: "pointer",
              paddingBottom: 4,
            }}
          >
            <input
              type="checkbox"
              checked={obligatorio}
              onChange={(e) => setObligatorio(e.target.checked)}
              style={{ width: 14, height: 14, cursor: "pointer" }}
            />
            Obligatorio
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button size="sm" onClick={handleCreate} loading={saving}>
            {!saving && <Plus size={13} />} Crear pregunta
          </Button>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Single question row ───────────────────────────────────────────────────────
interface QuestionRowProps {
  pregunta: PreguntaConsulta;
  respuesta: { respuestaBoolean?: boolean; explanation?: string };
  onRespuestaChange: (
    id: number,
    field: "respuestaBoolean" | "explanation",
    value: boolean | string
  ) => void;
  onEdit: (p: PreguntaConsulta) => void;
  onDelete: (p: PreguntaConsulta) => void;
  editingId: number | null;
  onSaveEdit: (updated: PreguntaConsulta) => void;
  onCancelEdit: () => void;
  onError: (msg: string) => void;
}
function QuestionRow({
  pregunta,
  respuesta,
  onRespuestaChange,
  onEdit,
  onDelete,
  editingId,
  onSaveEdit,
  onCancelEdit,
  onError,
}: QuestionRowProps) {
  const { isMobile } = useResponsive();
  const isEditing = editingId === pregunta.id_pregunta;
  const showExplanation = pregunta.requiere_explicacion
    ? respuesta.respuestaBoolean === true
    : true;

  if (isEditing) {
    return (
      <EditPreguntaForm
        pregunta={pregunta}
        onSave={onSaveEdit}
        onCancel={onCancelEdit}
        onError={onError}
      />
    );
  }

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 10,
        background: "#F8F9FA",
        border: "1px solid #EAECEE",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "flex-start",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: showExplanation ? 10 : 0,
        }}
      >
        <QuestionLabel>
          {pregunta.pregunta}
          {pregunta.obligatorio && (
            <span style={{ color: C.danger, marginLeft: 4, fontSize: 12 }}>
              *
            </span>
          )}
        </QuestionLabel>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isMobile ? "space-between" : "flex-start",
            gap: 8,
            flexShrink: 0,
          }}
        >
          {pregunta.requiere_explicacion && (
            <YesNoButtons
              value={respuesta.respuestaBoolean}
              onChange={(v) =>
                onRespuestaChange(pregunta.id_pregunta, "respuestaBoolean", v)
              }
            />
          )}
          {/* Icon buttons — ghost style matching UIKit ghost variant */}
          <button
            type="button"
            title="Editar pregunta"
            onClick={() => onEdit(pregunta)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.gray500,
              display: "flex",
              padding: 4,
              borderRadius: 6,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.gray500)}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            title="Eliminar pregunta"
            onClick={() => onDelete(pregunta)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.gray500,
              display: "flex",
              padding: 4,
              borderRadius: 6,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.danger)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.gray500)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {showExplanation && (
        <textarea
          value={respuesta.explanation || ""}
          onChange={(e) =>
            onRespuestaChange(
              pregunta.id_pregunta,
              "explanation",
              e.target.value
            )
          }
          placeholder={
            pregunta.requiere_explicacion
              ? `Explique sobre ${pregunta.pregunta.toLowerCase()}...`
              : `Describa ${pregunta.pregunta.toLowerCase()}...`
          }
          rows={2}
          style={{
            width: "100%",
            padding: "8px 10px",
            border: `1px solid ${C.gray300}`,
            borderRadius: 8,
            fontSize: 13,
            color: C.navy,
            background: C.white,
            resize: "vertical",
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
}

// ── Main exported component ──────────────────────────────────────────────────
export interface ConsultationQuestionsProps {
  preguntas: PreguntaConsulta[];
  respuestas: Record<
    number,
    { respuestaBoolean?: boolean; explanation?: string }
  >;
  onPreguntasChange: (preguntas: PreguntaConsulta[]) => void;
  onRespuestaChange: (
    id: number,
    field: "respuestaBoolean" | "explanation",
    value: boolean | string
  ) => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export function ConsultationQuestions({
  preguntas,
  respuestas,
  onPreguntasChange,
  onRespuestaChange,
  onError,
  onSuccess,
}: ConsultationQuestionsProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PreguntaConsulta | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const categorias = Array.from(new Set(preguntas.map((p) => p.categoria)));

  const handleSaveEdit = useCallback(
    (updated: PreguntaConsulta) => {
      onPreguntasChange(
        preguntas.map((p) =>
          p.id_pregunta === updated.id_pregunta ? updated : p
        )
      );
      setEditingId(null);
      onSuccess("Pregunta actualizada correctamente.");
    },
    [preguntas, onPreguntasChange, onSuccess]
  );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await expedientService.deletePregunta(deleteTarget.id_pregunta);
      onPreguntasChange(
        preguntas.filter((p) => p.id_pregunta !== deleteTarget.id_pregunta)
      );
      onSuccess("Pregunta eliminada correctamente.");
      setDeleteTarget(null);
    } catch (e: any) {
      onError(
        e?.response?.data?.message ??
          e?.message ??
          "Error al eliminar la pregunta."
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleCreated = (p: PreguntaConsulta) => {
    onPreguntasChange([...preguntas, p]);
    setShowNewForm(false);
    onSuccess("Pregunta creada correctamente.");
  };

  const nextOrder =
    preguntas.length > 0
      ? Math.max(...preguntas.map((p) => p.orden_num)) + 1
      : 1;

  return (
    <>
      {/* Reuse UIKit Alert for the immutability warning */}
      <Alert
        variant="warning"
        message="Una vez que una pregunta sea respondida en alguna consulta, ya no podrá ser modificada ni eliminada para proteger la integridad de los expedientes clínicos."
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 16,
        }}
      >
        {preguntas.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 20,
              color: C.gray500,
              fontSize: 13,
            }}
          >
            Cargando preguntas...
          </div>
        ) : (
          categorias.map((categoria) => (
            <div key={categoria} style={{ marginBottom: 8 }}>
              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.navy,
                  marginBottom: 12,
                  borderBottom: `1px solid ${C.gray300}`,
                  paddingBottom: 6,
                }}
              >
                {categoria}
              </h4>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {preguntas
                  .filter((p) => p.categoria === categoria)
                  .map((pq) => (
                    <QuestionRow
                      key={pq.id_pregunta}
                      pregunta={pq}
                      respuesta={respuestas[pq.id_pregunta] || {}}
                      onRespuestaChange={onRespuestaChange}
                      onEdit={(p) => {
                        setShowNewForm(false);
                        setEditingId(p.id_pregunta);
                      }}
                      onDelete={(p) => setDeleteTarget(p)}
                      editingId={editingId}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={() => setEditingId(null)}
                      onError={onError}
                    />
                  ))}
              </div>
            </div>
          ))
        )}

        {/* New question toggle */}
        <div style={{ marginTop: 4 }}>
          {showNewForm ? (
            <NewPreguntaForm
              nextOrder={nextOrder}
              onCreated={handleCreated}
              onClose={() => setShowNewForm(false)}
              onError={onError}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setShowNewForm(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                border: `1.5px dashed ${C.gray300}`,
                borderRadius: 8,
                background: "transparent",
                color: C.gray500,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                width: "100%",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.primary;
                e.currentTarget.style.color = C.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.gray300;
                e.currentTarget.style.color = C.gray500;
              }}
            >
              <Plus size={14} /> Agregar pregunta personalizada
            </button>
          )}
        </div>
      </div>

      {/* Reuse ConfirmModal for delete confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        variant="danger"
        title="Eliminar pregunta"
        description={`¿Estás seguro que deseas eliminar "${deleteTarget?.pregunta}"? Solo puede eliminarse si ninguna consulta ha registrado una respuesta para ella.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        loading={deleting}
      />
    </>
  );
}
