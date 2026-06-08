import { useState } from 'react';
import { Card, Button, Input, Alert, Avatar } from '../../../context';
import { DollarSign, TrendingUp, Calendar, Users, Plus, FileSpreadsheet, Printer, Search, Eye, Edit, Trash2, XCircle } from 'lucide-react';

interface IncomeRecord {
  id: string;
  fecha: string;
  paciente: string;
  tratamiento: string;
  monto: number;
  metodoPago: 'Efectivo' | 'Tarjeta' | 'Transferencia';
  doctor: string;
  estado: 'Pagado' | 'Pendiente' | 'Parcial';
}

const mockData: IncomeRecord[] = [
  { id: '1', fecha: '2026-06-03', paciente: 'María González', tratamiento: 'Limpieza dental', monto: 1200, metodoPago: 'Tarjeta', doctor: 'Dr. Karla Arita', estado: 'Pagado' },
  { id: '2', fecha: '2026-06-02', paciente: 'Juan Pérez', tratamiento: 'Ortodoncia - Consulta', monto: 2500, metodoPago: 'Efectivo', doctor: 'Dr. Karla Arita', estado: 'Pendiente' },
  { id: '3', fecha: '2026-06-01', paciente: 'Ana Rodríguez', tratamiento: 'Endodoncia', monto: 3800, metodoPago: 'Transferencia', doctor: 'Dr. Karla Arita', estado: 'Pagado' },
  { id: '4', fecha: '2026-06-01', paciente: 'Carlos Méndez', tratamiento: 'Extracción', monto: 800, metodoPago: 'Efectivo', doctor: 'Dr. Karla Arita', estado: 'Pagado' },
  { id: '5', fecha: '2026-05-31', paciente: 'Sofía Torres', tratamiento: 'Implante dental', monto: 15000, metodoPago: 'Transferencia', doctor: 'Dr. Karla Arita', estado: 'Parcial' },
];

