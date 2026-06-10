import { useState } from "react";
import { ReminderService } from "../services/ReminderService";
import { CanalRecordatorio } from "../types/types";
import { Bell } from "lucide-react";
import { FormSection, FullWidthField } from "../../../components";
import { Button, Input, Select } from "../../../context";

interface NuevoRecordatorioFormProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}

interface FormState {
    id_cita: string;
    canal: CanalRecordatorio | '';
}

interface FormErrors {
    id_cita?: string;
    canal?: string;
    submit?: string;
}


const FORM_INITIAL: FormState = { id_cita: '', canal: '' };

export function NuevoRecordatorioForm({ open, onClose, onCreated }: NuevoRecordatorioFormProps) {
    const [form, setForm] = useState<FormState>(FORM_INITIAL);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    function validate(): boolean {
        const next: FormErrors = {};
        if (!form.id_cita.trim()) next.id_cita = 'Requerido';
        if (!form.canal)          next.canal   = 'Requerido' as CanalRecordatorio;
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    async function handleSubmit() {
        if (!validate()) return;
        setLoading(true);
        try {
            await ReminderService.send({
                id_cita: Number(form.id_cita),
                                       canal: form.canal as CanalRecordatorio,
            });
            setForm(FORM_INITIAL);
            setErrors({});
            onCreated();
            onClose();
        } catch {
            setErrors({ id_cita: 'Error al crear el recordatorio. Intenta de nuevo.' });
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        setForm(FORM_INITIAL);
        setErrors({});
        onClose();
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)',
                zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    background: '#fff', borderRadius: 14, width: '100%', maxWidth: 480,
                    boxShadow: '0px 10px 30px rgba(0,0,0,0.15)', zIndex: 51,
                    display: 'flex', flexDirection: 'column', gap: 0,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px', borderBottom: '1px solid #F1F3F4',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, background: '#E6F8FB',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Bell size={18} style={{ color: '#0BC5DF' }} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#203F49' }}>
                            Nuevo recordatorio
                            </p>
                            <p style={{ margin: 0, fontSize: 12, color: '#888F94' }}>
                            Enviar recordatorio de cita al paciente
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#888F94', display: 'flex', alignItems: 'center', padding: 4,
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 24px' }}>
                    <FormSection title="Datos del recordatorio" icon={<Bell size={18} />} columns={1}>
                        <FullWidthField>
                            <Input
                                label="ID de cita"
                                badge="required"
                                placeholder="Ej. 1042"
                                type="number"
                                value={form.id_cita}
                                onChange={(e) => setForm((p) => ({ ...p, id_cita: e.target.value }))}
                                error={errors.id_cita}
                            />
                        </FullWidthField>
                        <FullWidthField>
                            <Select
                                label="Canal de envío"
                                badge="required"
                                placeholder="Selecciona un canal"
                                value={form.canal}
                                onChange={(v) => setForm((p) => ({ ...p, canal: v as CanalRecordatorio }))}
                                error={errors.canal}
                                options={[
                                    { value: 'WhatsApp', label: '💬 WhatsApp' },
                                    { value: 'SMS',      label: '📱 SMS'      },
                                    { value: 'Correo',   label: '✉️ Correo'   },
                                ]}
                            />
                        </FullWidthField>
                    </FormSection>
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex', gap: 10, justifyContent: 'flex-end',
                    padding: '16px 24px', borderTop: '1px solid #F1F3F4',
                }}>
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
