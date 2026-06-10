import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { InventarioService } from './inventario.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';

@ApiTags('Inventario')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class InventarioController {
  constructor(private inventarioService: InventarioService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar insumos del inventario' })
  async findAll(@Query('search') search?: string, @Query('categoria') categoria?: string, @Query('estado') estado?: string) {
    return this.inventarioService.findAll({ search, categoria, estado });
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Indicadores del inventario' })
  async getStats() {
    return this.inventarioService.getStats();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo insumo' })
  async create(@Body() dto: CreateInsumoDto) {
    return this.inventarioService.create(dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar insumo' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInsumoDto) {
    return this.inventarioService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar insumo' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.delete(id);
  }

  @Get('movements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Historial de movimientos de inventario' })
  async getMovimientos() {
    return this.inventarioService.getMovimientos();
  }

  @Post('movements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar entrada o salida de inventario' })
  async createMovimiento(@Body() dto: CreateMovimientoDto) {
    return this.inventarioService.createMovimiento(dto);
  }
}
