import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UnidadMedidaService } from './unidad-medida.service';
import { CreateUnidadMedidaDto } from './dto/create-unidad-medida.dto';
import { UpdateUnidadMedidaDto } from './dto/update-unidad-medida.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Unidades de Medida')
@Controller('unidad-medida')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class UnidadMedidaController {
  constructor(private readonly unidadMedidaService: UnidadMedidaService) {}

  @Privileges(64)
  @Post()
  @ApiOperation({ summary: 'Crear una nueva unidad de medida' })
  @ApiCreatedResponse({ description: 'Unidad de medida creada exitosamente.' })
  create(@Body() createDto: CreateUnidadMedidaDto) {
    return this.unidadMedidaService.create(createDto);
  }

  @Privileges(63)
  @Get()
  @ApiOperation({ summary: 'Obtener todas las unidades de medida' })
  @ApiOkResponse({ description: 'Lista de unidades de medida obtenida exitosamente.' })
  findAll() {
    return this.unidadMedidaService.findAll();
  }

  @Privileges(63)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una unidad de medida por ID' })
  @ApiOkResponse({ description: 'Unidad de medida obtenida exitosamente.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.unidadMedidaService.findOne(id);
  }

  @Privileges(64)
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una unidad de medida' })
  @ApiOkResponse({ description: 'Unidad de medida actualizada exitosamente.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateUnidadMedidaDto) {
    return this.unidadMedidaService.update(id, updateDto);
  }

  @Privileges(64)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una unidad de medida' })
  @ApiOkResponse({ description: 'Unidad de medida eliminada exitosamente.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.unidadMedidaService.remove(id);
  }
}
