import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { PagoPacienteService } from './pago-paciente.service';
import { CreatePagoPacienteDto } from './dto/create-pago-paciente.dto';

@ApiTags('Pagos Paciente')
@Controller('pago-paciente')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class PagoPacienteController {
  constructor(private readonly pagoPacienteService: PagoPacienteService) {}

  @Privileges(10)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un pago para una consulta' })
  async create(@Body() dto: CreatePagoPacienteDto) {
    const pago = await this.pagoPacienteService.create(dto);
    return { data: pago, message: 'Pago registrado exitosamente' };
  }

  @Privileges(12)
  @Get('consulta/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener pagos de una consulta' })
  async findByConsulta(@Param('id', ParseIntPipe) id: number) {
    return this.pagoPacienteService.findByConsulta(id);
  }
}
