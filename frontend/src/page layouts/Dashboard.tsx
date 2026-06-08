import { Users, Calendar, TrendingUp, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { Card, StatusBadge, Avatar } from '../context';

const appointmentsToday = [
  { time: '09:00', patient: 'María González', treatment: 'Limpieza dental', status: 'confirmada' as const, avatar: 'MG' },
  { time: '10:30', patient: 'Carlos Vega', treatment: 'Extracción #36', status: 'programada' as const, avatar: 'CV' },
  { time: '11:00', patient: 'Ana Torres', treatment: 'Blanqueamiento', status: 'atendida' as const, avatar: 'AT' },
  { time: '12:00', patient: 'Roberto Díaz', treatment: 'Revisión ortodoncia', status: 'ausente' as const, avatar: 'RD' },
  { time: '14:30', patient: 'Lucía Moreno', treatment: 'Endodoncia #21', status: 'confirmada' as const, avatar: 'LM' },
  { time: '16:00', patient: 'Pedro Sánchez', treatment: 'Corona cerámica', status: 'programada' as const, avatar: 'PS' },
];

const weekData = [
  { day: 'Lun', citas: 8, atendidas: 7 },
  { day: 'Mar', citas: 10, atendidas: 9 },
  { day: 'Mié', citas: 6, atendidas: 6 },
  { day: 'Jue', citas: 9, atendidas: 8 },
  { day: 'Vie', citas: 11, atendidas: 10 },
  { day: 'Sáb', citas: 4, atendidas: 4 },
];

const revenueData = [
  { month: 'Ene', monto: 42000 },
  { month: 'Feb', monto: 38000 },
  { month: 'Mar', monto: 51000 },
  { month: 'Abr', monto: 47000 },
  { month: 'May', monto: 55000 },
  { month: 'Jun', monto: 49000 },
];

const kpis = [
  { label: 'Citas hoy', value: '6', sub: '4 confirmadas', icon: Calendar, color: '#0BC5DF', bg: '#E6F8FB' },
  { label: 'Pacientes activos', value: '248', sub: '+3 este mes', icon: Users, color: '#1D9E75', bg: '#ECFDF5' },
  { label: 'Ingresos del mes', value: '$49,200', sub: '+12% vs anterior', icon: TrendingUp, color: '#EF9F27', bg: '#FFFBEB' },
  { label: 'Pendientes hoy', value: '2', sub: 'Requieren atención', icon: AlertCircle, color: '#E24B4A', bg: '#FEF2F2' },
];

function BarChartSVG({ data }: { data: typeof weekData }) {
  const W = 420, H = 160, padL = 28, padB = 24, padR = 12, padT = 8;
  const maxVal = Math.max(...data.map((d) => d.citas));
  const chartW = W - padL - padR;
  const chartH = H - padB - padT;
  const groupW = chartW / data.length;
  const barW = Math.floor(groupW * 0.28);
  const gap = 3;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 160 }}>
      {/* Y gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padT + chartH * (1 - t);
        return (
          <g key={`grid-${t}`}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#F1F3F4" strokeWidth={1} />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#888F94">
              {Math.round(maxVal * t)}
            </text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const cx = padL + groupW * i + groupW / 2;
        const hCitas = (d.citas / maxVal) * chartH;
        const hAten = (d.atendidas / maxVal) * chartH;
        return (
          <g key={`bar-group-${i}`}>
            <rect x={cx - barW - gap / 2} y={padT + chartH - hCitas} width={barW} height={hCitas} fill="#B2EDF5" rx={3} />
            <rect x={cx + gap / 2} y={padT + chartH - hAten} width={barW} height={hAten} fill="#0BC5DF" rx={3} />
            <text x={cx} y={H - 6} textAnchor="middle" fontSize={10} fill="#888F94">{d.day}</text>
          </g>
        );
      })}
      {/* Legend */}
      <rect x={padL} y={H - 8} width={8} height={8} fill="#B2EDF5" rx={2} />
      <text x={padL + 11} y={H - 1} fontSize={9} fill="#888F94">Programadas</text>
      <rect x={padL + 80} y={H - 8} width={8} height={8} fill="#0BC5DF" rx={2} />
      <text x={padL + 91} y={H - 1} fontSize={9} fill="#888F94">Atendidas</text>
    </svg>
  );
}

