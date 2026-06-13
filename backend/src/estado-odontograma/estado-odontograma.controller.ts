import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse,
  ApiCreatedResponse, ApiNotFoundResponse, ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { EstadoOdontogramaService } from './estado-odontograma.service';
import { CreateEstadoDto } from './dto/create-estado.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';

@ApiTags('Estados Odontograma')
@Controller('estado-odontograma')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado' })
export class EstadoOdontogramaController {
  constructor(private readonly service: EstadoOdontogramaService) {}

  @Get()
  @Privileges(3, 4, 5, 67, 68)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar estados del odontograma' })
  @ApiOkResponse({ description: 'Lista de estados obtenida exitosamente' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Privileges(4, 68)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un estado' })
  @ApiCreatedResponse({ description: 'Estado creado exitosamente' })
  @ApiConflictResponse({ description: 'Ya existe un estado con ese nombre' })
  create(@Body() dto: CreateEstadoDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Privileges(4, 68)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un estado' })
  @ApiOkResponse({ description: 'Estado actualizado exitosamente' })
  @ApiNotFoundResponse({ description: 'Estado no encontrado' })
  @ApiConflictResponse({ description: 'Ya existe un estado con ese nombre' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEstadoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Privileges(4, 68)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un estado' })
  @ApiOkResponse({ description: 'Estado eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Estado no encontrado' })
  @ApiConflictResponse({ description: 'No se puede eliminar: tiene registros de odontograma asociados' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
