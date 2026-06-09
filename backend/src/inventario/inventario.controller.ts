import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { GetMovimientosDto } from './dto/get-movimientos.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Movimientos de Inventario')
@Controller('inventario/movimiento')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un movimiento (entrada o salida) y actualizar stock' })
  @ApiCreatedResponse({ description: 'Movimiento de inventario registrado exitosamente.' })
  create(@Body() createMovimientoDto: CreateMovimientoDto, @Req() req: any) {
    const userId = req.user.id_usuario; // Asumiendo que el JWT payload inyecta req.user
    return this.inventarioService.create(createMovimientoDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener historial de movimientos con filtros' })
  @ApiOkResponse({ description: 'Historial de movimientos obtenido exitosamente.' })
  findAll(@Query() query: GetMovimientosDto) {
    return this.inventarioService.findAll(query);
  }
}
