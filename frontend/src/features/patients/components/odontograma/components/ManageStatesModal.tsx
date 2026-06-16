import { useState, useEffect } from 'react';
import { estadoOdontogramaService, type EstadoOdontograma } from '../services/estadoOdontogramaService';
import { Button } from '../../../../../context';
import { ConfirmModal } from '../../../../../components';

function normalizeNombre(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

interface ManageStatesModalProps {
  open: boolean;
  onClose: () => void;
}

export function ManageStatesModal({ open, onClose }: ManageStatesModalProps) {
  const [estados, setEstados] = useState<EstadoOdontograma[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColor, setEditColor] = useState('#A8D5BA');

  const [creating, setCreating] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newColor, setNewColor] = useState('#A8D5BA');

  const [confirmDelete, setConfirmDelete] = useState<{ id: number; nombre: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await estadoOdontogramaService.getAll();
      const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
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

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await estadoOdontogramaService.remove(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar estado');
      setConfirmDelete(null);
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
                    <button onClick={() => setConfirmDelete({ id: e.id, nombre: e.nombre })} style={{ padding: '4px 10px', borderRadius: 6, background: 'transparent', color: '#E24B4A', border: '1px solid #E24B4A', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
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

      </div>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar estado"
        description={`¿Estás seguro de eliminar el estado "${confirmDelete?.nombre}"? Los dientes que usen este estado se mostrarán sin configuración de color. Nota: Si el estado está siendo usado en algún odontograma, NO se podrá eliminar.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
