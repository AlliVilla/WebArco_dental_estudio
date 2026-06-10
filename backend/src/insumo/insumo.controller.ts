import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { InsumoService } from './insumo.service';
import { GetInsumosDto } from './dto/get-insumo.dto';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Insumos')
@Controller('insumo')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class InsumoController {
  constructor(private readonly insumoService: InsumoService) {}

  @Privileges(53)
  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas (KPIs) del inventario' })
  @ApiOkResponse({ description: 'Estadísticas del inventario obtenidas exitosamente.' })
  getStats() {
    return this.insumoService.getStats();
  }

  @Privileges(47)
  @Get()
  @ApiOperation({ summary: 'Obtener lista de insumos paginada y filtrable' })
  @ApiOkResponse({ description: 'Lista de insumos obtenida exitosamente.' })
  findAll(@Query() query: GetInsumosDto) {
    return this.insumoService.findAll(query);
  }

  @Privileges(48)
  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo insumo con código autogenerado' })
  @ApiCreatedResponse({ description: 'Insumo creado exitosamente.' })
  create(@Body() createInsumoDto: CreateInsumoDto) {
    return this.insumoService.create(createInsumoDto);
  }

  @Privileges(49)
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar la información de un insumo' })
  @ApiOkResponse({ description: 'Insumo actualizado exitosamente.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateInsumoDto: UpdateInsumoDto) {
    return this.insumoService.update(id, updateInsumoDto);
  }

  @Privileges(50)
  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar (soft-delete) un insumo' })
  @ApiOkResponse({ description: 'Insumo desactivado exitosamente.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.insumoService.remove(id);
  }
}