function LineChartSVG({ data }: { data: typeof revenueData }) {
  const W = 420, H = 160, padL = 40, padB = 24, padR = 12, padT = 8;
  const chartW = W - padL - padR;
  const chartH = H - padB - padT;
  const minVal = Math.min(...data.map((d) => d.monto));
  const maxVal = Math.max(...data.map((d) => d.monto));
  const range = maxVal - minVal || 1;

  const px = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const py = (v: number) => padT + chartH - ((v - minVal) / range) * chartH;

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.monto)}`).join(' ');
  const areaD = `${pathD} L${px(data.length - 1)},${padT + chartH} L${px(0)},${padT + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 160 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0BC5DF" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#0BC5DF" stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Gridlines */}
      {[0, 0.5, 1].map((t) => {
        const y = padT + chartH * (1 - t);
        const val = minVal + range * t;
        return (
          <g key={`lg-${t}`}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#F1F3F4" strokeWidth={1} />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#888F94">
              ${Math.round(val / 1000)}k
            </text>
          </g>
        );
      })}
      {/* Area fill */}
      <path d={areaD} fill="url(#lineGrad)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#0BC5DF" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots + labels */}
      {data.map((d, i) => (
        <g key={`dot-${i}`}>
          <circle cx={px(i)} cy={py(d.monto)} r={4} fill="#0BC5DF" />
          <text x={px(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="#888F94">{d.month}</text>
        </g>
      ))}
    </svg>
  );
}

export function Dashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#888F94', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{kpi.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: '#203F49', lineHeight: 1 }}>{kpi.value}</div>
                  <div style={{ fontSize: 12, color: '#888F94', marginTop: 4 }}>{kpi.sub}</div>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: kpi.color }} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49', marginBottom: 4 }}>Citas — Esta semana</div>
          <div style={{ fontSize: 11, color: '#888F94', marginBottom: 16 }}>Programadas vs. atendidas</div>
          <BarChartSVG data={weekData} />
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49', marginBottom: 4 }}>Ingresos — 2026</div>
          <div style={{ fontSize: 11, color: '#888F94', marginBottom: 16 }}>Facturación mensual (MXN)</div>
          <LineChartSVG data={revenueData} />
        </Card>
      </div>

      {/* Today's appointments */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#203F49' }}>Agenda de hoy</div>
            <div style={{ fontSize: 11, color: '#888F94', marginTop: 2 }}>Miércoles 3 de junio, 2026</div>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#0BC5DF', fontWeight: 500,
          }}>
            Ver agenda completa <ChevronRight size={13} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '70px 1fr 200px 140px',
            padding: '8px 12px', background: '#F8F9FA',
            borderRadius: '8px 8px 0 0', borderBottom: '0.5px solid #D3D7DA',
          }}>
            {['Hora', 'Paciente', 'Tratamiento', 'Estado'].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#888F94', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {appointmentsToday.map((appt, i) => (
            <div key={appt.time} style={{
              display: 'grid', gridTemplateColumns: '70px 1fr 200px 140px',
              padding: '12px 12px', alignItems: 'center',
              background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FA',
              borderBottom: i < appointmentsToday.length - 1 ? '0.5px solid #F1F3F4' : 'none',
              cursor: 'pointer', transition: 'background 0.1s',
              borderRadius: i === appointmentsToday.length - 1 ? '0 0 8px 8px' : 0,
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#E6F8FB')}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? '#FFFFFF' : '#F8F9FA')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500, color: '#203F49' }}>
                <Clock size={12} style={{ color: '#0BC5DF' }} />
                {appt.time}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={appt.avatar} size={30} color={appt.status === 'atendida' ? '#888F94' : '#0BC5DF'} />
                <span style={{ fontSize: 13, color: '#203F49' }}>{appt.patient}</span>
              </div>
              <span style={{ fontSize: 13, color: '#5F656A' }}>{appt.treatment}</span>
              <StatusBadge status={appt.status} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
