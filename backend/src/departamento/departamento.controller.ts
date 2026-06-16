import { Controller, Get, UseGuards } from '@nestjs/common';
import { DepartamentoService } from './departamento.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiUnauthorizedResponse, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Departamentos')
@Controller('departamento')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class DepartamentoController {
  constructor(private readonly departamentoService: DepartamentoService) {}

  @Privileges(6, 16)
  @Get()
  @ApiOperation({ summary: 'Obtener todos los departamentos' })
  @ApiOkResponse({ description: 'Lista de departamentos obtenida exitosamente.' })
  findAll() {
    return this.departamentoService.findAll();
  }
}
