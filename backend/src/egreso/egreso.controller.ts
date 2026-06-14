import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { CreateEgresoDto } from './dto/create-egreso.dto';
import { EgresoService } from './egreso.service';

type AuthenticatedRequest = Request & {
  user: {
    sub?: number | string;
    id_usuario?: number | string;
    username?: string;
    email?: string;
    id_rol?: number;
  };
};

@ApiTags('Egresos')
@Controller('egreso')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class EgresoController {
  constructor(private readonly egresoService: EgresoService) {}

  @Privileges(13)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar egresos financieros' })
  @ApiOkResponse({ description: 'Lista de egresos obtenida exitosamente.' })
  findAll() {
    return this.egresoService.findAll();
  }

  @Privileges(13)
  @Get('resumen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener resumen de métricas de egresos' })
  @ApiOkResponse({ description: 'Resumen de métricas obtenido exitosamente.' })
  getResumen() {
    return this.egresoService.getResumen();
  }

  @Privileges(13)
  @Get('mes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener egresos del mes actual' })
  @ApiOkResponse({ description: 'Egresos del mes obtenidos exitosamente.' })
  getEgresosDelMes() {
    return this.egresoService.getEgresosDelMes();
  }

  @Privileges(13)
  @Get('dia')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener egresos del día actual' })
  @ApiOkResponse({ description: 'Egresos del día obtenidos exitosamente.' })
  getEgresosDelDia() {
    return this.egresoService.getEgresosDelDia();
  }

  @Privileges(13)
  @Get('promedio-mes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener egreso promedio del mes actual' })
  @ApiOkResponse({ description: 'Egreso promedio del mes obtenido exitosamente.' })
  getPromedioDelMes() {
    return this.egresoService.getPromedioDelMes();
  }

  @Privileges(13)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un egreso financiero por ID' })
  @ApiParam({ name: 'id', description: 'ID del egreso', example: 1 })
  @ApiOkResponse({ description: 'Egreso obtenido exitosamente.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.egresoService.findOne(id);
  }

  @Privileges(11)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un egreso financiero' })
  @ApiCreatedResponse({ description: 'Egreso registrado exitosamente.' })
  create(
    @Body() createEgresoDto: CreateEgresoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.egresoService.create(
      createEgresoDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @Privileges(11)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar completamente un egreso financiero' })
  @ApiParam({ name: 'id', description: 'ID del egreso', example: 1 })
  @ApiOkResponse({ description: 'Egreso actualizado exitosamente.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEgresoDto: CreateEgresoDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.egresoService.update(
      id,
      updateEgresoDto,
      this.getAuthenticatedUserId(req),
    );
  }

  @Privileges(11)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un egreso financiero' })
  @ApiParam({ name: 'id', description: 'ID del egreso', example: 1 })
  @ApiOkResponse({ description: 'Egreso eliminado exitosamente.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.egresoService.remove(id);
  }

  private getAuthenticatedUserId(req: AuthenticatedRequest): number {
    const idUsuarioRaw = req.user?.id_usuario ?? req.user?.sub;
    const idUsuario = Number(idUsuarioRaw);

    if (!idUsuario || Number.isNaN(idUsuario)) {
      throw new UnauthorizedException('No se pudo identificar el usuario autenticado');
    }

    return idUsuario;
  }
}