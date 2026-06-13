import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe,
  HttpCode, HttpStatus, UseGuards, Query,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse,
  ApiCreatedResponse, ApiNotFoundResponse, ApiUnauthorizedResponse, ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { TratamientoService } from './tratamiento.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@ApiTags('Tratamientos')
@Controller('tratamiento')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class TratamientoController {
  constructor(private readonly tratamientoService: TratamientoService) {}

  @Get()
  @Privileges(65, 66)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar tratamientos del catálogo' })
  @ApiQuery({ name: 'nombre', required: false, description: 'Filtrar por nombre' })
  @ApiQuery({ name: 'especialidad', required: false, description: 'Filtrar por nombre de especialidad' })
  @ApiQuery({ name: 'activo', required: false, description: 'Filtrar por estado activo (true/false)' })
  @ApiOkResponse({ description: 'Lista de tratamientos obtenida exitosamente' })
  findAll(
    @Query('nombre') nombre?: string,
    @Query('especialidad') especialidad?: string,
    @Query('activo') activo?: string,
  ) {
    return this.tratamientoService.findAll(nombre, especialidad, activo);
  }

  @Get(':id')
  @Privileges(65, 66)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un tratamiento por ID' })
  @ApiOkResponse({ description: 'Tratamiento encontrado' })
  @ApiNotFoundResponse({ description: 'Tratamiento no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tratamientoService.findOne(id);
  }

  @Post()
  @Privileges(66)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un tratamiento' })
  @ApiCreatedResponse({ description: 'Tratamiento creado correctamente' })
  create(@Body() dto: CreateTratamientoDto) {
    return this.tratamientoService.create(dto);
  }

  @Put(':id')
  @Privileges(66)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un tratamiento' })
  @ApiOkResponse({ description: 'Tratamiento actualizado correctamente' })
  @ApiNotFoundResponse({ description: 'Tratamiento no encontrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTratamientoDto) {
    return this.tratamientoService.update(id, dto);
  }

  @Patch(':id/toggle-activo')
  @Privileges(66)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar o desactivar un tratamiento' })
  @ApiOkResponse({ description: 'Estado cambiado correctamente' })
  @ApiNotFoundResponse({ description: 'Tratamiento no encontrado' })
  toggleActivo(@Param('id', ParseIntPipe) id: number) {
    return this.tratamientoService.toggleActivo(id);
  }

  @Delete(':id')
  @Privileges(66)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un tratamiento' })
  @ApiOkResponse({ description: 'Tratamiento eliminado correctamente' })
  @ApiNotFoundResponse({ description: 'Tratamiento no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tratamientoService.remove(id);
  }
}
