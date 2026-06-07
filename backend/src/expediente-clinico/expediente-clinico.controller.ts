import {
  Controller,
  Get,
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
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ExpedienteClinicoService } from './expediente-clinico.service';

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
}
