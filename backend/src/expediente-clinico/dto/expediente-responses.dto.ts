import { ApiProperty } from '@nestjs/swagger';

export class PacienteResponseDto {
  @ApiProperty({ example: 1 })
  id_persona: number;

  @ApiProperty({ example: '0501199512345' })
  numero_identidad: string;

  @ApiProperty({ example: 'Juan' })
  primer_nombre: string;

  @ApiProperty({ example: 'Carlos' })
  segundo_nombre: string;

  @ApiProperty({ example: 'Pérez' })
  primer_apellido: string;

  @ApiProperty({ example: 'Gómez' })
  segundo_apellido: string;

  @ApiProperty({ example: '1995-05-15T00:00:00.000Z' })
  fecha_nacimiento: string;

  @ApiProperty({ example: '9988-7766' })
  telefono: string;

  @ApiProperty({ example: 'juan.perez@email.com' })
  correo_electronico: string;

  @ApiProperty({ example: 'M' })
  sexo: string;

  @ApiProperty({ example: 'Colonia Universidad' })
  direccion_linea: string;

  @ApiProperty({
    example: { id_departamento: 5, nombre: 'Cortés' },
  })
  departamento: { id_departamento: number; nombre: string };

  @ApiProperty({
    example: { id_municipio: 45, nombre: 'San Pedro Sula' },
  })
  municipio: { id_municipio: number; nombre: string };
}

export class DoctorResponseDto {
  @ApiProperty({ example: 2 })
  id_usuario: number;

  @ApiProperty({ example: 'dr_gomez' })
  username: string;

  @ApiProperty({
    example: 'data:image/png;base64,iVBORw0KGgo...',
    nullable: true,
  })
  firma: string | null;

  @ApiProperty({
    example: { primer_nombre: 'Laura', primer_apellido: 'Gómez' },
  })
  persona: { primer_nombre: string; primer_apellido: string };
}

export class ConsultaRespuestaResponseDto {
  @ApiProperty({ example: 1 })
  id_respuesta: number;

  @ApiProperty({ example: 1 })
  id_consulta: number;

  @ApiProperty({ example: 3 })
  id_pregunta: number;

  @ApiProperty({ example: true })
  respuesta_boolean: boolean;

  @ApiProperty({ example: 'Alergia a la penicilina', nullable: true })
  explanation: string | null;

  @ApiProperty({
    example: { id_pregunta: 3, pregunta: '¿Sufre de alergias?', orden_num: 3 },
  })
  pregunta: { id_pregunta: number; pregunta: string; orden_num: number };
}

export class OdontogramaResponseDto {
  @ApiProperty({ example: 1 })
  id_odontograma: number;

  @ApiProperty({ example: 1 })
  id_consulta: number;

  @ApiProperty({ example: 18 })
  id_diente: number;

  @ApiProperty({ example: 'caries' })
  estado: string;

  @ApiProperty({ example: 'Cavidad profunda en distal', nullable: true })
  observacion: string | null;

  @ApiProperty({
    example: { numero_diente: 18, nombre: 'Tercer Molar Superior Derecho' },
  })
  diente: { numero_diente: number; nombre: string };
}

export class EstadoFirmasDto {
  @ApiProperty({ example: true })
  firma_paciente_presente: boolean;

  @ApiProperty({ example: false })
  firma_doctor_presente: boolean;

  @ApiProperty({ example: false })
  firmas_completas: boolean;

  @ApiProperty({ example: ['doctor'], type: [String] })
  pendientes: string[];
}

export class ConsultaResponseDto {
  @ApiProperty({ example: 1 })
  id_consulta: number;

  @ApiProperty({ example: 1 })
  id_persona: number;

  @ApiProperty({ example: 2 })
  id_usuario: number;

  @ApiProperty({ example: '2026-06-07T10:00:00.000Z' })
  fecha_inicio: string;

  @ApiProperty({ example: '2026-06-07T10:45:00.000Z', nullable: true })
  fecha_fin: string | null;

  @ApiProperty({ example: 'Caries interproximal en molar inferior derecho' })
  diagnostico: string;

  @ApiProperty({ example: 'Resina compuesta en pieza 46' })
  tratamiento: string;

  @ApiProperty({ example: 'data:image/png;base64,iVBORw0KGgo...', nullable: true })
  firma_paciente: string | null;

  @ApiProperty({ example: true })
  consentimiento: boolean;

  @ApiProperty({ example: 'completada' })
  estado: string;

  @ApiProperty({ example: false })
  recordatorio_enviado: boolean;

  @ApiProperty({ type: () => DoctorResponseDto })
  doctor: DoctorResponseDto;

  @ApiProperty({ type: [ConsultaRespuestaResponseDto] })
  respuestas: ConsultaRespuestaResponseDto[];

  @ApiProperty({ type: [OdontogramaResponseDto] })
  odontogramas: OdontogramaResponseDto[];

  @ApiProperty({ type: () => EstadoFirmasDto })
  estado_firmas: EstadoFirmasDto;
}

export class ResumenExpedienteDto {
  @ApiProperty({ example: 5 })
  total_consultas: number;

  @ApiProperty({ example: 2 })
  firmas_pendientes: number;

  @ApiProperty({ example: 2 })
  pendingSignaturesCount: number;

  @ApiProperty({ example: true })
  alerta_firmas: boolean;
}

export class ExpedienteResponseDto {
  @ApiProperty({ type: () => PacienteResponseDto })
  paciente: PacienteResponseDto;

  @ApiProperty({ type: () => ResumenExpedienteDto })
  resumen: ResumenExpedienteDto;

  @ApiProperty({ example: 2 })
  pendingSignaturesCount: number;

  @ApiProperty({ type: [ConsultaResponseDto] })
  consultas: ConsultaResponseDto[];
}

export class FirmasPendientesResponseDto {
  @ApiProperty({ example: 1 })
  id_paciente: number;

  @ApiProperty({ example: 2 })
  total_pendientes: number;

  @ApiProperty({ example: true })
  alerta: boolean;

  @ApiProperty({ type: [ConsultaResponseDto] })
  consultas: ConsultaResponseDto[];
}

export class AlertaFirmaDetalleDto {
  @ApiProperty({ example: true })
  activa: boolean;

  @ApiProperty({ example: ['paciente', 'doctor'], type: [String] })
  pendientes: string[];
}

export class RegistrarConsultaResponseDto {
  @ApiProperty({ example: 'Consulta registrada exitosamente' })
  message: string;

  @ApiProperty({ type: () => AlertaFirmaDetalleDto })
  alerta_firmas: AlertaFirmaDetalleDto;

  @ApiProperty({ type: () => ConsultaResponseDto })
  consulta: ConsultaResponseDto;
}

export class ActualizarFirmasResponseDto {
  @ApiProperty({ example: 'Firmas actualizadas exitosamente' })
  message: string;

  @ApiProperty({ type: () => AlertaFirmaDetalleDto })
  alerta_firmas: AlertaFirmaDetalleDto;

  @ApiProperty({ type: () => ConsultaResponseDto })
  consulta: ConsultaResponseDto;
}
