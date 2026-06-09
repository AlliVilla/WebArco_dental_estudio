import React, { useState } from 'react';
import { Calendar, Plus, Search, Clock, Phone, CheckCircle, XCircle, ChevronLeft, ChevronRight, Filter, FileText } from 'lucide-react';
import { Card, Button, Input, Avatar } from '../../../context';
import { Appointment } from '../types';

interface LocalAppointment extends Omit<Appointment, 'paciente' | 'doctor'> {
  paciente: {
    nombre: string;
    apellido: string;
    telefono: string;
    correo: string;
  };
  doctor: {
    nombre: string;
    apellido: string;
  };
}

// Mock initial data based on Appointment & AppointmentStatus
const initialAppointments: LocalAppointment[] = [
  {
    id: 1,
    fecha: '2026-06-08T09:00:00',
    motivo: 'Limpieza dental y profilaxis',
    estado: 'CONFIRMADA' as const,
    id_paciente: 3,
    id_usuario_doctor: 1,
    observaciones: 'Paciente requiere revisión de sensibilidad en encías.',
    paciente: {
      nombre: 'María José',
      apellido: 'González Flores',
      telefono: '+504 3311-2244',
      correo: 'maria.gonzalez@example.com'
    },
    doctor: {
      nombre: 'Dr. Karla',
      apellido: 'Arita'
    }
  },
  {
    id: 2,
    fecha: '2026-06-08T10:30:00',
    motivo: 'Extracción de molar #36',
    estado: 'PENDIENTE' as const,
    id_paciente: 2,
    id_usuario_doctor: 2,
    observaciones: 'Traer radiografía panorámica.',
    paciente: {
      nombre: 'Carlos',
      apellido: 'Vega Salgado',
      telefono: '+504 9455-1234',
      correo: 'carlos.vega@example.com'
    },
    doctor: {
      nombre: 'Dr. Marco',
      apellido: 'Salinas'
    }
  },
  {
    id: 3,
    fecha: '2026-06-08T11:00:00',
    motivo: 'Blanqueamiento Dental',
    estado: 'COMPLETADA' as const,
    id_paciente: 1,
    id_usuario_doctor: 1,
    observaciones: 'Primera sesión completada con éxito. Indicar cuidados post-blanqueamiento.',
    paciente: {
      nombre: 'Ana',
      apellido: 'López Martínez',
      telefono: '+504 9988-7766',
      correo: 'ana.lopez@example.com'
    },
    doctor: {
      nombre: 'Dr. Karla',
      apellido: 'Arita'
    }
  },
  {
    id: 4,
    fecha: '2026-06-08T14:30:00',
    motivo: 'Endodoncia pieza #21',
    estado: 'CONFIRMADA' as const,
    id_paciente: 1,
    id_usuario_doctor: 2,
    observaciones: 'Segunda cita para obturación de conducto.',
    paciente: {
      nombre: 'Ana',
      apellido: 'López Martínez',
      telefono: '+504 9988-7766',
      correo: 'ana.lopez@example.com'
    },
    doctor: {
      nombre: 'Dr. Marco',
      apellido: 'Salinas'
    }
  },
  {
    id: 5,
    fecha: '2026-06-09T09:30:00',
    motivo: 'Revisión y Ajuste de Ortodoncia',
    estado: 'CONFIRMADA' as const,
    id_paciente: 2,
    id_usuario_doctor: 1,
    observaciones: 'Ajuste de brackets superior e inferior.',
    paciente: {
      nombre: 'Carlos',
      apellido: 'Vega Salgado',
      telefono: '+504 9455-1234',
      correo: 'carlos.vega@example.com'
    },
    doctor: {
      nombre: 'Dr. Karla',
      apellido: 'Arita'
    }
  },
  {
    id: 6,
    fecha: '2026-06-09T15:00:00',
    motivo: 'Corona dental en cerámica #25',
    estado: 'CANCELADA' as const,
    id_paciente: 4,
    id_usuario_doctor: 1,
    observaciones: 'Cancelado por el paciente por problemas de transporte.',
    paciente: {
      nombre: 'Roberto José',
      apellido: 'Díaz Alvarado',
      telefono: '+504 9876-5432',
      correo: 'roberto.diaz@example.com'
    },
    doctor: {
      nombre: 'Dr. Karla',
      apellido: 'Arita'
    }
  }
];

