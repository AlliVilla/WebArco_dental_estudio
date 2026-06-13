import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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
  @ApiBadRequestResponse({ description: 'Parámetros de paginación inválidos' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página (por defecto 1)', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Resultados por página (por defecto 20)', example: '20' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.pagoPacienteService.findAll(pageNum, limitNum);
  }

  @Privileges(10)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un pago', description: 'Elimina un registro de pago por su ID.' })
  @ApiParam({ name: 'id', description: 'ID del pago', example: 1 })
  @ApiOkResponse({ description: 'Pago eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.pagoPacienteService.remove(id);
  }
}
