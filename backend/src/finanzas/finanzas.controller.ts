import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { FinanzasService } from './finanzas.service';
import { BalanceReportDto } from './dto/balance-report.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { ParseDatePipe } from '../pipes/parse-date.pipe';
import { Privileges } from 'src/auth/decorators/privileges.decorator';

@ApiTags('Finanzas')
@Controller('finanzas')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class FinanzasController {
  constructor(private finanzasService: FinanzasService) {}
  @Get('balance')
  @Privileges(2)
  @ApiOperation({
    summary: 'Obtener Balance General',
    description: 'Retorna el Balance General calculando flujo de caja actual, activos y pasivos consolidados para el período especificado. Integra datos de PagoPaciente, PagoConsulta y MovimientoInventario.',
  })
  @ApiQuery({
    name: 'fecha_inicio',
    example: '2026-01-01',
    description: 'Fecha de inicio del período (formato YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'fecha_fin',
    example: '2026-01-31',
    description: 'Fecha de fin del período (formato YYYY-MM-DD)',
  })
  @ApiOkResponse({
    description: 'Balance General obtenido exitosamente',
    type: BalanceReportDto,
  })
  @ApiBadRequestResponse({
    description: 'Parámetros de fecha inválidos',
  })
  async getBalance(
    @Query('fecha_inicio', ParseDatePipe) fecha_inicio: Date,
                   @Query('fecha_fin', ParseDatePipe) fecha_fin: Date,
  ): Promise<BalanceReportDto> {
    return this.finanzasService.getBalance(fecha_inicio, fecha_fin);
  }

  @Get('estado-resultado')
  @Privileges(2, 63)
  @ApiOperation({
    summary: 'Obtener rentabilidad',
    description: 'Calcula ingresos menos gastos por rango de fechas.'
  })
  @ApiQuery({ name: 'fecha_inicio', example: '2026-01-01' })
  @ApiQuery({ name: 'fecha_fin', example: '2026-01-31' })
  async getEstadoResultado(
    @Query('fecha_inicio', ParseDatePipe) fecha_inicio: Date,
    @Query('fecha_fin', ParseDatePipe) fecha_fin: Date,
  ) {

    return this.finanzasService.getEstadoResultado(fecha_inicio, fecha_fin);
  }
}
