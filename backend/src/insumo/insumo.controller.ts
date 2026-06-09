import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InsumoService } from './insumo.service';
import { GetInsumosDto } from './dto/get-insumo.dto';
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
}
