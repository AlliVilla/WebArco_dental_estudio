import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type EstadoCitaDashboard =
  | 'programada'
  | 'confirmada'
  | 'cancelada'
  | 'no_asistio'
  | 'atendida'
  | 'ausente'
  | 'reprogramada';

interface DateRange {
  start: Date;
  end: Date;
}

const APPOINTMENT_PENDING_STATUSES: EstadoCitaDashboard[] = [
  'programada',
  'confirmada',
  'reprogramada',
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getResumenGeneral() {
    const today = this.getDayRange(new Date());
    const month = this.getMonthRange(new Date());
    const week = this.getCurrentWeekRange(new Date());

    const [citasHoy, citasConfirmadasHoy, pendientesHoy, pacientesActivos] =
      await Promise.all([
        this.prisma.cita.count({
          where: { fecha_inicio: { gte: today.start, lte: today.end } },
        }),
        this.prisma.cita.count({
          where: {
            fecha_inicio: { gte: today.start, lte: today.end },
            estado: 'confirmada',
          },
        }),
        this.prisma.cita.count({
          where: {
            fecha_inicio: { gte: today.start, lte: today.end },
            estado: { in: APPOINTMENT_PENDING_STATUSES },
          },
        }),
        this.prisma.persona.count({
          where: { usuarios: { none: {} } },
        }),
      ]);

    const [agendaHoy, citasSemana, consultasMes] = await Promise.all([
      this.getAgendaHoy(today),
      this.getCitasSemana(week),
      this.prisma.consulta.count({
        where: { fecha_inicio: { gte: month.start, lte: month.end } },
      }),
    ]);

    return {
      fecha: new Date().toISOString(),
      kpis: {
        citasHoy: {
          value: citasHoy,
          sub: `${citasConfirmadasHoy} confirmadas`,
        },
        pacientesActivos: {
          value: pacientesActivos,
          sub: 'Registrados como pacientes',
        },
        consultasMes: {
          value: consultasMes,
          sub: 'Consultas registradas este mes',
        },
        pendientesHoy: {
          value: pendientesHoy,
          sub: pendientesHoy === 1 ? 'Requiere atención' : 'Requieren atención',
        },
      },
      citasSemana,
      agendaHoy,
    };
  }

  async getResumenFinanciero() {
    const now = new Date();
    const month = this.getMonthRange(now);
    const previousMonth = this.getPreviousMonthRange(now);
    const year = now.getFullYear();

    const [ingresosMes, ingresosMesAnterior, ingresosPorMes] = await Promise.all([
      this.getIngresosRango(month),
      this.getIngresosRango(previousMonth),
      this.getIngresosPorMes(year),
    ]);

    return {
      fecha: new Date().toISOString(),
      kpis: {
        ingresosMes: {
          value: ingresosMes,
          sub: this.formatPercentComparison(ingresosMes, ingresosMesAnterior),
        },
      },
      ingresosPorMes,
    };
  }

  private async getAgendaHoy(range: DateRange) {
    const citas = await this.prisma.cita.findMany({
      where: { fecha_inicio: { gte: range.start, lte: range.end } },
      orderBy: { fecha_inicio: 'asc' },
      take: 10,
      include: {
        persona: true,
        consulta: true,
      },
    });

    return citas.map((cita) => {
      const nombrePaciente = this.buildPersonName(cita.persona);
      return {
        id: cita.id_cita,
        time: this.formatTime(cita.fecha_inicio),
        patient: nombrePaciente,
        treatment:
          cita.tipo_cita || cita.motivo || cita.consulta?.tratamiento || 'Consulta dental',
        status: this.normalizeStatus(cita.estado as EstadoCitaDashboard),
        avatar: this.buildInitials(nombrePaciente),
      };
    });
  }

  private async getCitasSemana(range: DateRange) {
    const citas = await this.prisma.cita.findMany({
      where: { fecha_inicio: { gte: range.start, lte: range.end } },
      select: { fecha_inicio: true, estado: true },
    });

    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const weekData = labels.map((day) => ({ day, citas: 0, atendidas: 0 }));

    for (const cita of citas) {
      const dayIndex = this.getMondayBasedDayIndex(cita.fecha_inicio);
      weekData[dayIndex].citas += 1;
      if (cita.estado === 'atendida') {
        weekData[dayIndex].atendidas += 1;
      }
    }

    return weekData;
  }

  private async getIngresosPorMes(year: number) {
    const monthLabels = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    const ingresosPorMes: { month: string; monto: number }[] = [];
    for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
      const range = this.getMonthRange(new Date(year, monthIndex, 1));
      ingresosPorMes.push({
        month: monthLabels[monthIndex],
        monto: await this.getIngresosRango(range),
      });
    }

    return ingresosPorMes;
  }

  private async getIngresosRango(range: DateRange): Promise<number> {
    const [pagosPaciente, pagosConsulta] = await Promise.all([
      this.prisma.pagoPaciente.aggregate({
        where: { fecha: { gte: range.start, lte: range.end } },
        _sum: { abono: true },
      }),
      this.prisma.pagoConsulta.aggregate({
        where: { fecha: { gte: range.start, lte: range.end } },
        _sum: { monto: true },
      }),
    ]);

    return (
      Number(pagosPaciente._sum.abono ?? 0) + Number(pagosConsulta._sum.monto ?? 0)
    );
  }

  private getDayRange(date: Date): DateRange {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private getMonthRange(date: Date): DateRange {
    const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  private getPreviousMonthRange(date: Date): DateRange {
    return this.getMonthRange(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  }

  private getCurrentWeekRange(date: Date): DateRange {
    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  private getMondayBasedDayIndex(date: Date): number {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }

  private buildPersonName(persona: {
    primer_nombre: string;
    segundo_nombre?: string | null;
    primer_apellido: string;
    segundo_apellido?: string | null;
  }): string {
    return [
      persona.primer_nombre,
      persona.segundo_nombre,
      persona.primer_apellido,
      persona.segundo_apellido,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private buildInitials(fullName: string): string {
    const words = fullName.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'P';
    const first = words[0]?.charAt(0) ?? 'P';
    const second = words.length > 1 ? words[words.length - 1]?.charAt(0) : '';
    return `${first}${second}`.toUpperCase();
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private normalizeStatus(status: EstadoCitaDashboard) {
    return status === 'no_asistio' ? 'ausente' : status;
  }

  private formatPercentComparison(current: number, previous: number): string {
    if (previous === 0) {
      return current > 0 ? 'Sin ingresos el mes anterior' : 'Sin variación vs anterior';
    }

    const diff = ((current - previous) / previous) * 100;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}% vs anterior`;
  }
}
