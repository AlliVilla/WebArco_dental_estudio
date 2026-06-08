import { Controller, UseGuards, Get, Post, Body, Param, ParseIntPipe, Query, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Usuarios')
@Controller('usuario')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class UsuarioController {
  constructor(private usuarioService: UsuarioService) {}

  @Get('profile/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener perfil de usuario', description: 'Obtiene los datos del perfil de un usuario autenticado' })
  @ApiParam({ name: 'id', description: 'ID del usuario', example: 1 })
  @ApiOkResponse({ description: 'Datos del usuario' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.getUserById(id);
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar usuarios', description: 'Obtiene un listado paginado de todos los usuarios' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página (por defecto 1)', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página (por defecto 10)', example: '10' })
  @ApiOkResponse({ description: 'Listado de usuarios con paginación' })
  @ApiBadRequestResponse({ description: 'Parámetros de paginación inválidos' })
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('page y limit deben ser mayores a 0');
    }

    return this.usuarioService.getAllUsers(pageNum, limitNum);
  }
}
