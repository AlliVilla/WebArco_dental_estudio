import { useState, useEffect } from 'react';
import { estadoOdontogramaService, type EstadoOdontograma } from '../services/estadoOdontogramaService';
import { Button } from '../../../../../context';

function normalizeNombre(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

interface ManageStatesModalProps {
  open: boolean;
  onClose: () => void;
  onDeleteError?: (message: string) => void;
}

export function ManageStatesModal({ open, onClose, onDeleteError }: ManageStatesModalProps) {
  const [estados, setEstados] = useState<EstadoOdontograma[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColor, setEditColor] = useState('#A8D5BA');

  const [creating, setCreating] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newColor, setNewColor] = useState('#A8D5BA');

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeleteNombre, setConfirmDeleteNombre] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await estadoOdontogramaService.getAll();
      const raw = (res as any).data ?? res;  // cubre envelope o respuesta directa
      const data: EstadoOdontograma[] = Array.isArray(raw) ? raw : [];
      setEstados(data);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar estados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleCreate = async () => {
    const nombre = normalizeNombre(newNombre.trim());
    if (!nombre) { setError('El nombre es requerido'); return; }
    const duplicate = estados.find(e => stripAccents(e.nombre.toLowerCase()) === stripAccents(nombre.toLowerCase()));
    if (duplicate) { setError(`Ya existe un estado con el nombre "${duplicate.nombre}"`); return; }
    setError(null);
    try {
      await estadoOdontogramaService.create(nombre, newColor);
      setNewNombre('');
      setNewColor('#A8D5BA');
      setCreating(false);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Error al crear estado');
    }
  };

  const startEdit = (e: EstadoOdontograma) => {
    setEditingId(e.id);
    setEditNombre(e.nombre);
    setEditColor(e.color);
    setError(null);
  };

  const handleUpdate = async () => {
    if (editingId === null) return;
    const nombre = normalizeNombre(editNombre.trim());
    if (!nombre) { setError('El nombre es requerido'); return; }
    const duplicate = estados.find(e => e.id !== editingId && stripAccents(e.nombre.toLowerCase()) === stripAccents(nombre.toLowerCase()));
    if (duplicate) { setError(`Ya existe otro estado con el nombre "${duplicate.nombre}"`); return; }
    setError(null);
    try {
      await estadoOdontogramaService.update(editingId, nombre, editColor);
      setEditingId(null);
      setEditNombre('');
      setEditColor('#A8D5BA');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar estado');
    }
  };

  const handleDeleteConfirm = async () => {
    if (confirmDeleteId === null) return;
    setDeleting(true);
    try {
      await estadoOdontogramaService.remove(confirmDeleteId);
      setConfirmDeleteId(null);
      setConfirmDeleteNombre('');
      setDeleting(false);
      await load();
    } catch (err: any) {
      setDeleting(false);
      setConfirmDeleteId(null);
      setConfirmDeleteNombre('');
      onDeleteError?.(err?.message || 'Error al eliminar estado');
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(2px)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: 12, padding: 24,
          width: '100%', maxWidth: 520,
          boxShadow: '0px 10px 30px rgba(0,0,0,0.15)', zIndex: 201,
          outline: 'none', maxHeight: '90vh', overflowY: 'auto',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#203F49' }}>Gestionar Estados del Odontograma</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, color: '#0A0A0A', padding: 2, lineHeight: 1, fontSize: 18 }}>✕</button>
        </div>

        {error && (
          <div style={{ background: '#FDF0F0', border: '1px solid #E24B4A', borderRadius: 8, padding: '8px 12px', color: '#E24B4A', fontSize: 13, marginBottom: 16 }}>
            {error}
            <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', color: '#E24B4A' }}>✕</button>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888F94' }}>Cargando...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {estados.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: '#F8F9FA', border: '1px solid #EAECEE' }}>
                {editingId === e.id ? (
                  <>
                    <input
                      value={editNombre}
                      onChange={e2 => setEditNombre(e2.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #D3D7DA', fontSize: 13 }}
                      placeholder="Nombre"
                    />
                    <input
                      type="color"
                      value={editColor}
                      onChange={e2 => setEditColor(e2.target.value)}
                      style={{ width: 36, height: 32, padding: 0, border: '1px solid #D3D7DA', borderRadius: 6, cursor: 'pointer' }}
                    />
                    <button onClick={handleUpdate} style={{ padding: '6px 14px', borderRadius: 6, background: '#0BC5DF', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Guardar</button>
                    <button onClick={() => { setEditingId(null); setError(null); }} style={{ padding: '6px 10px', borderRadius: 6, background: 'transparent', color: '#888F94', border: '1px solid #D3D7DA', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <span style={{ width: 28, height: 28, borderRadius: 6, background: e.color, border: '1px solid #D3D7DA', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14, color: '#203F49', fontWeight: 500 }}>{e.nombre}</span>
                    <span style={{ fontSize: 11, color: '#888F94' }}>{e.color}</span>
                    <button onClick={() => startEdit(e)} style={{ padding: '4px 10px', borderRadius: 6, background: 'transparent', color: '#5F656A', border: '1px solid #D3D7DA', fontSize: 12, cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => { setConfirmDeleteId(e.id); setConfirmDeleteNombre(e.nombre); setError(null); }} style={{ padding: '4px 10px', borderRadius: 6, background: 'transparent', color: '#E24B4A', border: '1px solid #E24B4A', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {creating ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: '#F1F9FF', border: '1px solid #0BC5DF' }}>
            <input
              value={newNombre}
              onChange={e => setNewNombre(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #D3D7DA', fontSize: 13 }}
              placeholder="Nombre del nuevo estado"
            />
            <input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              style={{ width: 36, height: 32, padding: 0, border: '1px solid #D3D7DA', borderRadius: 6, cursor: 'pointer' }}
            />
            <button onClick={handleCreate} style={{ padding: '6px 14px', borderRadius: 6, background: '#1D9E75', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Crear</button>
            <button onClick={() => { setCreating(false); setNewNombre(''); setNewColor('#A8D5BA'); setError(null); }} style={{ padding: '6px 10px', borderRadius: 6, background: 'transparent', color: '#888F94', border: '1px solid #D3D7DA', fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
          </div>
        ) : (
          <Button variant="primary" onClick={() => { setCreating(true); setError(null); }} style={{ width: '100%' }}>
            + Agregar nuevo estado
          </Button>
        )}

        {/* Inline delete confirmation */}
        {confirmDeleteId !== null && (
          <div
            style={{
              position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)',
              borderRadius: 12, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, zIndex: 10,
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V12" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 16H12.01" stroke="#E24B4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4 style={{ margin: 0, color: '#203F49', fontSize: 18 }}>Eliminar estado</h4>
            <p style={{ margin: 0, fontSize: 14, color: '#5F656A', textAlign: 'center', lineHeight: '20px' }}>
              ¿Estás seguro de eliminar el estado "<strong>{confirmDeleteNombre}</strong>"? Los dientes que usen este estado se mostrarán sin configuración de color.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => { setConfirmDeleteId(null); setConfirmDeleteNombre(''); }} style={{ padding: '9px 20px', borderRadius: 8, background: '#F1F3F4', color: '#5F656A', border: '1px solid #D3D7DA', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleDeleteConfirm} disabled={deleting} style={{ padding: '9px 20px', borderRadius: 8, background: deleting ? '#F5A5A5' : '#E24B4A', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
