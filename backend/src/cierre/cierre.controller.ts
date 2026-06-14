import { Controller, Get, HttpCode, HttpStatus, Post, UnauthorizedException, BadRequestException, UseGuards, Request, Query } from '@nestjs/common';
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
  constructor(private readonly cierreService: CierreService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Privileges(14)
  @ApiOperation({ summary: 'Realiza el cálculo de utilidad y congela el reporte del período' })
  @ApiQuery({ name: 'tipo', required: false, description: 'Tipo de cierre (Diario, Semanal, Quincenal, Mensual). Por defecto: Diario.' })
  @ApiResponse({ status: 201, description: 'Cierre de caja generado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Faltan parámetros o ya existe un cierre.' })
  createCierre(@Query() query: QueryCierreDto, @Request() req: any) {
    const userId: number | undefined = req.user?.id_usuario ?? req.user?.sub;
    if (!userId)
      throw new UnauthorizedException('No se pudo identificar al usuario autenticado');
    const tipoCierre = (query.tipo ?? 'Diario') as TipoCierre;
    return this.cierreService.createCierre(userId, tipoCierre);
  }

  @Get('preview')
  @HttpCode(HttpStatus.OK)
  @Privileges(14)
  @ApiOperation({ summary: 'Obtiene el resumen de ingresos, egresos y utilidad de una fecha específica' })
  @ApiQuery({ name: 'fecha', required: true, description: 'Fecha para generar el resumen (formato: DD/MM/YYYY).' })
  @ApiResponse({ status: 200, description: 'Resumen financiero del día.' })
  @ApiResponse({ status: 400, description: 'Formato de fecha inválido.' })
  async previewCierre(@Query('fecha') fecha: string) {
    if (!fecha) {
        throw new BadRequestException('El parámetro fecha es requerido en formato DD/MM/YYYY');
    }
    return this.cierreService.previewCierrePorFecha(fecha);
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
