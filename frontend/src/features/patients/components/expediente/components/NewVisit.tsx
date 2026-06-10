import { useState, useRef, useCallback, useEffect } from 'react';
import {
    ChevronLeft, ChevronDown, Upload, X, Search, Plus, Trash2, FileText,
    Image as ImageIcon, Stethoscope, DollarSign, Check, AlertCircle,
    Loader2, Tag, Zap, Clock, User, ShieldAlert,
} from 'lucide-react';
import { ExpedientePaciente } from '../types/index';
import { OdontogramScreen } from '../../odontograma/components/OdontogramaScreen';
import { Button, Input } from '../../../../../context';
import { calcularEdad , formatDate} from '../services/miscelaneousService';

// ── Design tokens (CSS vars from theme.css) ───────────────────────────────────
const C = {
    primary: 'var(--arco-primary, #0BC5DF)',
    navy: 'var(--arco-navy, #203F49)',
    success: 'var(--arco-success, #1D9E75)',
    warning: 'var(--arco-warning, #EF9F27)',
    danger: 'var(--arco-danger, #E24B4A)',
    gray50: 'var(--arco-gray-50, #F8F9FA)',
    gray100: 'var(--arco-gray-100, #F1F3F4)',
    gray300: 'var(--arco-gray-300, #D3D7DA)',
    gray500: 'var(--arco-gray-500, #888F94)',
    gray700: 'var(--arco-gray-700, #5F656A)',
    white: '#ffffff',
    primaryBg: 'var(--accent, #E6F8FB)',
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3;

type FileCategory = 'Radiografía Periapical' | 'Radiografía Panorámica' | 'Fotografía Clínica Intraoral/Extraoral';

interface ArchivoItem {
    id: string;
    file: File;
    preview: string;
    categoria: FileCategory;
    uploading: boolean;
}

interface TratamientoCatalogo {
    id: string;
    nombre: string;
    precio: number;
}

interface TratamientoVisita extends TratamientoCatalogo {
    cantidad: number;
    descuento: number;
}

interface ToastMsg {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

// ── Catalogue mock ────────────────────────────────────────────────────────────
const catalogoTratamientos: TratamientoCatalogo[] = [
    { id: 't01', nombre: 'Consulta general', precio: 500 },
    { id: 't02', nombre: 'Limpieza dental (Profilaxis)', precio: 1200 },
    { id: 't03', nombre: 'Resina clase I', precio: 900 },
    { id: 't04', nombre: 'Resina clase II', precio: 1100 },
    { id: 't05', nombre: 'Resina clase III', precio: 1300 },
    { id: 't06', nombre: 'Resina clase IV', precio: 1500 },
    { id: 't07', nombre: 'Extracción simple', precio: 800 },
    { id: 't08', nombre: 'Extracción quirúrgica', precio: 2200 },
    { id: 't09', nombre: 'Endodoncia unirradicular', precio: 3200 },
    { id: 't10', nombre: 'Endodoncia birradicular', precio: 4000 },
    { id: 't11', nombre: 'Endodoncia multirradicular', precio: 4800 },
    { id: 't12', nombre: 'Corona metal-porcelana', precio: 5500 },
    { id: 't13', nombre: 'Corona zirconio', precio: 8500 },
    { id: 't14', nombre: 'Implante dental', precio: 15000 },
    { id: 't15', nombre: 'Detartraje supragingival', precio: 800 },
    { id: 't16', nombre: 'Blanqueamiento dental', precio: 2500 },
    { id: 't17', nombre: 'Ortodoncia - mensualidad', precio: 1500 },
    { id: 't18', nombre: 'Radiografía periapical', precio: 350 },
    { id: 't19', nombre: 'Radiografía panorámica', precio: 650 },
    { id: 't20', nombre: 'Cirugía periodontal', precio: 6000 },
];

const DOCTORES = [
    'Dra. Karla Arita',
    'Dr. Miguel Herrera',
    'Dra. Sofía Munguía',
    'Dr. Andrés López',
];

const FILE_CATEGORIES: FileCategory[] = [
    'Radiografía Periapical',
    'Radiografía Panorámica',
    'Fotografía Clínica Intraoral/Extraoral',
];

const STEP_LABELS = ['Paciente y Cita', 'Motivo y Odontograma', 'Tratamientos y Cobro'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }

function mockApiPost<T>(payload: T): Promise<{ success: boolean; data: T; message: string }> {
    return new Promise((resolve, reject) =>
        setTimeout(() => {
            if (Math.random() > 0.02) {
                resolve({ success: true, data: payload, message: 'Visita registrada correctamente.' });
            } else {
                reject({ success: false, data: null, message: 'Error interno del servidor. Intenta de nuevo.' });
            }
        }, 1800),
    );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Toast({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: string) => void }) {
    return (
        <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
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
                            pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 10,
                            background: C.white, border: `1.5px solid ${colors.bg}`,
                            borderRadius: 10, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                            minWidth: 280, maxWidth: 380, animation: 'slideIn 0.2s ease',
                        }}
                    >
                        <span style={{ color: colors.bg, flexShrink: 0 }}>{colors.icon}</span>
                        <span style={{ flex: 1, fontSize: 13, color: C.navy }}>{t.message}</span>
                        <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray500, display: 'flex' }}>
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function StepperBar({ step }: { step: Step }) {
    return (
        <div style={{ background: C.white, border: `1px solid ${C.gray300}`, borderRadius: 12, padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
            {STEP_LABELS.map((label, i) => {
                const num = i + 1 as Step;
                const done = step > num;
                const active = step === num;
                return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_LABELS.length - 1 ? 1 : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                background: done ? C.success : active ? C.primary : C.gray100,
                                color: done || active ? C.white : C.gray500,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 600, transition: 'background 0.2s',
                            }}>
                                {done ? <Check size={14} /> : num}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? C.navy : done ? C.success : C.gray500, whiteSpace: 'nowrap' }}>
                                {label}
                            </span>
                        </div>
                        {i < STEP_LABELS.length - 1 && (
                            <div style={{ flex: 1, height: 2, margin: '0 16px', background: done ? C.success : C.gray300, borderRadius: 2, transition: 'background 0.3s' }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: C.white, border: `1px solid ${C.gray300}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 24px', borderBottom: `1px solid ${C.gray100}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: C.primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.primary }}>
                    {icon}
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>{title}</span>
            </div>
            <div style={{ padding: 24 }}>{children}</div>
        </div>
    );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
            {children}{required && <span style={{ color: C.danger, marginLeft: 3 }}>*</span>}
        </label>
    );
}

function Textarea({ value, onChange, placeholder, rows = 3, readOnly = false }: { value: string; onChange?: (v: string) => void; placeholder: string; rows?: number; readOnly?: boolean }) {
    const [focused, setFocused] = useState(false);
    const borderColor = focused ? 'var(--arco-primary, #0BC5DF)' : 'var(--border, #D3D7DA)';
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
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--foreground, #203F49)',
                background: readOnly ? 'var(--background, #F8F9FA)' : 'var(--card, #ffffff)',
                resize: 'vertical',
                fontFamily: 'Inter, system-ui, sans-serif',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: focused ? `0 0 0 3px rgba(11,197,223,0.12)` : 'none',
            }}
        />
    );
}

