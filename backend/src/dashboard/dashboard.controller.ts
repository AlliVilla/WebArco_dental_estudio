import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumen')
  @Privileges(1)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener resumen general del dashboard',
    description:
      'Retorna KPIs clínicos, agenda del día y estadísticas de citas. No incluye datos financieros.',
  })
  @ApiOkResponse({ description: 'Resumen general del dashboard obtenido exitosamente' })
  async getResumen() {
    return this.dashboardService.getResumenGeneral();
  }

  @Get('financiero')
  @Privileges(2)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener resumen financiero del dashboard',
    description:
      'Retorna KPIs y gráficas financieras. Requiere el privilegio DASHBOARD_FINANCIERO.',
  })
  @ApiOkResponse({ description: 'Resumen financiero del dashboard obtenido exitosamente' })
  async getFinanciero() {
    return this.dashboardService.getResumenFinanciero();
  }
}
