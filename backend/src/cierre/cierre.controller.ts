import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CierreService } from './cierre.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('cierre')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@Controller('cierre')
export class CierreController {
  constructor(private readonly cierreService: CierreService) {}

  @Post()
  @Privileges(14)
  @ApiOperation({ summary: 'Realiza el cálculo del saldo y congela el reporte de la jornada' })
  @ApiResponse({ status: 201, description: 'Cierre de caja generado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Ya existe un cierre de caja para el día de hoy.' })
  createCierre(@Request() req: any) {
    const userId = req.user?.id_usuario ?? req.user?.sub;
    return this.cierreService.createCierre(userId);
  }

  @Post('preview')
  @Privileges(14)
  @ApiOperation({ summary: 'Calcula ingresos menos egresos de la jornada sin cerrarla' })
  @ApiResponse({ status: 200, description: 'Cálculo de ingresos y egresos actual.' })
  previewCierre() {
    return this.cierreService.previewCierre();
  }

  @Get()
  @Privileges(15)
  @ApiOperation({ summary: 'Retorna el historial de cortes de caja almacenados' })
  @ApiResponse({ status: 200, description: 'Historial de cierres de caja.' })
  getHistorial() {
    return this.cierreService.getHistorial();
  }
}
