import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CierreService } from './cierre.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { QueryCierreDto } from './dto/query-cierre.dto';
import { TipoCierre } from '@prisma/client';

@ApiTags('cierre')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@Controller('cierre')
export class CierreController {
  constructor(private readonly cierreService: CierreService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Privileges(14)
  @ApiOperation({ summary: 'Realiza el cálculo de utilidad y congela el reporte del período' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Tipo de cierre (Diario, Semanal, Quincenal, Mensual). Por defecto: Diario.' })
  @ApiResponse({ status: 201, description: 'Cierre de caja generado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Faltan parámetros o ya existe un cierre.' })
  createCierre(@Query() query: QueryCierreDto, @Request() req: any) {
    const userId = req.user?.id_usuario ?? req.user?.sub;
    const tipoCierre = (query.tipo ?? 'Diario') as TipoCierre;
    return this.cierreService.createCierre(userId, tipoCierre);
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @Privileges(14)
  @ApiOperation({ summary: 'Calcula ingresos, egresos y utilidad del período sin cerrarlo' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Tipo de cierre (Diario, Semanal, Quincenal, Mensual). Por defecto: Diario.' })
  @ApiResponse({ status: 200, description: 'Cálculo actual.' })
  previewCierre(@Query() query: QueryCierreDto) {
    const tipoCierre = (query.tipo ?? 'Diario') as TipoCierre;
    return this.cierreService.previewCierre(tipoCierre);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Privileges(15)
  @ApiOperation({ summary: 'Retorna el historial de cortes de caja almacenados' })
  @ApiResponse({ status: 200, description: 'Historial de cierres de caja.' })
  getHistorial() {
    return this.cierreService.getHistorial();
  }
}
