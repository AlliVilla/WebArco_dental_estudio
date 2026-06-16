import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Upload,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  Download,
  X,
  Calendar,
  FileImage,
  AlertCircle,
  Info,
} from 'lucide-react';
import { ConfirmModal } from '../../../../../components';
import { Button, Alert, Select } from '../../../../../context';
import { galeriaService, FotoGaleria, FOTO_CATEGORIAS, FotoCategoria } from '../services/galeriaService';
import type { ConsultaHistorica } from '../types/getAllPacientes';
import api from '../../../../../services/api';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:    'var(--arco-primary, #0BC5DF)',
  primaryBg:  'var(--accent, #E6F8FB)',
  navy:       'var(--foreground, #203F49)',
  success:    'var(--arco-success, #1D9E75)',
  warning:    'var(--arco-warning, #EF9F27)',
  danger:     'var(--arco-danger, #E24B4A)',
  gray50:     'var(--background, #F8F9FA)',
  gray100:    'var(--arco-gray-100, #F1F3F4)',
  gray300:    'var(--border, #D3D7DA)',
  gray500:    'var(--muted-foreground, #888F94)',
  gray700:    'var(--arco-gray-700, #5F656A)',
  white:      'var(--card, #ffffff)',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildImageUrl(url: string): string {
  return `${api.defaults.baseURL}/upload/${encodeURIComponent(url)}`;
}

function isImage(nombre: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(nombre);
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Antes:       { bg: '#FFF3E0', color: '#E65100', label: 'Antes' },
  Después:     { bg: '#E8F5E9', color: '#2E7D32', label: 'Después' },
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-HN');
}

