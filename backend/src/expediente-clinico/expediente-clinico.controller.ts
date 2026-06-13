import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ExpedienteClinicoService } from './expediente-clinico.service';
import { RegistrarConsultaDto } from './dto/registrar-consulta.dto';
import { ActualizarFirmasDto } from './dto/actualizar-firmas.dto';
import {
  ExpedienteResponseDto,
  FirmasPendientesResponseDto,
  RegistrarConsultaResponseDto,
  ConsultaResponseDto,
  ActualizarFirmasResponseDto,
} from './dto/expediente-responses.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Expediente Clínico')
@Controller('expediente-clinico')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class ExpedienteClinicoController {
  constructor(
    private readonly expedienteClinicoService: ExpedienteClinicoService,
  ) {}

  @Privileges(20)
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
    type: ExpedienteResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  async obtenerExpediente(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.expedienteClinicoService.obtenerExpediente(patientId);
  }

  @Privileges(20)
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
    type: FirmasPendientesResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  async obtenerFirmasPendientes(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.expedienteClinicoService.obtenerFirmasPendientes(patientId);
  }

  @Privileges(21)
  @Post(':patientId/visits')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nueva consulta',
    description:
      'Registra una nueva consulta en el expediente clínico del paciente. ' +
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
    description: 'Consulta registrada exitosamente con estado de firmas',
    type: RegistrarConsultaResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o doctor inexistente' })
  async registrarConsulta(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() registrarConsultaDto: RegistrarConsultaDto,
  ) {
    return this.expedienteClinicoService.registrarConsulta(patientId, registrarConsultaDto);
  }

  @Privileges(20)
  @Get(':patientId/visits/:visitId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener detalle de una consulta',
    description:
      'Retorna el detalle completo de una consulta específica del paciente. ' +
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
    description: 'ID de la consulta',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Detalle de la consulta con estado de firmas',
    type: ConsultaResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Paciente no encontrado o consulta no pertenece al paciente',
  })
  async obtenerDetalleConsulta(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('visitId', ParseIntPipe) visitId: number,
  ) {
    return this.expedienteClinicoService.obtenerDetalleConsulta(patientId, visitId);
  }

  @Privileges(21)
  @Patch(':patientId/visits/:visitId/signatures')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar firmas pendientes de una consulta',
    description:
      'Permite registrar la firma digital del paciente, la del doctor, o ambas ' +
      'en una consulta existente. No sobreescribe firmas ya guardadas. ' +
      'Si tras la actualización quedan firmas pendientes, la respuesta incluye ' +
      'una alerta indicando quién(es) aún no han firmado.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID de la persona/paciente',
    example: 1,
  })
  @ApiParam({
    name: 'visitId',
    description: 'ID de la consulta',
    example: 1,
  })
  @ApiOkResponse({
    description:
      'Firmas actualizadas exitosamente con estado de firmas resultante',
    type: ActualizarFirmasResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Paciente no encontrado o consulta no pertenece al paciente',
  })
  @ApiBadRequestResponse({
    description:
      'No se envió ninguna firma, firma ya existente, o datos inválidos',
  })
  async actualizarFirmas(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('visitId', ParseIntPipe) visitId: number,
    @Body() actualizarFirmasDto: ActualizarFirmasDto,
  ) {
    return this.expedienteClinicoService.actualizarFirmas(
      patientId,
      visitId,
      actualizarFirmasDto,
    );
  }
}
