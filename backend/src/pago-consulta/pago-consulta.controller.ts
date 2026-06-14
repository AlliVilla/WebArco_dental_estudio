import {
  Controller, Get, Post, Body, Param, ParseIntPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiCreatedResponse,
  ApiOkResponse, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { PagoConsultaService } from './pago-consulta.service';
import { CreatePagoConsultaDto } from './dto/create-pago-consulta.dto';

@ApiTags('Pagos de Consulta')
@Controller('pago-consulta')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado' })
export class PagoConsultaController {
  constructor(private readonly service: PagoConsultaService) {}

  @Privileges(10)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar pago en una consulta con distribución a tratamientos' })
  @ApiCreatedResponse({ description: 'Pago registrado exitosamente' })
  async create(@Body() dto: CreatePagoConsultaDto) {
    const data = await this.service.create(dto);
    return { data, message: 'Pago registrado exitosamente' };
  }

  @Privileges(12)
  @Get('consulta/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener pagos de una consulta' })
  @ApiOkResponse({ description: 'Lista de pagos de la consulta' })
  async findByConsulta(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByConsulta(id);
  }

  @Privileges(12)
  @Get('estado-financiero/paciente/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estado financiero de un paciente (todos los tratamientos con saldos)' })
  @ApiOkResponse({ description: 'Estado financiero del paciente' })
  async getEstadoFinanciero(@Param('id', ParseIntPipe) id: number) {
    return this.service.getEstadoFinanciero(id);
  }
}
