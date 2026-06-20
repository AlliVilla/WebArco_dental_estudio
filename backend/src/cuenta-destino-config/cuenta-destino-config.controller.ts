import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CuentaDestinoConfigService } from './cuenta-destino-config.service';
import { CreateCuentaDestinoConfigDto } from './dto/create-cuenta-destino-config.dto';
import { UpdateCuentaDestinoConfigDto } from './dto/update-cuenta-destino-config.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Cuenta Destino Config')
@Controller('cuenta-destino-config')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class CuentaDestinoConfigController {
  constructor(private readonly service: CuentaDestinoConfigService) {}

  @Privileges(10)
  @Post()
  @ApiOperation({ summary: 'Crear una nueva cuenta destino' })
  create(@Body() createDto: CreateCuentaDestinoConfigDto) {
    return this.service.create(createDto);
  }

  @Privileges(12)
  @Get()
  @ApiOperation({ summary: 'Obtener todas las cuentas destino' })
  findAll() {
    return this.service.findAll();
  }

  @Privileges(12)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cuenta destino por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Privileges(10)
  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una cuenta destino' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateCuentaDestinoConfigDto) {
    return this.service.update(id, updateDto);
  }

  @Privileges(10)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una cuenta destino' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
