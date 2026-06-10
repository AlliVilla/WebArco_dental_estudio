<<<<<<< HEAD
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
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
  async findAll(
    @Query('search') search?: string,
    @Query('categoria') categoria?: string,
    @Query('estado') estado?: string,
    @Query('estadoRegistro') estadoRegistro?: string,
  ) {
    return this.inventarioService.findAll({ search, categoria, estado, estadoRegistro });
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

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readmitir insumo eliminado' })
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.restore(id);
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
=======
import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { InventarioService } from './inventario.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { GetMovimientosDto } from './dto/get-movimientos.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

interface RequestWithUser extends Request {
  user: { id_usuario: number; id_rol: number };
}

@ApiTags('Movimientos de Inventario')
@Controller('inventario/movimiento')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Privileges(51)
  @Post()
  @ApiOperation({ summary: 'Registrar un movimiento (entrada o salida) y actualizar stock' })
  @ApiCreatedResponse({ description: 'Movimiento de inventario registrado exitosamente.' })
  create(@Body() createMovimientoDto: CreateMovimientoDto, @Req() req: RequestWithUser) {
    const userId = req.user.id_usuario;
    return this.inventarioService.create(createMovimientoDto, userId);
  }

  @Privileges(52)
  @Get()
  @ApiOperation({ summary: 'Obtener historial de movimientos con filtros' })
  @ApiOkResponse({ description: 'Historial de movimientos obtenido exitosamente.' })
  findAll(@Query() query: GetMovimientosDto) {
    return this.inventarioService.findAll(query);
>>>>>>> main
  }
}
