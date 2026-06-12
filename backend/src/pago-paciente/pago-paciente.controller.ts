import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from 'src/guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';
import { PagoPacienteService } from './pago-paciente.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

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
  @ApiOperation({
    summary: 'Registrar pago de paciente',
    description: 'Registra un ingreso por pago de paciente asociado a una consulta.',
  })
  @ApiCreatedResponse({ description: 'Ingreso registrado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o consulta no existente' })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.pagoPacienteService.create(createPaymentDto);
  }

  @Privileges(12)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar historial de pagos de pacientes',
    description: 'Retorna el historial de ingresos registrados por pagos de pacientes.',
  })
  @ApiOkResponse({ description: 'Historial de pagos obtenido exitosamente' })
  async findAll() {
    return this.pagoPacienteService.findAll();
  }
}
