import {
  Controller, Get, Post, Patch, Body, Param, ParseIntPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiCreatedResponse,
  ApiOkResponse, ApiNotFoundResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { TratamientoPacienteService } from './tratamiento-paciente.service';
import { CreateTratamientoPacienteDto } from './dto/create-tratamiento-paciente.dto';
import { TratamientoEstado } from '@prisma/client';

@ApiTags('Tratamientos del Paciente')
@Controller('tratamiento-paciente')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado' })
export class TratamientoPacienteController {
  constructor(private readonly service: TratamientoPacienteService) {}

  @Privileges(17)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un tratamiento para un paciente' })
  @ApiCreatedResponse({ description: 'Tratamiento creado exitosamente' })
  async create(@Body() dto: CreateTratamientoPacienteDto) {
    const data = await this.service.create(dto);
    return { data, message: 'Tratamiento registrado exitosamente' };
  }

  @Privileges(16)
  @Get('paciente/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar tratamientos de un paciente' })
  @ApiOkResponse({ description: 'Lista de tratamientos del paciente' })
  async findByPaciente(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByPaciente(id);
  }

  @Privileges(16)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener detalle de un tratamiento de paciente' })
  @ApiOkResponse({ description: 'Detalle del tratamiento' })
  @ApiNotFoundResponse({ description: 'Tratamiento no encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Privileges(17)
  @Patch(':id/estado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar estado de un tratamiento (ACTIVO, COMPLETADO, CANCELADO)' })
  @ApiOkResponse({ description: 'Estado actualizado' })
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: TratamientoEstado,
  ) {
    const data = await this.service.updateEstado(id, estado);
    return { data, message: 'Estado actualizado exitosamente' };
  }
}
