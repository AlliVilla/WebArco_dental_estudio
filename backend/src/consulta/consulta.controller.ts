import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
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
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConsultaService } from './consulta.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { UpdateConsultaDto } from './dto/update-consulta.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Consultas')
@Controller('consulta')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class ConsultaController {
  constructor(private readonly consultaService: ConsultaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva consulta', description: 'Registra una nueva consulta odontológica asociada a un paciente y un doctor.' })
  @ApiCreatedResponse({ description: 'Consulta creada exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o persona/usuario no existente' })
  async create(@Body() createConsultaDto: CreateConsultaDto) {
    return this.consultaService.create(createConsultaDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar consultas', description: 'Obtiene un listado paginado de consultas. Permite filtrar por paciente, doctor y estado.' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página (por defecto 1)', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página (por defecto 10)', example: '10' })
  @ApiQuery({ name: 'id_persona', required: false, description: 'Filtrar por ID del paciente', example: '1' })
  @ApiQuery({ name: 'id_usuario', required: false, description: 'Filtrar por ID del doctor', example: '1' })
  @ApiQuery({ name: 'estado', required: false, description: 'Filtrar por estado (agendada, completada, cancelada, no_asistio)', example: 'agendada' })
  @ApiOkResponse({ description: 'Listado de consultas con paginación' })
  @ApiBadRequestResponse({ description: 'Parámetros de paginación inválidos o estado inválido' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('id_persona') id_persona?: string,
    @Query('id_usuario') id_usuario?: string,
    @Query('estado') estado?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('page y limit deben ser mayores a 0');
    }

    const filters: { id_persona?: number; id_usuario?: number; estado?: string } = {};
    if (id_persona) filters.id_persona = parseInt(id_persona, 10);
    if (id_usuario) filters.id_usuario = parseInt(id_usuario, 10);
    if (estado) filters.estado = estado;

    return this.consultaService.findAll(pageNum, limitNum, filters);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener detalle de una consulta', description: 'Devuelve el detalle completo de una consulta incluyendo paciente, doctor, antecedentes, odontogramas y pagos.' })
  @ApiParam({ name: 'id', description: 'ID de la consulta', example: 1 })
  @ApiOkResponse({ description: 'Detalle de la consulta' })
  @ApiNotFoundResponse({ description: 'Consulta no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consultaService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una consulta', description: 'Actualiza parcial o totalmente los datos de una consulta (diagnóstico, tratamiento, estado, etc.).' })
  @ApiParam({ name: 'id', description: 'ID de la consulta', example: 1 })
  @ApiOkResponse({ description: 'Consulta actualizada exitosamente' })
  @ApiNotFoundResponse({ description: 'Consulta no encontrada' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o persona/usuario no existente' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConsultaDto: UpdateConsultaDto,
  ) {
    return this.consultaService.update(id, updateConsultaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar/cancelar una consulta', description: 'Elimina la consulta si no tiene registros asociados. Si tiene antecedentes, odontogramas o pagos, la marca como cancelada.' })
  @ApiParam({ name: 'id', description: 'ID de la consulta', example: 1 })
  @ApiOkResponse({ description: 'Consulta eliminada o cancelada exitosamente' })
  @ApiNotFoundResponse({ description: 'Consulta no encontrada' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.consultaService.remove(id);
  }
}