export function GestionIngresos() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [records, setRecords] = useState<IncomeRecord[]>(mockData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');

  // Form states
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [paciente, setPaciente] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [observaciones, setObservaciones] = useState('');

  const kpis = [
    { label: 'Ingresos del Mes', value: '$45,230.00', icon: DollarSign, color: '#0BC5DF', bg: '#E6F8FB' },
    { label: 'Total Pendiente', value: '$12,450.00', icon: TrendingUp, color: '#EF9F27', bg: '#FFFBEB' },
    { label: 'Ingresos del Día', value: '$3,200.00', icon: Calendar, color: '#1D9E75', bg: '#ECFDF5' },
    { label: 'Promedio por Paciente', value: '$1,850.00', icon: Users, color: '#203F49', bg: '#F1F3F4' },
  ];

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, { bg: string; text: string }> = {
      'Pagado': { bg: '#ECFDF5', text: '#1D9E75' },
      'Pendiente': { bg: '#FFFBEB', text: '#EF9F27' },
      'Parcial': { bg: '#E6F8FB', text: '#0BC5DF' },
    };
    const variant = variants[estado] || variants['Pendiente'];
    return (
      <span style={{
        background: variant.bg,
        color: variant.text,
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600
      }}>
        {estado}
      </span>
    );
  };

  const getMetodoPagoBadge = (metodo: string) => {
    return (
      <span style={{
        background: '#F1F3F4',
        color: '#5F656A',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600
      }}>
        {metodo}
      </span>
    );
  };

  const handleRegisterIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paciente || !tratamiento || !monto) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    const newRecord: IncomeRecord = {
      id: String(records.length + 1),
      fecha,
      paciente,
      tratamiento,
      monto: Number(monto),
      metodoPago,
      doctor: 'Dr. Karla Arita',
      estado: 'Pagado'
    };

    setRecords([newRecord, ...records]);
    setIsDialogOpen(false);
    setPaciente('');
    setTratamiento('');
    setMonto('');
    setObservaciones('');
  };

  const filteredRecords = records.filter((r: IncomeRecord) => {
    const matchSearch = r.paciente.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        r.tratamiento.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMethod = filterMethod === 'todos' || r.metodoPago.toLowerCase() === filterMethod.toLowerCase();
    const matchStatus = filterStatus === 'todos' || r.estado.toLowerCase() === filterStatus.toLowerCase();

    return matchSearch && matchMethod && matchStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Alert informativo */}
      <Alert variant="info" message="Los ingresos se registran automáticamente en el historial del paciente." />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px 0' }}>{kpi.label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#203F49', margin: 0 }}>{kpi.value}</p>
              </div>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: kpi.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <kpi.icon size={20} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtros y acciones */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, color: '#203F49', fontSize: 15, fontWeight: 600 }}>Registros de Ingresos</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888F94' }}>Gestiona todos los ingresos de la clínica</p>
          </div>
          <Button variant="primary" onClick={() => setIsDialogOpen(true)} style={{ gap: 8 }}>
            <Plus size={16} /> Registrar Ingreso
          </Button>
        </div>

        {/* Filtros */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: '#888F94' }} />
            <input
              type="text"
              placeholder="Buscar paciente o tratamiento..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: 8,
                border: '1px solid #D3D7DA',
                fontSize: 12,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #D3D7DA', fontSize: 12, outline: 'none', color: '#5F656A', background: '#fff' }}
          >
            <option value="todos">Todos los métodos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #D3D7DA', fontSize: 12, outline: 'none', color: '#5F656A', background: '#fff' }}
          >
            <option value="todos">Todos los estados</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
          </select>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => alert('Exportando registros a Excel...')} style={{ gap: 6, flex: 1 }}>
              <FileSpreadsheet size={13} /> Exportar
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()} style={{ gap: 6, flex: 1 }}>
              <Printer size={13} /> Imprimir
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ border: '0.5px solid #D3D7DA', borderRadius: 8, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #D3D7DA' }}>
                <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase' }}>Fecha</th>
                <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase' }}>Paciente</th>
                <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase' }}>Tratamiento</th>
                <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase' }}>Monto</th>
                <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase' }}>Método de pago</th>
                <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase' }}>Doctor</th>
                <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase' }}>Estado</th>
                <th style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#888F94', fontSize: 13 }}>
                    No se encontraron registros de ingresos.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record: IncomeRecord, idx: number) => (
                  <tr key={record.id} style={{ borderBottom: idx < filteredRecords.length - 1 ? '1px solid #F1F3F4' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#5F656A' }}>{record.fecha}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar initials={`${record.paciente[0]}${record.paciente.split(' ')[1]?.[0] || ''}`} size={24} color="#0BC5DF" />
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>{record.paciente}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#203F49' }}>{record.tratamiento}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#1D9E75' }}>
                      ${record.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{getMetodoPagoBadge(record.metodoPago)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#5F656A' }}>{record.doctor}</td>
                    <td style={{ padding: '12px 16px' }}>{getEstadoBadge(record.estado)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button onClick={() => alert(`Detalles: ${record.paciente} - ${record.tratamiento}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#888F94' }}>
                          <Eye size={14} />
                        </button>
                        <button onClick={() => alert('Editar próximamente')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#888F94' }}>
                          <Edit size={14} />
                        </button>
                        <button onClick={() => { if(confirm('¿Eliminar registro?')) setRecords(records.filter(r => r.id !== record.id)) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#E24B4A' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal - Registrar Ingreso */}
      {isDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(32, 63, 73, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 500,
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EAECEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={18} style={{ color: '#0BC5DF' }} />
                <h3 style={{ margin: 0, color: '#203F49', fontSize: 15, fontWeight: 600 }}>Registrar Nuevo Ingreso</h3>
              </div>
              <button onClick={() => setIsDialogOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888F94', fontSize: 18 }}>
                <XCircle size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRegisterIncome} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input
                  label="Fecha"
                  type="date"
                  badge="required"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                />
                <Input
                  label="Paciente"
                  badge="required"
                  placeholder="Nombre del paciente..."
                  value={paciente}
                  onChange={e => setPaciente(e.target.value)}
                />
              </div>

              <Input
                label="Tratamiento / Concepto"
                badge="required"
                placeholder="Ej. Limpieza dental, Resina..."
                value={tratamiento}
                onChange={e => setTratamiento(e.target.value)}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input
                  label="Monto ($)"
                  badge="required"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Método de pago</label>
                  <select
                    value={metodoPago}
                    onChange={e => setMetodoPago(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #D3D7DA',
                      outline: 'none',
                      fontSize: 14,
                      background: '#fff',
                      color: '#203F49'
                    }}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              <Input
                label="Doctor Responsable"
                disabled
                value="Dr. Karla Arita"
                style={{ background: '#F1F3F4' }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Observaciones</label>
                <textarea
                  value={observaciones}
                  placeholder="Notas o comentarios adicionales..."
                  onChange={e => setObservaciones(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 60,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #D3D7DA',
                    outline: 'none',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <Button variant="secondary" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  Registrar Ingreso
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
