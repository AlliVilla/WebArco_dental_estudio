import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { InsumoService } from './insumo.service';
import { GetInsumosDto } from './dto/get-insumo.dto';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
// import { PrivilegesGuard } from '../guards/privileges.guard';
// import { Privileges } from '../common/decorators/privileges.decorator';

@ApiTags('Insumos')
@Controller('insumo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class InsumoController {
  constructor(private readonly insumoService: InsumoService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas (KPIs) del inventario' })
  // @Privileges(X) // Asignar ID si existe en privilegios.js
  getStats() {
    return this.insumoService.getStats();
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de insumos paginada y filtrable' })
  // @Privileges(X) // Asignar ID si existe en privilegios.js
  findAll(@Query() query: GetInsumosDto) {
    return this.insumoService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo insumo con código autogenerado' })
  // @Privileges(X) // Asignar ID si existe en privilegios.js
  create(@Body() createInsumoDto: CreateInsumoDto) {
    return this.insumoService.create(createInsumoDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar la información de un insumo' })
  // @Privileges(X) // Asignar ID si existe en privilegios.js
  update(@Param('id', ParseIntPipe) id: number, @Body() updateInsumoDto: UpdateInsumoDto) {
    return this.insumoService.update(id, updateInsumoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un insumo física o lógicamente' })
  // @Privileges(X) // Asignar ID si existe en privilegios.js
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.insumoService.remove(id);
  }
}
