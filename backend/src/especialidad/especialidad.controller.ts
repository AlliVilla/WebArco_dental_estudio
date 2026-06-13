import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { EspecialidadService } from './especialidad.service';

@ApiTags('Especialidades')
@Controller('especialidad')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado' })
export class EspecialidadController {
  constructor(private readonly especialidadService: EspecialidadService) {}

  @Get()
  @Privileges(65, 66)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar especialidades del catálogo' })
  @ApiOkResponse({ description: 'Lista de especialidades obtenida exitosamente' })
  findAll() {
    return this.especialidadService.findAll();
  }
}
