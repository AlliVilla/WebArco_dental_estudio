import { Controller, UseGuards, Get, Post, Put, Patch, Body, Param, ParseIntPipe, Query, HttpCode, HttpStatus, BadRequestException, Req} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiOkResponse, ApiNotFoundResponse, ApiBadRequestResponse,
  ApiParam, ApiQuery, ApiCreatedResponse, ApiConflictResponse, ApiUnprocessableEntityResponse } from '@nestjs/swagger';
import { UsuarioService } from './usuario.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

import type { Request } from 'express';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateStatusUsuarioDto } from './dto/update-status-usuario.dto';
import { UpdateProfileDto } from './dto/perfil/update-profile.dto';
import { ChangePasswordDto } from './dto/perfil/change-password.dto';

type AuthRequest = Request & {
  user: {
    id_usuario: number;
    username: string;
    email?: string | null;
    id_rol: number;
  };
};

@ApiTags('Usuarios')
@Controller('usuario')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class UsuarioController {
  constructor(private usuarioService: UsuarioService) {}

  @Privileges(9)
  @Get('profile/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener perfil de usuario', description: 'Obtiene los datos del perfil de un usuario autenticado' })
  @ApiParam({ name: 'id', description: 'ID del usuario', example: 1 })
  @ApiOkResponse({ description: 'Datos del usuario' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.usuarioService.getUserById(id);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar perfil del usuario autenticado',
    description: 'Permite editar username, email y nombre completo.',
  })
  @ApiOkResponse({ description: 'Perfil actualizado correctamente' })
  @ApiConflictResponse({
    description: 'Username o email ya se encuentra en uso',
  })
  async updateProfile(
    @Req() req: AuthRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const profile = await this.usuarioService.updateAuthenticatedProfile(
      req.user.id_usuario,
      updateProfileDto,
    );

    return {
      profile,
      message: 'Perfil actualizado correctamente.',
    };
  }

  @Put('profile/change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar contraseña del usuario autenticado',
    description:
      'Valida contraseña actual, confirmación y reglas de seguridad.',
  })
  @ApiOkResponse({ description: 'Contraseña actualizada correctamente' })
  @ApiUnauthorizedResponse({
    description: 'Contraseña actual incorrecta',
  })
  @ApiUnprocessableEntityResponse({
    description: 'La nueva contraseña no cumple reglas de seguridad',
  })
  async changePassword(
    @Req() req: AuthRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.usuarioService.changeAuthenticatedPassword(
      req.user.id_usuario,
      changePasswordDto,
    );

    return {
      message: 'Contraseña actualizada correctamente.',
    };
  }

  @Privileges(6)
  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar usuarios', description: 'Obtiene un listado paginado de usuarios y permite filtrar por nombre, correo o rol.' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página (por defecto 1)', example: '1', })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página (por defecto 10)', example: '10' })
  @ApiQuery({ name: 'nombre', required: false, description: 'Filtro por nombre o apellido', example: 'Juan' })
  @ApiQuery({ name: 'correo', required: false, description: 'Filtro por correo electrónico', example: 'juan@gmail.com' })
  @ApiQuery({ name: 'rol', required: false, description: 'Filtro por nombre del rol', example: 'Doctor' })
  @ApiOkResponse({ description: 'Listado de usuarios con paginación' })
  @ApiBadRequestResponse({ description: 'Parámetros de paginación inválidos' })
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('nombre') nombre?: string,
    @Query('correo') correo?: string,
    @Query('rol') rol?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException('page y limit deben ser mayores a 0');
    }

    return this.usuarioService.getAllUsers(pageNum, limitNum, {
      nombre,
      correo,
      rol,
    });
  }

  @Privileges(6)
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas de usuarios',
    description: 'Retorna el total de usuarios, doctores y especialistas.',
  })
  @ApiOkResponse({ description: 'Estadísticas obtenidas correctamente' })
  async getStats() {
    const stats = await this.usuarioService.getStats();

    return {
      stats,
      message: 'Estadísticas obtenidas correctamente.',
    };
  }

  @Privileges(7)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear usuario',
    description:
      'Crea un usuario con información personal, contacto, ubicación, rol y contraseña temporal.',
  })
  @ApiCreatedResponse({ description: 'Usuario creado exitosamente' })
  @ApiBadRequestResponse({
    description: 'Datos inválidos, rol o municipio no existente',
  })
  @ApiConflictResponse({
    description: 'Usuario, identidad, correo o teléfono duplicado',
  })
  async create(@Body() createUsuarioDto: CreateUsuarioDto) {
    const usuario = await this.usuarioService.create(createUsuarioDto);

    return {
      usuario,
      message: 'Usuario creado correctamente.',
    };
  }

  @Privileges(8)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar usuario',
    description:
      'Actualiza los datos personales y de usuario. No permite cambiar contraseña.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario', example: 1 })
  @ApiOkResponse({ description: 'Usuario actualizado correctamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiConflictResponse({
    description: 'Correo, identidad, teléfono o username duplicado',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    const usuario = await this.usuarioService.update(id, updateUsuarioDto);

    return {
      usuario,
      message: 'Usuario actualizado correctamente.',
    };
  }

  @Privileges(8)
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar o desactivar usuario',
    description: 'Activa o desactiva inmediatamente un usuario.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario', example: 1 })
  @ApiOkResponse({ description: 'Estado del usuario actualizado correctamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusUsuarioDto,
  ) {
    const usuario = await this.usuarioService.updateStatus(id, updateStatusDto);

    return {
      usuario,
      message: 'Estado del usuario actualizado correctamente.',
    };
  }
}
