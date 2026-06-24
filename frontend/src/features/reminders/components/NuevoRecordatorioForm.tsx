import { useEffect, useRef, useState } from "react";
import { ReminderService } from "../services/ReminderService";
import { CanalRecordatorio } from "../types/types";
import { Bell, X } from "lucide-react";
import { FormSection, FullWidthField } from "../../../components";
import { Button, Select } from "../../../context";
import { useResponsive } from "../../../hooks/useWindowWidth";
import { Z } from "../../../utils/zIndex";

interface NuevoRecordatorioFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface FormState {
  id_cita: string;
  canal: CanalRecordatorio | "";
}

interface FormErrors {
  id_cita?: string;
  canal?: string;
}

const FORM_INITIAL: FormState = { id_cita: "", canal: "" };

export function NuevoRecordatorioForm({
  open,
  onClose,
  onCreated,
}: NuevoRecordatorioFormProps) {
  const { isMobile } = useResponsive();
  const mountedRef = useRef(true);

  const [form, setForm] = useState<FormState>(FORM_INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const res = await ReminderService.getAppointments();
        if (!mountedRef.current) return;
        setAppointments(
          res.data.map((cita) => ({
            value: String(cita.id),
            label: `${cita.paciente} (#${cita.id})`,
          }))
        );
      } catch {
        /* silencioso — no exponer en producción */
      }
    })();
  }, [open]);

  if (!open) return null;

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.id_cita.trim()) next.id_cita = "Requerido";
    if (!form.canal) next.canal = "Requerido";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    setSubmitError("");
    try {
      const res = await ReminderService.send({
        id_cita: Number(form.id_cita),
        canal: form.canal as CanalRecordatorio,
      });

      if (form.canal === "WhatsApp" && res.data) {
        const resData = res.data as any;
        const rawPhone = resData.cita?.persona?.telefono;
        const whatsappMessage = resData.whatsappMessage;
        if (rawPhone && whatsappMessage) {
          const cleanPhone = rawPhone.replace(/\D/g, "");
          const phoneWithCountry = cleanPhone.startsWith("504") ? cleanPhone : `504${cleanPhone}`;
          const url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(whatsappMessage)}`;
          window.open(url, "_blank");
        }
      }

      if (!mountedRef.current) return;
      setForm(FORM_INITIAL);
      setErrors({});
      onCreated();
      onClose();
    } catch (err: unknown) {
      if (mountedRef.current) {
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Error al crear el recordatorio. Intenta de nuevo."
        );
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  function handleClose() {
    setForm(FORM_INITIAL);
    setErrors({});
    setSubmitError("");
    onClose();
  }

  const panelStyle: React.CSSProperties = isMobile
    ? {
        background: "#fff",
        borderRadius: "16px 16px 0 0",
        width: "100%",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
      }
    : {
        background: "#fff",
        borderRadius: 14,
        width: "100%",
        maxWidth: 480,
        boxShadow: "0px 10px 30px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
      };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        backdropFilter: "blur(2px)",
        zIndex: Z.MODAL_OVERLAY,
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 16,
      }}
      onClick={handleClose}
    >
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        {/* Handle móvil */}
        {isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 4px",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 9999,
                background: "#D3D7DA",
              }}
            />
          </div>
        )}

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "12px 20px 16px" : "20px 24px",
            borderBottom: "1px solid #F1F3F4",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#E6F8FB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={18} style={{ color: "#0BC5DF" }} />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#203F49",
                }}
              >
                Nuevo recordatorio
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#888F94" }}>
                Enviar recordatorio de cita al paciente
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#888F94",
              display: "flex",
              alignItems: "center",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: isMobile ? "16px 20px" : "20px 24px" }}>
          {submitError && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                borderRadius: 8,
                background: "#FEF2F2",
                border: "1px solid #E24B4A",
                fontSize: 13,
                color: "#E24B4A",
              }}
            >
              {submitError}
            </div>
          )}
          <FormSection
            title="Datos del recordatorio"
            icon={<Bell size={18} />}
            columns={1}
          >
            <FullWidthField>
              <Select
                label="Cita"
                badge="required"
                placeholder="Selecciona una cita"
                value={form.id_cita}
                onChange={(v) => setForm((p) => ({ ...p, id_cita: v }))}
                error={errors.id_cita}
                options={appointments}
              />
            </FullWidthField>
            <FullWidthField>
              <Select
                label="Canal de envío"
                badge="required"
                placeholder="Selecciona un canal"
                value={form.canal}
                onChange={(v) =>
                  setForm((p) => ({ ...p, canal: v as CanalRecordatorio }))
                }
                error={errors.canal}
                options={[
                  { value: "WhatsApp", label: "WhatsApp" },
                  { value: "Correo", label: "Correo electrónico" },
                ]}
              />
            </FullWidthField>
          </FormSection>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            padding: isMobile ? "12px 20px" : "16px 24px",
            borderTop: "1px solid #F1F3F4",
          }}
        >
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Enviar recordatorio
          </Button>
        </div>
      </div>
    </div>
  );
}
