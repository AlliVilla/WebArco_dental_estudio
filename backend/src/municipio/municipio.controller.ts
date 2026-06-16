import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MunicipioService } from './municipio.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Municipios')
@Controller('municipio')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class MunicipioController {
  constructor(private readonly municipioService: MunicipioService) {}

  @Privileges(6, 16)
  @Get()
  @ApiOperation({ summary: 'Obtener todos los municipios' })
  @ApiOkResponse({ description: 'Lista de municipios obtenida exitosamente.' })
  findAll() {
    return this.municipioService.findAll();
  }

  @Privileges(6, 16)
  @Get('departamento/:id')
  @ApiOperation({ summary: 'Obtener municipios por departamento' })
  @ApiOkResponse({ description: 'Municipios del departamento obtenidos exitosamente.' })
  findByDepartamento(@Param('id', ParseIntPipe) id: number) {
    return this.municipioService.findByDepartamento(id);
  }
}