function TextInput({ value, onChange, placeholder, readOnly = false, type = 'text' }: { value: string; onChange?: (v: string) => void; placeholder: string; readOnly?: boolean; type?: string }) {
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

export function NuevaVisita({ patient, onBack, onSave }: Props) {
    const [step, setStep] = useState<Step>(1);
    const [saving, setSaving] = useState(false);
    const [toasts, setToasts] = useState<ToastMsg[]>([]);

    // ── STEP 1: Paciente y Cita ──
    const [primerNombre, setPrimerNombre] = useState(patient.primer_nombre || '');
    const [segundoNombre, setSegundoNombre] = useState(patient.segundo_nombre || '');
    const [primerApellido, setPrimerApellido] = useState(patient.primer_apellido || '');
    const [segundoApellido, setSegundoApellido] = useState(patient.segundo_apellido || '');
    const [identidad, setIdentidad] = useState(patient.numero_identidad || '');
    const [fechaNacimiento, setFechaNacimiento] = useState(patient.fecha_nacimiento || '');
    const [telefono, setTelefono] = useState(patient.telefono || '');
    const [correo, setCorreo] = useState(patient.correo_electronico || '');
    const [departamento, setDepartamento] = useState(patient.municipio.departamento.nombre || '');
    const [ciudad, setCiudad] = useState(patient.municipio.nombre || '');
    const [direccion, setDireccion] = useState(patient.direccion || '');
    const [enfermedadBase, setEnfermedadBase] = useState(patient.enfermedadBase || '');
    const [tomaMedicamento, setTomaMedicamento] = useState(patient.tomaMedicamento || '');
    const [alergias, setAlergias] = useState(patient.alergias || '');

    // Editable fields for visit setup
    const [bajoTratamientoMedico, setBajoTratamientoMedico] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
    const [hora, setHora] = useState(() => {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
    const [doctor, setDoctor] = useState(DOCTORES[0]);

    // ── STEP 2: Motivo y Odontograma ──
    const [motivo, setMotivo] = useState('');
    const [ultimaVisitaOdontologo, setUltimaVisitaOdontologo] = useState('');
    const [tipoVisita, setTipoVisita] = useState('Control');
    const [showOdontogram, setShowOdontogram] = useState(false);
    const [teethState, setTeethState] = useState<Record<number, { state: string; observation: string }> | null>(null); // To save state from odontogram
    const [modifiedTeethCount, setModifiedTeethCount] = useState(0);

    // ── STEP 3: Tratamientos y Cobro + Diagnóstico y Archivos ──
    const [diagnostico, setDiagnostico] = useState('');
    const [notas, setNotas] = useState('');
    const [archivos, setArchivos] = useState<ArchivoItem[]>([]);
    const [activeCategory, setActiveCategory] = useState<FileCategory>(FILE_CATEGORIES[0]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [busqueda, setBusqueda] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [tratamientos, setTratamientos] = useState<TratamientoVisita[]>([]);
    const [conceptoLibre, setConceptoLibre] = useState('');
    const [precioLibre, setPrecioLibre] = useState('');
    const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
    const [descuentoGlobal, setDescuentoGlobal] = useState('');
    const [anticipo, setAnticipo] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);

    const addToast = useCallback((type: ToastMsg['type'], message: string) => {
        const id = uid();
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
    }, []);

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── File handling ──────────────────────────────────────────────────────────
    const processFiles = useCallback((files: FileList | null) => {
        if (!files) return;
        const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
        Array.from(files).forEach((file) => {
            if (!allowed.includes(file.type)) {
                addToast('error', `"${file.name}" no es PNG ni JPEG. Solo se aceptan imágenes.`);
                return;
            }
            const id = uid();
            const reader = new FileReader();
            reader.onload = (ev) => {
                const preview = ev.target?.result as string;
                setArchivos((prev) => [...prev, { id, file, preview, categoria: activeCategory, uploading: true }]);
                // Simulate upload
                setTimeout(() => {
                    setArchivos((prev) => prev.map((a) => a.id === id ? { ...a, uploading: false } : a));
                }, 1200 + Math.random() * 800);
            };
            reader.readAsDataURL(file);
        });
    }, [activeCategory, addToast]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    }, [processFiles]);

    // ── Mapeo de tratamientos desde odontograma ───────────────────────────────────
    const autoPopulateTreatments = (updatedTeeth: Record<number, { state: string; observation: string }>, modifiedList: number[]) => {
        const newTrats = [...tratamientos];
        
        modifiedList.forEach((num) => {
            const tooth = updatedTeeth[num];
            if (!tooth) return;
            
            let targetId = '';
            let defaultName = '';
            let defaultPrice = 0;
            
            if (tooth.state === 'caries' || tooth.state === 'obturacion') {
                targetId = 't03';
                defaultName = `Resina clase I (Pieza ${num})`;
                defaultPrice = 900;
            } else if (tooth.state === 'endodoncia') {
                // Determine tooth type (molar vs premolar vs anterior)
                const isMolar = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38, 55, 54, 64, 65, 85, 84, 74, 75].includes(num);
                const isPremolar = [15, 14, 24, 25, 45, 44, 34, 35].includes(num);
                if (isMolar) {
                    targetId = 't11';
                    defaultName = `Endodoncia multirradicular (Pieza ${num})`;
                    defaultPrice = 4800;
                } else if (isPremolar) {
                    targetId = 't10';
                    defaultName = `Endodoncia birradicular (Pieza ${num})`;
                    defaultPrice = 4000;
                } else {
                    targetId = 't09';
                    defaultName = `Endodoncia unirradicular (Pieza ${num})`;
                    defaultPrice = 3200;
                }
            } else if (tooth.state === 'corona') {
                targetId = 't12';
                defaultName = `Corona metal-porcelana (Pieza ${num})`;
                defaultPrice = 5500;
            } else if (tooth.state === 'implante') {
                targetId = 't14';
                defaultName = `Implante dental (Pieza ${num})`;
                defaultPrice = 15000;
            } else if (tooth.state === 'extraccion') {
                targetId = 't07';
                defaultName = `Extracción simple (Pieza ${num})`;
                defaultPrice = 800;
            }
            
            if (targetId) {
                // Check if already in list (unique ID: targetId-toothNum)
                const exists = newTrats.find(t => t.id === `${targetId}-${num}`);
                if (!exists) {
                    newTrats.push({
                        id: `${targetId}-${num}`,
                        nombre: defaultName,
                        precio: defaultPrice,
                        cantidad: 1,
                        descuento: 0
                    });
                }
            }
        });
        
        setTratamientos(newTrats);
    };

    // ── Treatments search / manual addition ──────────────────────────────────────
    const suggestions = catalogoTratamientos.filter((t) =>
        t.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    const addTratamiento = (t: TratamientoCatalogo) => {
        const uniqueId = `${t.id}-${uid()}`;
        setTratamientos((prev) => [...prev, { ...t, id: uniqueId, cantidad: 1, descuento: 0 }]);
        setBusqueda('');
        setShowSuggestions(false);
    };

    const addConceptoLibre = () => {
        const nombre = conceptoLibre.trim();
        const precio = parseFloat(precioLibre);
        if (!nombre) { addToast('error', 'Escribe un nombre para el concepto libre.'); return; }
        if (isNaN(precio) || precio <= 0) { addToast('error', 'El precio debe ser un número mayor a 0.'); return; }
        setTratamientos((prev) => [...prev, { id: uid(), nombre, precio, cantidad: 1, descuento: 0 }]);
        setConceptoLibre('');
        setPrecioLibre('');
        addToast('info', `Concepto "${nombre}" agregado.`);
    };

    const updateTrat = (id: string, key: keyof TratamientoVisita, val: number) => {
        setTratamientos((prev) => prev.map((t) => t.id === id ? { ...t, [key]: Math.max(0, val) } : t));
    };

    // ── Billing calc ───────────────────────────────────────────────────────────
    const subtotal = tratamientos.reduce((acc, t) => {
        const lineDesc = t.precio * t.cantidad * (t.descuento / 100);
        return acc + t.precio * t.cantidad - lineDesc;
    }, 0);
    const descGlobal = Math.min(parseFloat(descuentoGlobal) || 0, subtotal);
    const total = Math.max(0, subtotal - descGlobal);
    const anticipoNum = Math.min(parseFloat(anticipo) || 0, total);
    const saldo = total - anticipoNum;

    // ── Save ───────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!motivo.trim()) { addToast('error', 'El motivo de consulta es requerido.'); setStep(2); return; }
        if (!diagnostico.trim()) { addToast('error', 'El diagnóstico clínico es requerido.'); setStep(3); return; }
        if (archivos.some((a) => a.uploading)) { addToast('error', 'Espera a que terminen de cargarse todas las imágenes.'); return; }

        setSaving(true);
        const payload = {
            patientId: patient.id_persona,
            patientName: `${primerNombre} ${primerApellido}`,
            identidad,
            fecha,
            hora,
            doctor,
            bajoTratamientoMedico,
            motivo,
            ultimaVisitaOdontologo,
            tipoVisita,
            diagnostico,
            notas,
            archivos: archivos.map((a) => ({ nombre: a.file.name, categoria: a.categoria })),
            tratamientos: tratamientos.map((t) => ({ id: t.id, nombre: t.nombre, precio: t.precio, cantidad: t.cantidad, descuento: t.descuento })),
            cobro: { subtotal, descuentoGlobal: descGlobal, total, anticipo: anticipoNum, saldo, metodoPago },
            odontograma: teethState,
        };

        try {
            const res = await mockApiPost(payload);
            if (res.success) {
                addToast('success', res.message);
                setTimeout(onSave, 1000);
            }
        } catch (err: unknown) {
            const msg = (err as { message?: string })?.message ?? 'Error al guardar la visita.';
            addToast('error', msg);
        } finally {
            setSaving(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    if (showOdontogram) {
        return (
            <div style={{ animation: 'slideIn 0.2s ease', background: '#F8F9FA', padding: 20, borderRadius: 12, border: `1px solid ${C.gray300}` }}>
                <Toast toasts={toasts} remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: `1px solid ${C.gray100}`, paddingBottom: 12 }}>
                    <button
                        onClick={() => setShowOdontogram(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.gray500, fontSize: 13, padding: 0 }}
                    >
                        <ChevronLeft size={16} /> Volver al formulario de visita
                    </button>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Odontograma de la Consulta</div>
                    <div style={{ fontSize: 13, color: C.gray700 }}>
                        Paciente: <strong style={{ color: C.primary }}>{primerNombre} {primerApellido}</strong>
                    </div>
                </div>
                <OdontogramScreen
                    isEmbedded={true}
                    patientName={`${primerNombre} ${primerApellido}`}
                    patientIdentidad={identidad}
                    initialDentition={calcularEdad(patient.fecha_nacimiento) < 12 ? 'child' : 'adult'}
                    onSaveEmbedded={(updatedTeeth, modifiedList) => {
                        setTeethState(updatedTeeth);
                        setModifiedTeethCount(modifiedList.length);
                        autoPopulateTreatments(updatedTeeth, modifiedList);
                        setShowOdontogram(false);
                        addToast('success', `Odontograma actualizado. Se pre-cargaron ${modifiedList.length} tratamientos.`);
                    }}
                    onCancelEmbedded={() => {
                        setShowOdontogram(false);
                    }}
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

            <Toast toasts={toasts} remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ── Header ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.gray300}`, paddingBottom: 12 }}>
                    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.gray500, fontSize: 13, padding: 0 }}>
                        <ChevronLeft size={16} /> Volver al expediente
                    </button>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Registrar Nueva Visita</div>
                    <div style={{ fontSize: 13, color: C.gray700 }}>
                        Paciente seleccionado: <strong style={{ color: C.primary }}>{patient.nombre}</strong>
                    </div>
                </div>

                {/* ── Stepper ── */}
                <StepperBar step={step} />

                {/* ══════════════════════════════════════════════════════════════════
                    STEP 1 — Datos de Cita y Paciente
                ══════════════════════════════════════════════════════════════════ */}
                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        
                        {/* 1. Datos de la Cita */}
                        <SectionCard icon={<Clock size={17} />} title="Información de la Cita / Doctor">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                                <div>
                                    <FieldLabel required>Fecha de visita</FieldLabel>
                                    <input
                                        type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 13, color: C.navy, background: C.white, outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <FieldLabel required>Hora de visita</FieldLabel>
                                    <input
                                        type="time" value={hora} onChange={(e) => setHora(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 13, color: C.navy, background: C.white, outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <FieldLabel required>Doctor responsable</FieldLabel>
                                    <select
                                        value={doctor}
                                        onChange={(e) => setDoctor(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 13, color: C.navy, background: C.white, outline: 'none', cursor: 'pointer' }}
                                    >
                                        {DOCTORES.map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                        </SectionCard>

                        {/* 2. Datos del Paciente (Autocompletado) */}
                        <SectionCard icon={<User size={17} />} title="Información Personal (Autocompletado del Expediente)">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <FieldLabel>Primer Nombre</FieldLabel>
                                    <TextInput value={primerNombre} onChange={setPrimerNombre} placeholder="Primer nombre" />
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <FieldLabel>Segundo Nombre</FieldLabel>
                                    <TextInput value={segundoNombre} onChange={setSegundoNombre} placeholder="Segundo nombre" />
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <FieldLabel>Primer Apellido</FieldLabel>
                                    <TextInput value={primerApellido} onChange={setPrimerApellido} placeholder="Primer apellido" />
                                </div>
                                <div style={{ gridColumn: 'span 1' }}>
                                    <FieldLabel>Segundo Apellido</FieldLabel>
                                    <TextInput value={segundoApellido} onChange={setSegundoApellido} placeholder="Segundo apellido" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <FieldLabel>Nº Identidad</FieldLabel>
                                    <TextInput value={identidad} onChange={setIdentidad} placeholder="Número de identidad" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <FieldLabel>Fecha de Nacimiento</FieldLabel>
                                    <TextInput type="date" value={formatDate(fechaNacimiento)} onChange={(e: any) => setFechaNacimiento(new Date(e.target.value))} placeholder="YYYY-MM-DD" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <FieldLabel>Teléfono</FieldLabel>
                                    <TextInput value={telefono} onChange={setTelefono} placeholder="Número de teléfono" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <FieldLabel>Correo Electrónico</FieldLabel>
                                    <TextInput value={correo} onChange={setCorreo} placeholder="Correo electrónico" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <FieldLabel>Departamento</FieldLabel>
                                    <TextInput value={departamento} onChange={setDepartamento} placeholder="Departamento de residencia" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <FieldLabel>Ciudad / Municipio</FieldLabel>
                                    <TextInput value={ciudad} onChange={setCiudad} placeholder="Ciudad o municipio de residencia" />
                                </div>
                                <div style={{ gridColumn: 'span 4' }}>
                                    <FieldLabel>Dirección Completa</FieldLabel>
                                    <Textarea value={direccion} onChange={setDireccion} placeholder="Dirección exacta de residencia..." rows={2} />
                                </div>
                            </div>
                        </SectionCard>

                        {/* 3. Antecedentes y Estado Actual */}
                        <SectionCard icon={<ShieldAlert size={17} />} title="Historial Clínico y Estado de Salud">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                                <div>
                                    <FieldLabel>Enfermedad De Base / Explique</FieldLabel>
                                    <Textarea value={enfermedadBase} onChange={setEnfermedadBase} placeholder="Describa si padece de alguna enfermedad como diabetes, hipertensión, etc." rows={2} />
                                </div>
                                <div>
                                    <FieldLabel>Toma Algún Medicamento / Explique</FieldLabel>
                                    <Textarea value={tomaMedicamento} onChange={setTomaMedicamento} placeholder="Describa los medicamentos que toma con su dosis habitual..." rows={2} />
                                </div>
                                <div>
                                    <FieldLabel>Alergias A Medicamentos O Comidas / Explique</FieldLabel>
                                    <Textarea value={alergias} onChange={setAlergias} placeholder="Describa si presenta alergias a penicilina, latex, comidas, etc." rows={2} />
                                </div>
                                <div style={{ background: '#FFF8EC', padding: 16, borderRadius: 10, border: `1px solid ${C.warning}` }}>
                                    <FieldLabel required>¿Actualmente Se Encuentra Bajo Tratamiento Médico? / Explique</FieldLabel>
                                    <Textarea value={bajoTratamientoMedico} onChange={setBajoTratamientoMedico} placeholder="Explique detalladamente si está en algún tratamiento médico activo en este momento..." rows={2} />
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    STEP 2 — Motivo y Odontograma
                ══════════════════════════════════════════════════════════════════ */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <SectionCard icon={<Stethoscope size={17} />} title="Detalles del Motivo de Visita">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <FieldLabel required>Motivo de la visita</FieldLabel>
                                    <Textarea value={motivo} onChange={setMotivo} placeholder="Describa el síntoma principal o razón por la cual asiste el paciente..." rows={3} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <FieldLabel>¿Cuándo fue su última visita al odontólogo?</FieldLabel>
                                        <TextInput value={ultimaVisitaOdontologo} onChange={setUltimaVisitaOdontologo} placeholder="Ej: Hace 6 meses, Nunca, etc." />
                                    </div>
                                    <div>
                                        <FieldLabel>Tipo de visita</FieldLabel>
                                        <select
                                            value={tipoVisita}
                                            onChange={(e) => setTipoVisita(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 13, color: C.navy, background: C.white, outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="Control">Control General</option>
                                            <option value="Urgencia">Urgencia Dental</option>
                                            <option value="Profilaxis">Limpieza / Profilaxis</option>
                                            <option value="Tratamiento">Tratamiento Planificado</option>
                                            <option value="Estética">Odontología Estética</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Odontograma Access Box */}
                        <div style={{
                            background: `linear-gradient(135deg, ${C.primaryBg}, #d0f4fa)`,
                            border: `1.5px solid ${C.primary}`,
                            borderRadius: 16,
                            padding: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 16
                        }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Zap size={18} color={C.primary} /> Odontograma de la Consulta
                                </div>
                                <div style={{ fontSize: 13, color: C.gray700, marginTop: 6, maxWidth: 600 }}>
                                    Actualiza el odontograma del paciente en tiempo real. Los estados modificados aquí pre-cargarán automáticamente los tratamientos clínicos correspondientes en el Paso 3.
                                </div>
                                {modifiedTeethCount > 0 && (
                                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: C.success, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Check size={14} /> Se modificaron {modifiedTeethCount} piezas dentales en esta sesión.
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowOdontogram(true)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, background: C.primary, color: C.white,
                                    border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 13, fontWeight: 600,
                                    cursor: 'pointer', flexShrink: 0
                                }}
                            >
                                <Zap size={16} /> Abrir Odontograma Interactivo
                            </button>
                        </div>


                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    STEP 3 — Diagnóstico, Archivos y Tratamientos
                ══════════════════════════════════════════════════════════════════ */}
                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* 1. Diagnóstico y Notas */}
                        <SectionCard icon={<Stethoscope size={17} />} title="Diagnóstico Clínico y Notas">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <FieldLabel required>Diagnóstico de evolución</FieldLabel>
                                    <Textarea value={diagnostico} onChange={setDiagnostico} placeholder="Describa el diagnóstico clínico completo de la consulta..." rows={3} />
                                </div>
                                <div>
                                    <FieldLabel>Notas clínicas adicionales</FieldLabel>
                                    <Textarea value={notas} onChange={setNotas} placeholder="Indicaciones para el hogar, receta de analgésicos, recordatorios para la recepción..." rows={2} />
                                </div>
                            </div>
                        </SectionCard>

                        {/* 2. Carga de Archivos */}
                        <SectionCard icon={<ImageIcon size={17} />} title="Radiografías y Fotos Clínicas">
                            {/* Category selector */}
                            <div style={{ marginBottom: 20 }}>
                                <FieldLabel>Categoría del archivo a cargar</FieldLabel>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                                    {FILE_CATEGORIES.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            style={{
                                                padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                                                border: `1.5px solid ${activeCategory === cat ? C.primary : C.gray300}`,
                                                background: activeCategory === cat ? C.primaryBg : C.white,
                                                color: activeCategory === cat ? C.primary : C.gray500,
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    border: `2px dashed ${isDragging ? C.primary : C.gray300}`,
                                    borderRadius: 12, padding: '24px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
                                    background: isDragging ? C.primaryBg : C.gray50,
                                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                                }}
                            >
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.primaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Upload size={20} color={C.primary} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Arrastra imágenes aquí</div>
                                    <div style={{ fontSize: 11, color: C.gray500, marginTop: 4 }}>o haz clic para seleccionar · PNG, JPEG · Máx. 10 MB por archivo</div>
                                </div>
                                <span style={{ fontSize: 10, background: C.primaryBg, color: C.primary, padding: '2px 10px', borderRadius: 20, fontWeight: 500 }}>
                                    Cargando en: {activeCategory}
                                </span>
                                <input ref={fileInputRef} type="file" multiple accept=".png,.jpg,.jpeg" style={{ display: 'none' }} onChange={(e) => processFiles(e.target.files)} />
                            </div>

                            {/* Previews */}
                            {archivos.length > 0 && (
                                <div style={{ marginTop: 20 }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
                                        {archivos.length} archivo{archivos.length !== 1 ? 's' : ''} cargado{archivos.length !== 1 ? 's' : ''}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                                        {archivos.map((archivo) => (
                                            <div key={archivo.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.gray300}`, background: C.gray50 }}>
                                                <img
                                                    src={archivo.preview}
                                                    alt={archivo.file.name}
                                                    style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                                                />
                                                {archivo.uploading && (
                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(32,63,73,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Loader2 size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                                                    </div>
                                                )}
                                                {!archivo.uploading && (
                                                    <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Check size={10} color="#fff" />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setArchivos((prev) => prev.filter((a) => a.id !== archivo.id))}
                                                    style={{ position: 'absolute', top: 6, left: 6, width: 20, height: 20, borderRadius: '50%', background: C.danger, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    <X size={10} color="#fff" />
                                                </button>
                                                <div style={{ padding: '6px 8px', background: C.white }}>
                                                    <div style={{ fontSize: 10, fontWeight: 500, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{archivo.file.name}</div>
                                                    <div style={{ fontSize: 9, color: C.gray500, marginTop: 1 }}>{archivo.categoria.split(' ').slice(0, 2).join(' ')}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </SectionCard>

                        {/* 3. Selección de Tratamientos */}
                        <SectionCard icon={<Search size={17} />} title="Selección de Tratamientos y Facturación">
                            <div ref={searchRef} style={{ position: 'relative', marginBottom: 16 }}>
                                <FieldLabel>Buscar en catálogo de servicios</FieldLabel>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${C.gray300}`, borderRadius: 8, padding: '0 12px', height: 42, background: C.white }}>
                                    <Search size={15} color={C.gray500} />
                                    <input
                                        value={busqueda}
                                        onChange={(e) => { setBusqueda(e.target.value); setShowSuggestions(true); }}
                                        onFocus={() => setShowSuggestions(true)}
                                        placeholder="Selecciona o escribe para buscar un tratamiento..."
                                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: C.navy, background: 'transparent' }}
                                    />
                                    {busqueda && (
                                        <button 
                                            onClick={() => { setBusqueda(''); }} 
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: C.gray500, padding: 4 }}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setShowSuggestions(!showSuggestions)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: C.gray500, padding: 4, borderLeft: `1px solid ${C.gray300}`, marginLeft: 4 }}
                                    >
                                        <ChevronDown size={16} style={{ transform: showSuggestions ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                    </button>
                                </div>

                                {/* Suggestions dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: C.white, border: `1px solid ${C.gray300}`, borderRadius: 10, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999, overflowY: 'auto', maxHeight: 250 }}>
                                        {suggestions.map((t) => (
                                            <button
                                                key={t.id}
                                                onMouseDown={() => addTratamiento(t)}
                                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.navy, textAlign: 'left', transition: 'background 0.1s' }}
                                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.gray50; }}
                                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                                            >
                                                <span>{t.nombre}</span>
                                                <span style={{ fontWeight: 600, color: C.success }}>L. {t.precio.toLocaleString('es-HN')}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Concepto libre */}
                            <div style={{ background: C.gray50, border: `1px solid ${C.gray100}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                                    <Tag size={14} color={C.warning} />
                                    <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>Agregar concepto libre (no en catálogo)</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <input
                                        value={conceptoLibre} onChange={(e) => setConceptoLibre(e.target.value)} placeholder="Nombre del servicio o concepto"
                                        style={{ flex: 1, minWidth: 200, padding: '9px 12px', border: `1px solid ${C.gray300}`, borderRadius: 8, fontSize: 13, color: C.navy, outline: 'none', background: C.white }}
                                    />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: `1px solid ${C.gray300}`, borderRadius: 8, padding: '0 10px', background: C.white }}>
                                        <span style={{ fontSize: 12, color: C.gray500 }}>L.</span>
                                        <input
                                            value={precioLibre} onChange={(e) => setPrecioLibre(e.target.value)} placeholder="0.00" type="number" min="0"
                                            style={{ width: 90, border: 'none', outline: 'none', fontSize: 13, color: C.navy, background: 'transparent' }}
                                        />
                                    </div>
                                    <button
                                        onClick={addConceptoLibre}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.warning, color: C.white, border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}
                                    >
                                        <Plus size={15} /> Agregar
                                    </button>
                                </div>
                            </div>

                            {/* Treatment list */}
                            {tratamientos.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '28px 0', color: C.gray500, fontSize: 13, border: `1px dashed ${C.gray300}`, borderRadius: 8 }}>
                                    <FileText size={28} style={{ marginBottom: 8, opacity: 0.35, display: 'inline-block' }} />
                                    <div>No se han seleccionado tratamientos. Completa el odontograma en el Paso 2 o agrega servicios manualmente arriba.</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {tratamientos.map((t) => {
                                        const lineTotal = t.precio * t.cantidad * (1 - t.descuento / 100);
                                        return (
                                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.gray50, border: `1px solid ${C.gray100}`, borderRadius: 10, padding: '12px 16px', flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1, minWidth: 150 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{t.nombre}</div>
                                                    <div style={{ fontSize: 11, color: C.gray500, marginTop: 2 }}>L. {t.precio.toLocaleString('es-HN')} c/u</div>
                                                </div>
                                                
                                                {/* Qty */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <button onClick={() => updateTrat(t.id, 'cantidad', t.cantidad - 1)} style={qBtn}><span style={{ fontSize: 14, lineHeight: 1 }}>−</span></button>
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, minWidth: 24, textAlign: 'center' }}>{t.cantidad}</span>
                                                    <button onClick={() => updateTrat(t.id, 'cantidad', t.cantidad + 1)} style={qBtn}><span style={{ fontSize: 14, lineHeight: 1 }}>+</span></button>
                                                </div>
                                                
                                                {/* Discount */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: `1px solid ${C.gray300}`, borderRadius: 7, padding: '4px 8px', background: C.white }}>
                                                    <input
                                                        value={t.descuento || ''} onChange={(e) => updateTrat(t.id, 'descuento', parseFloat(e.target.value) || 0)}
                                                        placeholder="0" type="number" min="0" max="100"
                                                        style={{ width: 38, border: 'none', outline: 'none', fontSize: 12, color: C.navy, background: 'transparent', textAlign: 'center' }}
                                                    />
                                                    <span style={{ fontSize: 11, color: C.gray500 }}>%</span>
                                                </div>
                                                
                                                {/* Line total */}
                                                <span style={{ fontSize: 13, fontWeight: 700, color: C.success, minWidth: 90, textAlign: 'right' }}>
                                                    L. {lineTotal.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                                </span>
                                                <button onClick={() => setTratamientos((prev) => prev.filter((x) => x.id !== t.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: C.danger, marginLeft: 8 }}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </SectionCard>

                        {/* Billing summary */}
                        <SectionCard icon={<DollarSign size={17} />} title="Resumen de Cobro">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 20 }}>
                                {/* Método */}
                                <div>
                                    <FieldLabel>Método de pago</FieldLabel>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {(['Efectivo', 'Tarjeta', 'Transferencia'] as const).map((m) => (
                                            <button
                                                key={m} onClick={() => setMetodoPago(m)}
                                                style={{ flex: 1, padding: '9px 4px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: `1.5px solid ${metodoPago === m ? C.primary : C.gray300}`, background: metodoPago === m ? C.primaryBg : C.white, color: metodoPago === m ? C.primary : C.gray500 }}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Descuento global */}
                                <div>
                                    <FieldLabel>Descuento global (L.)</FieldLabel>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.gray300}`, borderRadius: 8, padding: '0 12px', height: 40, background: C.white }}>
                                        <span style={{ fontSize: 13, color: C.gray500 }}>L.</span>
                                        <input value={descuentoGlobal} onChange={(e) => setDescuentoGlobal(e.target.value)} placeholder="0.00" type="number" min="0"
                                            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: C.navy, background: 'transparent' }} />
                                    </div>
                                </div>
                                {/* Anticipo */}
                                <div>
                                    <FieldLabel>Anticipo / Pago inicial (L.)</FieldLabel>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.gray300}`, borderRadius: 8, padding: '0 12px', height: 40, background: C.white }}>
                                        <span style={{ fontSize: 13, color: C.gray500 }}>L.</span>
                                        <input value={anticipo} onChange={(e) => setAnticipo(e.target.value)} placeholder="0.00" type="number" min="0"
                                            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: C.navy, background: 'transparent' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Totals */}
                            <div style={{ borderTop: `1px solid ${C.gray100}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {[
                                    { label: 'Subtotal', value: subtotal, color: C.navy },
                                    { label: 'Descuento global', value: -descGlobal, color: C.danger },
                                    { label: 'Total a Pagar', value: total, color: C.navy, bold: true, large: true },
                                    { label: 'Anticipo recibido', value: -anticipoNum, color: C.success },
                                ].map((row) => (
                                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: row.bold ? `1px solid ${C.gray100}` : undefined, paddingTop: row.bold ? 12 : 0 }}>
                                        <span style={{ fontSize: row.large ? 15 : 13, fontWeight: row.bold ? 600 : 400, color: C.gray700 }}>{row.label}</span>
                                        <span style={{ fontSize: row.large ? 17 : 13, fontWeight: row.bold ? 700 : 500, color: row.color }}>
                                            {row.value < 0 ? '−' : ''} L. {Math.abs(row.value).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: saldo > 0 ? '#FFF8EC' : '#F0FBF7', borderRadius: 10, padding: '12px 16px', marginTop: 4 }}>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>Saldo pendiente</span>
                                    <span style={{ fontSize: 18, fontWeight: 700, color: saldo > 0 ? C.warning : C.success }}>
                                        L. {saldo.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                )}

                {/* ── Navigation buttons ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${C.gray300}` }}>
                    <Button
                        variant="secondary"
                        onClick={step === 1 ? onBack : () => setStep((s) => (s - 1) as Step)}
                    >
                        {step === 1 ? 'Cancelar' : '← Anterior'}
                    </Button>

                    <div style={{ display: 'flex', gap: 10 }}>
                        {step < 3 && (
                            <Button
                                onClick={() => setStep((s) => (s + 1) as Step)}
                            >
                                Siguiente →
                            </Button>
                        )}
                        {step === 3 && (
                            <Button
                                onClick={handleSave}
                                loading={saving}
                                style={{ background: saving ? undefined : 'var(--arco-success, #1D9E75)', borderColor: saving ? undefined : 'var(--arco-success, #1D9E75)' }}
                            >
                                <Check size={15} /> Guardar Visita
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// tiny shared style
const qBtn: React.CSSProperties = {
    width: 26, height: 26, borderRadius: '50%', border: `1px solid var(--arco-gray-300, #D3D7DA)`,
    background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, color: 'var(--arco-navy, #203F49)', lineHeight: 1,
};
