import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { GetMovimientosDto } from './dto/get-movimientos.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
// import { PrivilegesGuard } from '../guards/privileges.guard';
// import { Privileges } from '../common/decorators/privileges.decorator';

@ApiTags('Movimientos de Inventario')
@Controller('inventario/movimiento')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un movimiento (entrada o salida) y actualizar stock' })
  // @Privileges(X) // Reemplazar con ID de privilegio correspondiente cuando se defina
  create(@Body() createMovimientoDto: CreateMovimientoDto, @Req() req: any) {
    const userId = req.user.id_usuario; // Asumiendo que el JWT payload inyecta req.user
    return this.inventarioService.create(createMovimientoDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener historial de movimientos con filtros' })
  // @Privileges(X) // Reemplazar con ID de privilegio correspondiente cuando se defina
  findAll(@Query() query: GetMovimientosDto) {
    return this.inventarioService.findAll(query);
  }
}
