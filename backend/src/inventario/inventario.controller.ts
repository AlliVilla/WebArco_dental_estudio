import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { InventarioService } from './inventario.service';
import { CreateInsumoDto } from './dto/create-insumo.dto';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateInsumoDto } from './dto/update-insumo.dto';
import { GetMovementHistoryDto } from './dto/get-movement-history.dto';

interface RequestWithUser extends Request {
  user?: {
    id_usuario?: number;
    id_rol?: number;
    sub?: number;
  };
}

@ApiTags('Inventario')
@Controller('inventory')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Privileges(63)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar insumos del inventario' })
  @ApiOkResponse({ description: 'Listado de insumos obtenido exitosamente.' })
  async findAll(
    @Query('search') search?: string,
    @Query('categoria') categoria?: string,
    @Query('estado') estado?: string,
    @Query('estadoRegistro') estadoRegistro?: string,
  ) {
    return this.inventarioService.findAll({
      search,
      categoria,
      estado,
      estadoRegistro,
    });
  }

  @Privileges(63)
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Indicadores del inventario' })
  @ApiOkResponse({ description: 'Indicadores de inventario obtenidos exitosamente.' })
  async getStats() {
    return this.inventarioService.getStats();
  }

  @Privileges(64)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear nuevo insumo' })
  @ApiCreatedResponse({ description: 'Insumo creado exitosamente.' })
  async create(@Body() dto: CreateInsumoDto) {
    return this.inventarioService.create(dto);
  }

  @Privileges(64)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar insumo' })
  @ApiOkResponse({ description: 'Insumo actualizado exitosamente.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInsumoDto,
  ) {
    return this.inventarioService.update(id, dto);
  }

  @Privileges(64)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar insumo lógicamente' })
  @ApiOkResponse({ description: 'Insumo marcado como inactivo exitosamente.' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.delete(id);
  }

  @Privileges(64)
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Readmitir insumo eliminado' })
  @ApiOkResponse({ description: 'Insumo readmitido exitosamente.' })
  async restore(@Param('id', ParseIntPipe) id: number) {
    return this.inventarioService.restore(id);
  }

  @Privileges(63)
  @Get('movements/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vista detallada del historial de movimientos de inventario' })
  @ApiOkResponse({ description: 'Historial detallado de movimientos obtenido exitosamente.' })
  async getMovementHistory(@Query() query: GetMovementHistoryDto) {
    return this.inventarioService.getMovementHistory(query);
  }

  @Privileges(63)
  @Get('movements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Historial de movimientos de inventario' })
  @ApiOkResponse({ description: 'Historial de movimientos obtenido exitosamente.' })
  async getMovimientos(
    @Query('id_insumo') idInsumo?: string,
    @Query('tipo') tipo?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.inventarioService.getMovimientos({
      id_insumo: idInsumo,
      tipo,
      fechaInicio,
      fechaFin,
    });
  }

  @Privileges(64)
  @Post('movements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar entrada o salida de inventario' })
  @ApiCreatedResponse({ description: 'Movimiento de inventario registrado exitosamente.' })
  async createMovimiento(
    @Body() dto: CreateMovimientoDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.id_usuario ?? req.user?.sub ?? dto.id_usuario;

    return this.inventarioService.createMovimiento({
      ...dto,
      id_usuario: userId,
    });
  }
}