export function AppointmentsScreen() {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [filterStatus, setFilterStatus] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-06-08');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [pacienteId, setPacienteId] = useState(1);
  const [doctorId, setDoctorId] = useState(1);
  const [fecha, setFecha] = useState('2026-06-08');
  const [hora, setHora] = useState('09:00');
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const statusColors: Record<'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA', { bg: string; text: string; label: string }> = {
    PENDIENTE: { bg: '#FFFBEB', text: '#EF9F27', label: 'Pendiente' },
    CONFIRMADA: { bg: '#E6F8FB', text: '#0BC5DF', label: 'Confirmada' },
    COMPLETADA: { bg: '#ECFDF5', text: '#1D9E75', label: 'Completada' },
    CANCELADA: { bg: '#FEF2F2', text: '#E24B4A', label: 'Cancelada' }
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo || !fecha || !hora) {
      alert('Por favor complete todos los campos');
      return;
    }

    const patientMap: Record<number, any> = {
      1: { nombre: 'Ana', apellido: 'López Martínez', telefono: '+504 9988-7766', correo: 'ana.lopez@example.com' },
      2: { nombre: 'Carlos', apellido: 'Vega Salgado', telefono: '+504 9455-1234', correo: 'carlos.vega@example.com' },
      3: { nombre: 'María José', apellido: 'González Flores', telefono: '+504 3311-2244', correo: 'maria.gonzalez@example.com' },
      4: { nombre: 'Roberto José', apellido: 'Díaz Alvarado', telefono: '+504 9876-5432', correo: 'roberto.diaz@example.com' }
    };

    const doctorMap: Record<number, any> = {
      1: { nombre: 'Dr. Karla', apellido: 'Arita' },
      2: { nombre: 'Dr. Marco', apellido: 'Salinas' }
    };

    const newAppt = {
      id: Math.max(...appointments.map((a: LocalAppointment) => a.id), 0) + 1,
      fecha: `${fecha}T${hora}:00`,
      motivo,
      estado: 'PENDIENTE' as const,
      id_paciente: pacienteId,
      id_usuario_doctor: doctorId,
      observaciones,
      paciente: patientMap[pacienteId],
      doctor: doctorMap[doctorId]
    };

    setAppointments([...appointments, newAppt]);
    setIsAdding(false);
    setMotivo('');
    setObservaciones('');
  };

  const updateStatus = (id: number, newStatus: 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA') => {
    setAppointments(appointments.map((a: LocalAppointment) => a.id === id ? { ...a, estado: newStatus } : a));
  };

  // Filtered list
  const filteredAppointments = appointments.filter((a: LocalAppointment) => {
    const apptDate = a.fecha.split('T')[0];
    const matchDate = apptDate === selectedDate;
    const matchStatus = filterStatus === 'TODAS' || a.estado === filterStatus;
    const matchSearch = searchQuery === '' ||
      `${a.paciente.nombre} ${a.paciente.apellido}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.motivo.toLowerCase().includes(searchQuery.toLowerCase());

    return matchDate && matchStatus && matchSearch;
  });

  const getFormatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', options);
  };

  const shiftDate = (amount: number) => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + amount);
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDate.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, color: '#203F49', fontWeight: 600 }}>Agenda de Citas</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888F94' }}>
            Planifica consultas, controla los estados de cita y asigna doctores de manera eficiente.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} variant="primary">
          <Plus size={16} /> Nueva Cita
        </Button>
      </div>

      {/* Main Grid: Filters & Listing */}
      <div className="appt-layout">
        {/* Navigation and Filters Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Mini Calendar Picker */}
          <Card>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 13, color: '#203F49', fontWeight: 600 }}>Fecha de Consulta</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8F9FA', borderRadius: 8, padding: 8 }}>
                <button onClick={() => shiftDate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0BC5DF', display: 'flex' }}>
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#203F49' }}>
                  {selectedDate === new Date().toISOString().split('T')[0] ? 'Hoy' : selectedDate}
                </span>
                <button onClick={() => shiftDate(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0BC5DF', display: 'flex' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </Card>

          {/* Quick Filters */}
          <Card>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 13, color: '#203F49', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} style={{ color: '#0BC5DF' }} /> Filtrar por Estado
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['TODAS', 'PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA'].map(st => {
                const isActive = filterStatus === st;
                return (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      textAlign: 'left',
                      background: isActive ? '#E6F8FB' : 'transparent',
                      color: isActive ? '#0BC5DF' : '#5F656A',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) e.currentTarget.style.background = '#F8F9FA';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{st === 'TODAS' ? 'Todas las citas' : statusColors[st as keyof typeof statusColors].label}</span>
                    <span style={{
                      fontSize: 10,
                      background: isActive ? '#0BC5DF' : '#F1F3F4',
                      color: isActive ? '#fff' : '#888F94',
                      borderRadius: 10,
                      padding: '1px 6px',
                      minWidth: 16,
                      textAlign: 'center'
                    }}>
                      {st === 'TODAS'
                        ? appointments.filter((a: LocalAppointment) => a.fecha.split('T')[0] === selectedDate).length
                        : appointments.filter((a: LocalAppointment) => a.fecha.split('T')[0] === selectedDate && a.estado === st).length
                      }
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Appointments List Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title Header Card */}
          <Card style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#203F49' }}>
              Citas para el: <span style={{ color: '#0BC5DF' }}>{getFormatDate(selectedDate)}</span>
            </span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', maxWidth: 240 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, color: '#888F94' }} />
              <input
                type="text"
                placeholder="Buscar paciente o motivo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  borderRadius: 6,
                  border: '1px solid #D3D7DA',
                  fontSize: 12,
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </Card>

          {/* List Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredAppointments.length === 0 ? (
              <Card style={{ padding: 48, textAlign: 'center', color: '#888F94' }}>
                <Calendar size={36} style={{ color: '#CDD0D5', marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                <span>No hay citas programadas para esta fecha con los filtros actuales.</span>
              </Card>
            ) : (
              filteredAppointments.map((appt: LocalAppointment) => {
                const sColor = statusColors[appt.estado];
                const time = appt.fecha.split('T')[1].substring(0, 5);
                return (
                  <Card key={appt.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      {/* Left Side: Time and Patient */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F1F3F4', borderRadius: 8, padding: '6px 10px', minWidth: 60 }}>
                          <Clock size={14} style={{ color: '#0BC5DF', marginBottom: 2 }} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#203F49' }}>{time}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <Avatar initials={`${appt.paciente.nombre[0]}${appt.paciente.apellido[0]}`} size={36} color="#0BC5DF" />
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#203F49' }}>
                              {appt.paciente.nombre} {appt.paciente.apellido}
                            </span>
                            <div style={{ fontSize: 11, color: '#888F94', display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Phone size={10} /> {appt.paciente.telefono}</span>
                              <span>·</span>
                              <span>Doctor: {appt.doctor.nombre} {appt.doctor.apellido}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Status Badge */}
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: sColor.bg,
                        color: sColor.text
                      }}>
                        {sColor.label}
                      </span>
                    </div>

                    {/* Middle Row: Motivo & Observaciones */}
                    <div style={{ borderTop: '1px solid #F1F3F4', borderBottom: '1px solid #F1F3F4', padding: '10px 0' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>
                        Motivo: <span style={{ fontWeight: 400, color: '#5F656A' }}>{appt.motivo}</span>
                      </div>
                      {appt.observaciones && (
                        <div style={{ fontSize: 11, color: '#888F94', marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                          <FileText size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>Observaciones: {appt.observaciones}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#888F94' }}>ID Cita: #{appt.id}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {appt.estado !== 'COMPLETADA' && appt.estado !== 'CANCELADA' && (
                          <>
                            <button
                              onClick={() => updateStatus(appt.id, 'COMPLETADA')}
                              style={{
                                background: '#ECFDF5', border: '1px solid #D1FAE5', borderRadius: 6, cursor: 'pointer',
                                padding: '4px 10px', fontSize: 11, color: '#1D9E75', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <CheckCircle size={12} /> Completar
                            </button>
                            <button
                              onClick={() => updateStatus(appt.id, 'CANCELADA')}
                              style={{
                                background: '#FEF2F2', border: '1px solid #FEE2E2', borderRadius: 6, cursor: 'pointer',
                                padding: '4px 10px', fontSize: 11, color: '#E24B4A', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <XCircle size={12} /> Cancelar
                            </button>
                          </>
                        )}
                        {appt.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => updateStatus(appt.id, 'CONFIRMADA')}
                            style={{
                              background: '#E6F8FB', border: '1px solid #B2EDF5', borderRadius: 6, cursor: 'pointer',
                              padding: '4px 10px', fontSize: 11, color: '#0BC5DF', fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            Confirmar
                          </button>
                        )}
                        {(appt.estado === 'COMPLETADA' || appt.estado === 'CANCELADA') && (
                          <button
                            onClick={() => updateStatus(appt.id, 'PENDIENTE')}
                            style={{
                              background: '#F8F9FA', border: '1px solid #D3D7DA', borderRadius: 6, cursor: 'pointer',
                              padding: '4px 10px', fontSize: 11, color: '#5F656A', fontWeight: 600
                            }}
                          >
                            Reabrir
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      <style>{`
        .appt-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 20px;
        }
        @media (max-width: 860px) {
          .appt-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Modal - Schedule Appointment */}
      {isAdding && (
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
                <Calendar size={18} style={{ color: '#0BC5DF' }} />
                <h3 style={{ margin: 0, color: '#203F49', fontSize: 15, fontWeight: 600 }}>Programar Nueva Cita</h3>
              </div>
              <button onClick={() => setIsAdding(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888F94', fontSize: 18 }}>
                <XCircle size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAppointment} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Paciente</label>
                <select
                  value={pacienteId}
                  onChange={e => setPacienteId(Number(e.target.value))}
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
                  <option value={1}>Ana López Martínez (Exp. 2024-00142)</option>
                  <option value={2}>Carlos Vega Salgado (Exp. 2024-00085)</option>
                  <option value={3}>María José González Flores (Exp. 2023-00512)</option>
                  <option value={4}>Roberto José Díaz Alvarado (Exp. 2025-00012)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Doctor Responsable</label>
                <select
                  value={doctorId}
                  onChange={e => setDoctorId(Number(e.target.value))}
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
                  <option value={1}>Dr. Karla Arita (Odontóloga General)</option>
                  <option value={2}>Dr. Marco Salinas (Endodoncista)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input
                  label="Fecha"
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                />
                <Input
                  label="Hora"
                  type="time"
                  value={hora}
                  onChange={e => setHora(e.target.value)}
                />
              </div>

              <Input
                label="Motivo de la Cita"
                badge="required"
                placeholder="Ej. Extracción, limpieza, ortodoncia..."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#203F49' }}>Observaciones</label>
                <textarea
                  value={observaciones}
                  placeholder="Instrucciones especiales para la cita..."
                  onChange={e => setObservaciones(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 50,
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
                <Button variant="secondary" type="button" onClick={() => setIsAdding(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  Programar Cita
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
