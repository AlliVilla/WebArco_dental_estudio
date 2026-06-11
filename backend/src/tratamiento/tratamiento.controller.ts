import {
  Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse,
  ApiCreatedResponse, ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TratamientoService } from './tratamiento.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@ApiTags('Tratamientos')
@Controller('tratamiento')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class TratamientoController {
  constructor(private readonly tratamientoService: TratamientoService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar tratamientos del catálogo' })
  @ApiOkResponse({ description: 'Lista de tratamientos obtenida exitosamente' })
  findAll() {
    return this.tratamientoService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un tratamiento por ID' })
  @ApiOkResponse({ description: 'Tratamiento encontrado' })
  @ApiNotFoundResponse({ description: 'Tratamiento no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tratamientoService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un tratamiento' })
  @ApiCreatedResponse({ description: 'Tratamiento creado correctamente' })
  create(@Body() dto: CreateTratamientoDto) {
    return this.tratamientoService.create(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un tratamiento' })
  @ApiOkResponse({ description: 'Tratamiento actualizado correctamente' })
  @ApiNotFoundResponse({ description: 'Tratamiento no encontrado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTratamientoDto) {
    return this.tratamientoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un tratamiento' })
  @ApiOkResponse({ description: 'Tratamiento eliminado correctamente' })
  @ApiNotFoundResponse({ description: 'Tratamiento no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tratamientoService.remove(id);
  }
}
