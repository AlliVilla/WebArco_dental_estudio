import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { OdontogramaService } from './odontograma.service';
import { UpdateToothStateDto } from './dto/update-tooth-state.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import type { Request } from 'express';

type AuthRequest = Request & {
  user: {
    id_usuario: number;
    username: string;
    id_rol: number;
  };
};

@ApiTags('Odontogramas')
@Controller('odontograma')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class OdontogramaController {
  constructor(private readonly odontogramaService: OdontogramaService) {}

  @Privileges(3)
  @Get(':patientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estado actual del odontograma',
    description:
      'Retorna el estado clínico actual de cada diente del paciente. ' +
      'El estado actual se calcula buscando el registro más reciente por diente ' +
      'en todas las consultas del paciente. Si un diente no tiene registro previo, ' +
      'retorna estado "Sano" por defecto. Incluye indicador de registros previos.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID del paciente',
    example: 1,
  })
  @ApiOkResponse({ description: 'Estado actual del odontograma' })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  async getPatientOdontogram(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.odontogramaService.getPatientOdontogram(patientId);
  }

  @Privileges(4)
  @Patch(':patientId/tooth/:toothNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar estado de un diente',
    description:
      'Actualiza el estado clínico de un diente en la consulta activa del paciente. ' +
      'Valida que el estado sea uno de los 10 estados válidos: Sano, Caries, ' +
      'Obturación, Extracción, Ausente, Endodoncia, Corona, Prótesis, Implante, Puente.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID del paciente',
    example: 1,
  })
  @ApiParam({
    name: 'toothNumber',
    description: 'Número del diente (FDI)', 
    example: 11,
  })
  @ApiOkResponse({ description: 'Estado del diente actualizado exitosamente' })
  @ApiNotFoundResponse({ description: 'Paciente o diente no encontrado' })
  @ApiBadRequestResponse({ description: 'No hay consulta activa para el paciente' })
  @ApiUnprocessableEntityResponse({ description: 'Estado clínico inválido' })
  async updateToothState(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('toothNumber', ParseIntPipe) toothNumber: number,
    @Body() updateToothStateDto: UpdateToothStateDto,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user.id_usuario;
    return this.odontogramaService.updateToothState(
      patientId,
      toothNumber,
      updateToothStateDto,
      userId,
    );
  }

  @Privileges(5)
  @Get(':patientId/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener historial completo del odontograma',
    description:
      'Retorna el historial completo de cambios de todos los dientes del paciente, ' +
      'ordenado de forma descendente por fecha de consulta.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID del paciente',
    example: 1,
  })
  @ApiOkResponse({ description: 'Historial completo del odontograma' })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  async getPatientHistory(
    @Param('patientId', ParseIntPipe) patientId: number,
  ) {
    return this.odontogramaService.getPatientHistory(patientId);
  }

  @Privileges(5)
  @Get(':patientId/tooth/:toothNumber/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener historial de un diente específico',
    description:
      'Retorna el historial de cambios de un diente específico del paciente, ' +
      'ordenado de forma descendente por fecha de consulta.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID del paciente',
    example: 1,
  })
  @ApiParam({
    name: 'toothNumber',
    description: 'Número del diente (FDI)',
    example: 11,
  })
  @ApiOkResponse({ description: 'Historial del diente específico' })
  @ApiNotFoundResponse({ description: 'Paciente o diente no encontrado' })
  async getToothHistory(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('toothNumber', ParseIntPipe) toothNumber: number,
  ) {
    return this.odontogramaService.getToothHistory(patientId, toothNumber);
  }
}
