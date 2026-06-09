import { Controller, Get, Post, Query, Param, Patch, Body, ParseIntPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiConflictResponse, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ConsentimientoService } from './consentimiento.service';
import { QueryConsentimientoDto } from './dto/query-consentimiento.dto';
import { CreateConsentimientoDto } from './dto/create-consentimiento.dto';
import { UpdateSignaturesDto } from './dto/update-signatures.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Consentimientos')
@Controller('consents')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class ConsentimientoController {
  constructor(private readonly consentimientoService: ConsentimientoService) {}

  @Privileges(22)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un consentimiento', description: 'Crea una nueva consulta configurada como consentimiento y permite asociar las firmas iniciales.' })
  @ApiCreatedResponse({ description: 'Consentimiento registrado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos proporcionados' })
  create(@Body() createConsentimientoDto: CreateConsentimientoDto) {
    return this.consentimientoService.create(createConsentimientoDto);
  }

  @Privileges(25)
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener estadísticas globales', description: 'Devuelve totales de consentimientos completos, pendientes e incompletos, y si hay alerta global.' })
  @ApiOkResponse({ description: 'Estadísticas obtenidas exitosamente' })
  getStats() {
    return this.consentimientoService.getStats();
  }

  @Privileges(25)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar consentimientos', description: 'Obtiene una lista paginada y filtrada de consentimientos con su estado de firma.' })
  @ApiOkResponse({ description: 'Listado de consentimientos devuelto exitosamente' })
  findAll(@Query() query: QueryConsentimientoDto) {
    return this.consentimientoService.findAll(query);
  }

  @Privileges(25)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener detalle de consentimiento', description: 'Obtiene el detalle completo de un consentimiento específico por ID.' })
  @ApiParam({ name: 'id', description: 'ID del consentimiento (consulta)', example: 1 })
  @ApiOkResponse({ description: 'Detalle de consentimiento devuelto exitosamente' })
  @ApiNotFoundResponse({ description: 'Consentimiento no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consentimientoService.findOne(id);
  }

  @Privileges(25)
  @Get(':id/print')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener datos para impresión', description: 'Retorna los datos formateados listos para impresión o generación de PDF.' })
  @ApiParam({ name: 'id', description: 'ID del consentimiento (consulta)', example: 1 })
  @ApiOkResponse({ description: 'Datos para impresión devueltos exitosamente' })
  @ApiNotFoundResponse({ description: 'Consentimiento no encontrado' })
  imprimir(@Param('id', ParseIntPipe) id: number) {
    return this.consentimientoService.imprimir(id);
  }

  @Privileges(23, 24)
  @Patch(':id/signatures')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar firmas faltantes', description: 'Registra la firma del paciente o del doctor de manera independiente. No permite sobreescribir una firma ya existente.' })
  @ApiParam({ name: 'id', description: 'ID del consentimiento (consulta)', example: 1 })
  @ApiOkResponse({ description: 'Firmas actualizadas y detalle del consentimiento devuelto exitosamente' })
  @ApiNotFoundResponse({ description: 'Consentimiento no encontrado' })
  @ApiBadRequestResponse({ description: 'Cuerpo vacío: debe enviar al menos una firma' })
  @ApiConflictResponse({ description: 'La firma ya existe y no puede sobreescribirse' })
  updateSignatures(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSignaturesDto: UpdateSignaturesDto,
  ) {
    return this.consentimientoService.updateSignatures(id, updateSignaturesDto);
  }
}
