import {
  Controller,
  Get,
  Patch,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { NotificacionService } from './notificacion.service';
import { QueryNotificacionesDto } from './dto/query-notificaciones.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Notificaciones')
@Controller('notificaciones')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class NotificacionController {
  constructor(private readonly notificacionService: NotificacionService) {}


  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener notificaciones del usuario autenticado',
    description:
      'Retorna el listado paginado de notificaciones del doctor logueado, ordenadas por fecha. Incluye el conteo de no leídas.',
  })
  @ApiOkResponse({ description: 'Listado paginado de notificaciones' })
  async getNotificaciones(
    @Request() req: any,
    @Query() query: QueryNotificacionesDto,
  ) {
    const id_usuario = req.user.id_usuario;
    return this.notificacionService.getNotificaciones(id_usuario, query);
  }


  @Get('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener configuración de notificaciones del doctor',
    description:
      'Retorna la configuración personal de notificaciones (minutos de anticipación, email activado).',
  })
  @ApiOkResponse({ description: 'Configuración de notificaciones' })
  async getConfig(@Request() req: any) {
    const id_usuario = req.user.id_usuario;
    return this.notificacionService.getConfig(id_usuario);
  }


  @Put('config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar configuración de notificaciones',
    description:
      'Crea o actualiza la configuración de notificaciones del doctor (minutos de anticipación y activación de emails).',
  })
  @ApiOkResponse({ description: 'Configuración actualizada' })
  async upsertConfig(@Request() req: any, @Body() dto: UpdateConfigDto) {
    const id_usuario = req.user.id_usuario;
    return this.notificacionService.upsertConfig(id_usuario, dto);
  }


  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar todas las notificaciones como leídas',
    description: 'Marca todas las notificaciones no leídas del doctor autenticado como leídas.',
  })
  @ApiOkResponse({ description: 'Todas las notificaciones marcadas como leídas' })
  async markAllAsRead(@Request() req: any) {
    const id_usuario = req.user.id_usuario;
    return this.notificacionService.markAllAsRead(id_usuario);
  }


  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar una notificación como leída',
    description: 'Marca una notificación específica como leída. Valida que pertenezca al doctor autenticado.',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación', example: 1 })
  @ApiOkResponse({ description: 'Notificación marcada como leída' })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const id_usuario = req.user.id_usuario;
    return this.notificacionService.markAsRead(id, id_usuario);
  }
}
