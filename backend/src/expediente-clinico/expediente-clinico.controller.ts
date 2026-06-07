import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ExpedienteClinicoService } from './expediente-clinico.service';
import { RegistrarVisitaDto } from './dto/registrar-visita.dto';

@ApiTags('Expediente Clínico')
@Controller('clinical-history')
export class ExpedienteClinicoController {
  constructor(
    private readonly expedienteClinicoService: ExpedienteClinicoService,
  ) {}

  @Get(':patientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener expediente clínico completo',
    description:
      'Retorna los datos personales del paciente junto con todas sus consultas ' +
      'ordenadas por fecha descendente. Incluye un resumen con total de consultas ' +
      'y alerta si hay firmas pendientes (paciente o doctor).',
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID de la persona/paciente',
    example: 1,
  })
  @ApiOkResponse({
    description:
      'Expediente clínico completo con datos del paciente y lista de consultas',
  })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  async obtenerExpediente(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.expedienteClinicoService.obtenerExpediente(patientId);
  }

  @Get(':patientId/pending-signatures')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar consultas con firmas pendientes',
    description:
      'Retorna únicamente las consultas del paciente donde falta la firma digital ' +
      'del paciente, la del doctor, o ambas. Incluye campo "pendientes" indicando ' +
      'quién(es) aún no han firmado.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID de la persona/paciente',
    example: 1,
  })
  @ApiOkResponse({
    description:
      'Lista de consultas con firmas incompletas y detalle de quién falta',
  })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  async obtenerFirmasPendientes(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.expedienteClinicoService.obtenerFirmasPendientes(patientId);
  }

  @Post(':patientId/visits')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nueva visita/consulta',
    description:
      'Registra una nueva visita en el expediente clínico del paciente. ' +
      'Acepta diagnóstico, tratamiento realizado, notas adicionales y firmas ' +
      'digitales en base64 del paciente y del doctor. ' +
      'Si alguna firma está pendiente, la respuesta incluye una alerta con detalle.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID de la persona/paciente',
    example: 1,
  })
  @ApiCreatedResponse({
    description: 'Visita registrada exitosamente con estado de firmas',
  })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o doctor inexistente' })
  async registrarVisita(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() registrarVisitaDto: RegistrarVisitaDto,
  ) {
    return this.expedienteClinicoService.registrarVisita(patientId, registrarVisitaDto);
  }

  @Get(':patientId/visits/:visitId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener detalle de una visita',
    description:
      'Retorna el detalle completo de una visita/consulta específica del paciente. ' +
      'Incluye diagnóstico, tratamiento, antecedentes, odontograma, pagos y ' +
      'estado de firmas (quién ha firmado y quién no).',
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID de la persona/paciente',
    example: 1,
  })
  @ApiParam({
    name: 'visitId',
    description: 'ID de la visita/consulta',
    example: 1,
  })
  @ApiOkResponse({ description: 'Detalle de la visita con estado de firmas' })
  @ApiNotFoundResponse({
    description: 'Paciente no encontrado o visita no pertenece al paciente',
  })
  async obtenerDetalleVisita(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('visitId', ParseIntPipe) visitId: number,
  ) {
    return this.expedienteClinicoService.obtenerDetalleVisita(patientId, visitId);
  }
}
