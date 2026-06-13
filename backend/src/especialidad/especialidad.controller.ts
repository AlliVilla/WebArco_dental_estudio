import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse,
  ApiCreatedResponse, ApiNotFoundResponse, ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { EspecialidadService } from './especialidad.service';
import { CreateEspecialidadDto } from './dto/create-especialidad.dto';
import { UpdateEspecialidadDto } from './dto/update-especialidad.dto';

@ApiTags('Especialidades')
@Controller('especialidad')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado' })
export class EspecialidadController {
  constructor(private readonly especialidadService: EspecialidadService) {}

  @Get()
  @Privileges(65, 66)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar especialidades del catálogo' })
  @ApiOkResponse({ description: 'Lista de especialidades obtenida exitosamente' })
  findAll() {
    return this.especialidadService.findAll();
  }

  @Post()
  @Privileges(66)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una especialidad' })
  @ApiCreatedResponse({ description: 'Especialidad creada exitosamente' })
  @ApiConflictResponse({ description: 'Ya existe una especialidad con ese nombre' })
  create(@Body() dto: CreateEspecialidadDto) {
    return this.especialidadService.create(dto);
  }

  @Patch(':id')
  @Privileges(66)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una especialidad' })
  @ApiOkResponse({ description: 'Especialidad actualizada exitosamente' })
  @ApiNotFoundResponse({ description: 'Especialidad no encontrada' })
  @ApiConflictResponse({ description: 'Ya existe una especialidad con ese nombre' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEspecialidadDto,
  ) {
    return this.especialidadService.update(id, dto);
  }

  @Delete(':id')
  @Privileges(66)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una especialidad' })
  @ApiOkResponse({ description: 'Especialidad eliminada exitosamente' })
  @ApiNotFoundResponse({ description: 'Especialidad no encontrada' })
  @ApiConflictResponse({ description: 'No se puede eliminar: tiene tratamientos asociados' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.especialidadService.remove(id);
  }
}
