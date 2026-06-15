import { Patient } from '../../patients/types';
import { User } from '../../auth/types';

export interface ConsultaTratamiento {
  id_consulta_tratamiento: number;
  id_tratamiento: number;
  id_consulta: number;
  descuento: number;
  precio: string | number; // Decimal in DB, comes as string/number depending on Prisma/Axios
  tratamiento?: {
    nombre: string;
    precio?: string | number;
  };
}

export interface PagoPaciente {
  id_pago: number;
  id_consulta: number;
  fecha: string;
  abono: number | string;
  metodo_pago: string;
  observacion?: string;
}

export interface PagoConsulta {
  id: number;
  consultaId: number;
  fecha: string;
  monto: number | string;
  metodoPago: string;
  observacion?: string;
  abonos?: { montoAbonado: number | string }[];
}

export interface TratamientoPaciente {
  id: number;
  nombre: string;
  costoTotal: number | string;
  estado: string;
  abonos?: { montoAbonado: number | string }[];
}

export interface Consultation {
  id_consulta: number;
  id_cita?: number;
  id_persona: number;
  id_usuario: number; // Doctor's User ID
  fecha_inicio: string;
  fecha_fin?: string;
  diagnostico?: string;
  tratamiento?: string;
  motivo?: string;
  notas?: string;
  firma_paciente?: string;
  firma_doctor_snapshot?: string;
  consentimiento: boolean;
  
  persona?: Patient;
  doctor?: User;
  tratamientos?: ConsultaTratamiento[];
  pagos?: PagoPaciente[];
  pagosConsulta?: PagoConsulta[];
  tratamientoPacienteId?: number | null;
  tratamientoPaciente?: TratamientoPaciente;
}

export interface CreateConsultationInput {
  id_cita?: number;
  id_persona: number;
  id_usuario: number;
  fecha_inicio: string;
  motivo?: string;
  notas?: string;
}
