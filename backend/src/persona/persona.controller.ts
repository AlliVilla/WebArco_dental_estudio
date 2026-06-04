import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { PersonaService } from './persona.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@ApiTags('Personas')
@Controller('persona')
export class PersonaController {
  constructor(private personaService: PersonaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva persona', description: 'Registra una nueva persona/paciente en el sistema. Valida que el número de identidad y el correo electrónico no estén duplicados.' })
  @ApiCreatedResponse({ description: 'Persona creada exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o municipio no existente' })
  @ApiConflictResponse({ description: 'Número de identidad o correo electrónico duplicado' })
  async create(@Body() createPersonaDto: CreatePersonaDto) {
    return this.personaService.create(createPersonaDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar personas', description: 'Obtiene un listado paginado de personas. Permite buscar por número de identidad, nombre o apellido.' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página (por defecto 1)', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página (por defecto 10)', example: '10' })
  @ApiQuery({ name: 'search', required: false, description: 'Búsqueda por número de identidad, nombre o apellido', example: 'Juan' })
  @ApiOkResponse({ description: 'Listado de personas con paginación' })
  @ApiBadRequestResponse({ description: 'Parámetros de paginación inválidos' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('page y limit deben ser mayores a 0');
    }

    return this.personaService.findAll(pageNum, limitNum, search);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener detalle de una persona', description: 'Devuelve la información completa de una persona incluyendo municipio y departamento.' })
  @ApiParam({ name: 'id', description: 'ID de la persona', example: 1 })
  @ApiOkResponse({ description: 'Detalle de la persona' })
  @ApiNotFoundResponse({ description: 'Persona no encontrada' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personaService.findOne(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una persona', description: 'Actualiza los datos de una persona existente. Valida unicidad de identidad y correo si se modifican.' })
  @ApiParam({ name: 'id', description: 'ID de la persona', example: 1 })
  @ApiOkResponse({ description: 'Persona actualizada exitosamente' })
  @ApiNotFoundResponse({ description: 'Persona no encontrada' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o municipio no existente' })
  @ApiConflictResponse({ description: 'Número de identidad o correo electrónico duplicado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePersonaDto: UpdatePersonaDto,
  ) {
    return this.personaService.update(id, updatePersonaDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una persona', description: 'Elimina una persona si no tiene consultas o usuarios asociados. Si tiene registros asociados, devuelve un error.' })
  @ApiParam({ name: 'id', description: 'ID de la persona', example: 1 })
  @ApiOkResponse({ description: 'Persona eliminada exitosamente' })
  @ApiNotFoundResponse({ description: 'Persona no encontrada' })
  @ApiConflictResponse({ description: 'Persona con registros asociados (consultas o usuarios)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.personaService.remove(id);
  }
}
