import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CitaService } from './cita.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { QueryCalendarDto, QueryPatientHistoryDto } from './dto/query-citas.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import type { Request } from 'express';

@ApiTags('Citas (Appointments)')
@Controller('appointments')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class CitaController {
  constructor(private readonly citaService: CitaService) {}

  @Privileges(27)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva cita',
    description:
      'Registra una nueva cita en el calendario. Valida que el paciente y doctor existan, y que no haya conflicto de horario.',
  })
  @ApiCreatedResponse({ description: 'Cita creada exitosamente' })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o paciente/doctor no existente',
  })
  @ApiConflictResponse({
    description: 'Conflicto de horario con otra cita del doctor',
  })
  async create(@Body() createCitaDto: CreateCitaDto) {
    return this.citaService.create(createCitaDto);
  }

  @Privileges(26, 69)
  @Get('pending-count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Contar citas pendientes',
    description:
      'Obtiene el conteo de citas pendientes (programadas o confirmadas) para hoy y fechas futuras.',
  })
  @ApiOkResponse({ description: 'Conteo de citas pendientes' })
  async getPendingCount(@Req() req: Request) {
    const userPrivileges: number[] = (req.user as any).privilegios || [];
    const hasGlobal = userPrivileges.includes(69);
    const filterUserId = hasGlobal ? undefined : (req.user as any).id_usuario;

    return this.citaService.getPendingCount(filterUserId);
  }

  @Privileges(26, 69)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar citas por calendario',
    description:
      'Obtiene las citas en un rango de fechas para vista de día/semana. Opcionalmente filtra por doctor.',
  })
  @ApiQuery({
    name: 'start',
    required: false,
    description: 'Inicio del rango (YYYY-MM-DD o ISO 8601)',
    example: '2025-06-01',
  })
  @ApiQuery({
    name: 'end',
    required: false,
    description: 'Fin del rango (YYYY-MM-DD o ISO 8601)',
    example: '2025-06-07',
  })
  @ApiQuery({
    name: 'id_usuario',
    required: false,
    description: 'Filtrar por ID del doctor',
    example: '1',
  })
  @ApiOkResponse({ description: 'Listado de citas en el rango solicitado' })
  @ApiBadRequestResponse({ description: 'Parámetros de fecha inválidos' })
  async findByCalendar(@Query() query: QueryCalendarDto, @Req() req: Request) {
    if (!query.start || !query.end) {
      throw new BadRequestException(
        'Los parámetros start y end son obligatorios',
      );
    }

    const userPrivileges: number[] = (req.user as any).privilegios || [];
    const hasGlobal = userPrivileges.includes(69);
    
    // Si no tiene el privilegio global, sobrescribimos el filtro con su propio ID
    const filterUserId = hasGlobal ? query.id_usuario : (req.user as any).id_usuario;

    return this.citaService.findByCalendar(
      query.start,
      query.end,
      filterUserId,
    );
  }

  @Privileges(26, 69)
  @Get('patient/:patientId/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Historial de citas de un paciente',
    description:
      'Obtiene el historial completo de citas de un paciente, paginado y con filtros opcionales por estado y rango de fechas.',
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID del paciente',
    example: 1,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página',
    example: '1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Resultados por página',
    example: '10',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description:
      'Filtrar por estado (programada, confirmada, atendida, cancelada, ausente, reprogramada)',
    example: 'programada',
  })
  @ApiQuery({
    name: 'start',
    required: false,
    description: 'Inicio del rango de fechas',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'end',
    required: false,
    description: 'Fin del rango de fechas',
    example: '2025-12-31',
  })
  @ApiOkResponse({ description: 'Historial de citas del paciente con paginación' })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  @ApiBadRequestResponse({ description: 'Parámetros inválidos' })
  async getPatientHistory(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: QueryPatientHistoryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (page < 1 || limit < 1) {
      throw new BadRequestException('page y limit deben ser mayores a 0');
    }

    return this.citaService.getPatientHistory(patientId, page, limit, {
      estado: query.estado,
      start: query.start,
      end: query.end,
    });
  }

  @Privileges(26, 69)
  @Get(':id/status-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Historial de cambios de estado',
    description:
      'Obtiene el historial completo de cambios de estado de una cita, incluyendo quién realizó el cambio y cuándo.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la cita',
    example: 1,
  })
  @ApiOkResponse({ description: 'Historial de cambios de estado' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada' })
  async getStatusHistory(@Param('id', ParseIntPipe) id: number) {
    return this.citaService.getStatusHistory(id);
  }

  @Privileges(26, 69)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener detalle de una cita',
    description:
      'Devuelve el detalle completo de una cita incluyendo paciente, doctor, antecedentes, odontogramas y pagos.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la cita',
    example: 1,
  })
  @ApiOkResponse({ description: 'Detalle de la cita' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.citaService.findOne(id);
  }

  @Privileges(27)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar una cita',
    description:
      'Actualiza los datos de una cita existente. Si se cambia la fecha/hora o el doctor, revalida conflictos de horario.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la cita',
    example: 1,
  })
  @ApiOkResponse({ description: 'Cita actualizada exitosamente' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada' })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o paciente/doctor no existente',
  })
  @ApiConflictResponse({
    description: 'Conflicto de horario con otra cita del doctor',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCitaDto: UpdateCitaDto,
  ) {
    return this.citaService.update(id, updateCitaDto);
  }

  @Privileges(27)
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar estado de una cita',
    description:
      'Cambia el estado de una cita y registra automáticamente el cambio en el historial con quién, cuándo, estado anterior y nuevo.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la cita',
    example: 1,
  })
  @ApiOkResponse({ description: 'Estado actualizado exitosamente' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada' })
  @ApiBadRequestResponse({
    description: 'Estado inválido o la cita ya está en ese estado',
  })
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() changeStatusDto: ChangeStatusDto,
  ) {
    return this.citaService.changeStatus(id, changeStatusDto);
  }

  @Privileges(27)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar una cita',
    description:
      'Elimina definitivamente una cita. Si tiene registros asociados (antecedentes, odontogramas o pagos), devuelve error.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la cita',
    example: 1,
  })
  @ApiNoContentResponse({ description: 'Cita eliminada exitosamente (sin contenido)' })
  @ApiNotFoundResponse({ description: 'Cita no encontrada' })
  @ApiConflictResponse({
    description: 'Cita con registros asociados no puede ser eliminada',
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.citaService.remove(id);
  }
}
