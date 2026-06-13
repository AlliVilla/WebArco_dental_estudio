import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CategoriaInsumoService } from './categoria-insumo.service';
import { CreateCategoriaInsumoDto } from './dto/create-categoria-insumo.dto';
import { UpdateCategoriaInsumoDto } from './dto/update-categoria-insumo.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Categorías de Insumo')
@Controller('categoria-insumo')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class CategoriaInsumoController {
  constructor(private readonly categoriaInsumoService: CategoriaInsumoService) {}

  @Privileges(64)
  @Post()
  @ApiOperation({ summary: 'Crear una nueva categoría de insumo' })
  @ApiCreatedResponse({ description: 'Categoría creada exitosamente.' })
  create(@Body() createDto: CreateCategoriaInsumoDto) {
    return this.categoriaInsumoService.create(createDto);
  }

  @Privileges(63)
  @Get()
  @ApiOperation({ summary: 'Obtener todas las categorías de insumo' })
  @ApiOkResponse({ description: 'Lista de categorías obtenida exitosamente.' })
  findAll() {
    return this.categoriaInsumoService.findAll();
  }

  @Privileges(63)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  @ApiOkResponse({ description: 'Categoría obtenida exitosamente.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaInsumoService.findOne(id);
  }

  @Privileges(64)
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una categoría de insumo' })
  @ApiOkResponse({ description: 'Categoría actualizada exitosamente.' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateCategoriaInsumoDto) {
    return this.categoriaInsumoService.update(id, updateDto);
  }

  @Privileges(64)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una categoría de insumo' })
  @ApiOkResponse({ description: 'Categoría eliminada exitosamente.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriaInsumoService.remove(id);
  }
}