// ─── Prop Types ───────────────────────────────────────────────────────────────
export interface GaleriaFotosProps {
  pacienteId: number;
  pacienteNombre: string;
  consultas: ConsultaHistorica[];
  onBack: () => void;
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
interface UploadModalProps {
  pacienteId: number;
  consultas: ConsultaHistorica[];
  onSuccess: () => void;
  onClose: () => void;
}

function UploadModal({ pacienteId, consultas, onSuccess, onClose }: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [consultaId, setConsultaId] = useState<string>(
    consultas[0]?.id_consulta ? String(consultas[0].id_consulta) : ''
  );
  const [categoria, setCategoria] = useState<string>('Antes');
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const consultaOptions = consultas.map((c) => ({
    value: String(c.id_consulta),
    label: `Consulta — ${formatDate(c.fecha_fin ?? c.fecha_inicio)}`,
  }));

  function pickFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list).filter((f) => f.size <= 20 * 1024 * 1024)]);
  }

  async function submit() {
    if (!files.length || !consultaId) { setErrorMsg('Selecciona archivos y una consulta.'); return; }
    setUploading(true);
    setErrorMsg('');
    try {
      for (const file of files) {
        await galeriaService.subirFoto(pacienteId, {
          file, categoria: categoria as FotoCategoria, nombre: file.name, id_consulta: Number(consultaId),
        });
      }
      onSuccess();
    } catch (e: unknown) {
      setErrorMsg((e as { message?: string })?.message ?? 'Error al subir.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Subir foto"
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 10001, width: 'min(92vw, 520px)',
          background: C.white, borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: `linear-gradient(135deg, ${C.primary}, #0899B0)`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Upload size={16} /> Subir Foto
          </span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: '#fff', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? C.primary : C.gray300}`,
              borderRadius: 10, padding: '28px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              cursor: 'pointer', background: dragOver ? C.primaryBg : C.gray50,
              transition: 'all 0.2s',
            }}
          >
            <input ref={fileRef} type="file" multiple accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => pickFiles(e.target.files)} />
            <FileImage size={32} color={C.gray500} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                {dragOver ? 'Suelta aquí' : 'Arrastra o haz clic para seleccionar'}
              </div>
              <div style={{ fontSize: 11, color: C.gray500, marginTop: 3 }}>JPG, PNG, WEBP, PDF · Max 20 MB</div>
            </div>
          </div>

          {/* Files list */}
          {files.length > 0 && (
            <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: `1px solid ${C.gray100}`, borderRadius: 8, background: C.white }}>
                  <FileImage size={14} color={C.gray500} />
                  <span style={{ flex: 1, fontSize: 12, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  <span style={{ fontSize: 11, color: C.gray500 }}>{(f.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray500, display: 'flex', padding: 2 }}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Selects */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select label="Categoría" badge="required" options={FOTO_CATEGORIAS.map(c => ({ value: c, label: c }))} value={categoria} onChange={setCategoria} placeholder="Seleccionar..." />
            <Select label="Consulta" badge="required" options={consultaOptions} value={consultaId} onChange={setConsultaId} placeholder="Seleccionar..." />
          </div>

          {errorMsg && <Alert variant="error" message={errorMsg} onClose={() => setErrorMsg('')} />}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={onClose} disabled={uploading}>Cancelar</Button>
            <Button variant="primary" size="sm" loading={uploading} disabled={!files.length || !consultaId} onClick={submit}>
              <Upload size={13} /> Subir {files.length > 0 ? `(${files.length})` : ''}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
interface LightboxProps {
  fotos: FotoGaleria[];
  index: number;
  onClose: () => void;
  onNav: (i: number) => void;
}

function Lightbox({ fotos, index, onClose, onNav }: LightboxProps) {
  const foto = fotos[index];
  if (!foto) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && index > 0) onNav(index - 1);
    if (e.key === 'ArrowRight' && index < fotos.length - 1) onNav(index + 1);
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={onKey}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.93)',
        zIndex: 10200,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Top bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{foto.nombre}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
            {index + 1} / {fotos.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.open(buildImageUrl(foto.url), '_blank')}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex' }}
          >
            <Download size={16} />
          </button>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#fff', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNav(index - 1); }}
          style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
            width: 42, height: 42, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Image */}
      <img
        src={buildImageUrl(foto.url)}
        alt={foto.nombre}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '85%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8 }}
      />

      {/* Next */}
      {index < fotos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNav(index + 1); }}
          style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
            width: 42, height: 42, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Thumbnails */}
      {fotos.length > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 16,
            display: 'flex', gap: 6, maxWidth: '80vw', overflowX: 'auto',
          }}
        >
          {fotos.map((f, i) => (
            <button
              key={f.id_archivo}
              onClick={() => onNav(i)}
              style={{
                width: 52, height: 40, borderRadius: 6, overflow: 'hidden',
                border: `2px solid ${i === index ? C.primary : 'transparent'}`,
                padding: 0, cursor: 'pointer', flexShrink: 0,
                background: 'rgba(255,255,255,0.08)',
              }}
            >
              {isImage(f.nombre) ? (
                <img src={buildImageUrl(f.url)} alt={f.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <FileImage size={16} color="rgba(255,255,255,0.5)" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Foto Card ─────────────────────────────────────────────────────────────────
interface FotoCardProps {
  foto: FotoGaleria;
  pacienteId: number;
  onView: () => void;
  onDelete: () => void;
  onCategoriaChange: () => void;
  isDeleting: boolean;
}

function FotoCard({ foto, pacienteId, onView, onDelete, onCategoriaChange, isDeleting }: FotoCardProps) {
  const [hovered, setHovered] = useState(false);
  const [editingCat, setEditingCat] = useState(false);
  const [savingCat, setSavingCat] = useState(false);

  async function handleCategoriaChange(cat: string) {
    if (cat === foto.categoria) { setEditingCat(false); return; }
    setSavingCat(true);
    try {
      await galeriaService.actualizarCategoria(pacienteId, foto.id_archivo, cat as FotoCategoria);
      onCategoriaChange();
      setEditingCat(false);
    } catch {
      // ignore
    } finally {
      setSavingCat(false);
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.white,
        borderRadius: 10,
        border: `1px solid ${hovered ? C.primary : C.gray300}`,
        transition: 'border-color 0.18s, box-shadow 0.18s',
        boxShadow: hovered ? '0 4px 16px rgba(11,197,223,0.13)' : '0 1px 4px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Thumbnail */}
      <div
        onClick={onView}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onView(); }}
        aria-label={`Ver ${foto.nombre}`}
        style={{
          height: 148,
          background: C.primaryBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isImage(foto.nombre) ? (
          <img
            src={buildImageUrl(foto.url)}
            alt={foto.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <ImageIcon size={36} color={C.primary} />
        )}

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.18s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Eye size={18} color="#fff" />
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 10, color: C.gray500 }}>
            {formatDate(foto.consulta?.fecha_fin ?? foto.consulta?.fecha_inicio)}
          </span>
        </div>

        {/* Title */}
        <div style={{
          fontSize: 12.5, fontWeight: 600, color: C.navy,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {foto.nombre}
        </div>

        {/* Category badge (clickable) */}
        {foto.categoria && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setEditingCat(!editingCat)}
              disabled={savingCat}
              style={{
                background: CATEGORY_COLORS[foto.categoria]?.bg ?? C.gray100,
                border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 9999,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 11, fontWeight: 600,
                color: CATEGORY_COLORS[foto.categoria]?.color ?? C.gray500,
              }}
            >
              {CATEGORY_COLORS[foto.categoria]?.label ?? foto.categoria}
              <ChevronDown size={12} style={{ opacity: 0.7 }} />
            </button>

            {editingCat && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, zIndex: 100,
                background: C.white, border: `1px solid ${C.gray300}`,
                borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: 4, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 110,
              }}>
                {FOTO_CATEGORIAS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoriaChange(cat)}
                    style={{
                      background: cat === foto.categoria ? C.primaryBg : 'none',
                      border: 'none', borderRadius: 6, padding: '5px 10px',
                      cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      color: C.navy, textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: CATEGORY_COLORS[cat]?.color ?? C.gray500,
                      flexShrink: 0,
                    }} />
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Doctor */}
        {foto.consulta?.doctor && (
          <div style={{ fontSize: 11, color: C.gray500 }}>
            Dr. {foto.consulta.doctor.persona.primer_nombre} {foto.consulta.doctor.persona.primer_apellido}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <button
            onClick={onView}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: C.primary, fontWeight: 500, padding: '2px 0',
            }}
          >
            <Eye size={13} /> Ver
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={isDeleting}
            aria-label={`Eliminar ${foto.nombre}`}
            style={{
              background: 'none', border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer',
              color: C.danger, display: 'flex', padding: 4, borderRadius: 4,
              opacity: isDeleting ? 0.5 : 1,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(226,75,74,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function GaleriaFotos({ pacienteId, pacienteNombre, consultas, onBack }: GaleriaFotosProps) {
  const [fotos, setFotos] = useState<FotoGaleria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const [filterConsulta, setFilterConsulta] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FotoGaleria | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Carga de fotos ─────────────────────────────────────────────────────────
  const loadFotos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await galeriaService.getByPaciente(pacienteId);
      if (res.success) {
        setFotos(Array.isArray(res.data) ? res.data : []);
      } else {
        setError(res.message ?? 'Error al cargar la galería.');
      }
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Error al cargar la galería.');
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => { loadFotos(); }, [loadFotos]);

  // Stats
  const totalFotos = fotos.length;
  const ultimaActualizacion = useMemo(() => {
    const fechas = fotos
      .map((f) => f.consulta?.fecha_fin ?? f.consulta?.fecha_inicio)
      .filter(Boolean)
      .sort()
      .reverse();
    return fechas[0] ? formatDate(fechas[0]) : '—';
  }, [fotos]);

  // Filter options
  const consultaOptions = useMemo(() => [
    { value: '', label: 'Todas las consultas' },
    ...consultas.map((c) => ({
      value: String(c.id_consulta),
      label: formatDate(c.fecha_fin ?? c.fecha_inicio),
    })),
  ], [consultas]);

  // Filter options
  const categoriaOptions = useMemo(() => [
    { value: '', label: 'Todas las categorías' },
    ...FOTO_CATEGORIAS.map((c) => ({ value: c, label: c })),
  ], []);

  // Filtered fotos
  const fotosFiltradas = useMemo(() => {
    let result = fotos;
    if (filterConsulta) {
      result = result.filter((f) => String(f.id_consulta) === filterConsulta);
    }
    if (filterCategoria) {
      result = result.filter((f) => f.categoria === filterCategoria);
    }
    return result;
  }, [fotos, filterConsulta, filterCategoria]);

  // Lightbox images only
  const fotosImagen = useMemo(() => fotosFiltradas.filter((f) => isImage(f.nombre)), [fotosFiltradas]);

  function openLightbox(foto: FotoGaleria) {
    if (!isImage(foto.nombre)) { window.open(buildImageUrl(foto.url), '_blank'); return; }
    const idx = fotosImagen.findIndex((f) => f.id_archivo === foto.id_archivo);
    setLightboxIndex(idx >= 0 ? idx : null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await galeriaService.eliminarFoto(pacienteId, deleteTarget.id_archivo);
      setFotos((prev) => prev.filter((f) => f.id_archivo !== deleteTarget.id_archivo));
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Error al eliminar.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: 'calc(100vh - 110px)' }}>

      {/* ── Back button row ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <Button variant="ghost" size="sm" onClick={onBack} style={{ color: C.gray500 }}>
          <ArrowLeft size={16} /> Volver al expediente
        </Button>
      </div>

      {/* ── Banner informativo ──────────────────────────────────────────────── */}
      {showBanner && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: C.primaryBg,
          border: `1px solid rgba(11,197,223,0.3)`,
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
        }}>
          <Info size={15} color={C.primary} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: '#0899B0', fontWeight: 500 }}>
            Las fotos quedan vinculadas al expediente del paciente.
          </span>
          <button
            onClick={() => setShowBanner(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gray500, display: 'flex', padding: 2 }}
            aria-label="Cerrar aviso"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="error" message={error} onClose={() => setError('')} />
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
        {/* Total de fotos */}
        <div style={{
          background: C.white, border: `1px solid ${C.gray300}`, borderRadius: 12,
          padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
              Total de fotos
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.navy, lineHeight: 1 }}>
              {loading ? '—' : totalFotos}
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: C.primaryBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ImageIcon size={20} color={C.primary} />
          </div>
        </div>

        {/* Última actualización */}
        <div style={{
          background: C.white, border: `1px solid ${C.gray300}`, borderRadius: 12,
          padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.gray500, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
              Última actualización
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, lineHeight: 1 }}>
              {loading ? '—' : ultimaActualizacion}
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: C.primaryBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={20} color={C.primary} />
          </div>
        </div>
      </div>

      {/* ── Filters + Actions bar ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap',
      }}>
        {/* Filter dropdowns */}
        <div style={{ flex: 1, minWidth: 120, maxWidth: 200 }}>
          <Select
            options={categoriaOptions}
            value={filterCategoria}
            onChange={setFilterCategoria}
            placeholder="Categoría"
          />
        </div>
        <div style={{ flex: 1, minWidth: 120, maxWidth: 200 }}>
          <Select
            options={consultaOptions}
            value={filterConsulta}
            onChange={setFilterConsulta}
            placeholder="Consulta"
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUpload(true)}
            id="btn-subir-foto"
          >
            <Upload size={14} /> Subir foto
          </Button>
        </div>
      </div>

      {/* ── Results count ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 13, color: C.gray700 }}>
          Mostrando <strong>{fotosFiltradas.length}</strong> de {totalFotos} fotos
        </span>
      </div>

      {/* ── Photo Grid ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              height: 230, borderRadius: 10,
              background: C.gray100,
              animation: 'pulse 1.4s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : fotosFiltradas.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '56px 24px', gap: 14,
          border: `2px dashed ${C.gray300}`, borderRadius: 12, background: C.white,
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: C.primaryBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ImageIcon size={28} color={C.primary} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.navy, marginBottom: 5 }}>
              Sin fotos en la galería
            </div>
            <div style={{ fontSize: 13, color: C.gray500, maxWidth: 300, lineHeight: 1.6 }}>
              Sube la primera foto para comenzar el registro visual del paciente.
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowUpload(true)}>
            <Upload size={13} /> Subir foto
          </Button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {fotosFiltradas.map((foto) => (
            <FotoCard
              key={foto.id_archivo}
              foto={foto}
              pacienteId={pacienteId}
              onView={() => openLightbox(foto)}
              onDelete={() => setDeleteTarget(foto)}
              onCategoriaChange={loadFotos}
              isDeleting={isDeleting && deleteTarget?.id_archivo === foto.id_archivo}
            />
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showUpload && (
        <UploadModal
          pacienteId={pacienteId}
          consultas={consultas}
          onSuccess={() => { setShowUpload(false); loadFotos(); }}
          onClose={() => setShowUpload(false)}
        />
      )}

      {lightboxIndex !== null && (
        <Lightbox
          fotos={fotosImagen}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNav={setLightboxIndex}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar foto"
        description={`¿Eliminar "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        loading={isDeleting}
      />

      {/* Keyframe pulse */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
    </div>
  );
}
