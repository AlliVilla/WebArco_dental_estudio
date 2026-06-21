import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConsultaPreguntaService } from './consulta-pregunta.service';
import { CreatePreguntaDto } from './dto/create-pregunta.dto';
import { UpdatePreguntaDto } from './dto/update-pregunta.dto';
import { RespuestaItemDto } from './dto/save-respuestas.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Consultas Preguntas')
@Controller()
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class ConsultaPreguntaController {
  constructor(private readonly service: ConsultaPreguntaService) {}

  @Privileges(42)
  @Get('consulta-pregunta')
  @ApiOperation({
    summary: 'Listar preguntas de consulta',
    description: `Obtiene todas las preguntas del formulario de la consulta médica/odontológica, ordenadas por número de orden.

Cada pregunta contiene:
- id_pregunta (number): ID único de la pregunta
- pregunta (string): Texto de la pregunta
- orden_num (number): Número de orden en el formulario
- requiere_explicacion (boolean): Indica si se requiere explicación cuando la respuesta es afirmativa
- categoria (string): Categoría a la que pertenece la pregunta`,
  })
  @ApiOkResponse({ description: 'Listado de preguntas de consulta' })
  findAll() {
    return this.service.findAll();
  }

  @Privileges(43)
  @Post('consulta-pregunta')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva pregunta de consulta',
    description: `Agrega una nueva pregunta al formulario de consulta.

La pregunta se insertará con el orden_num especificado y aparecerá en el listado al hacer GET /consulta-pregunta.`,
  })
  @ApiCreatedResponse({ description: 'Pregunta creada exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Body() dto: CreatePreguntaDto) {
    return this.service.create(dto);
  }

  @Privileges(43)
  @Patch('consulta-pregunta/:id')
  @ApiOperation({ summary: 'Actualizar una pregunta', description: 'Actualiza una pregunta siempre y cuando no se haya utilizado en ninguna consulta.' })
  @ApiParam({ name: 'id', description: 'ID de la pregunta' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePreguntaDto) {
    return this.service.update(id, dto);
  }

  @Privileges(43)
  @Delete('consulta-pregunta/:id')
  @ApiOperation({ summary: 'Eliminar una pregunta', description: 'Elimina una pregunta de forma definitiva, siempre y cuando no se haya utilizado en ninguna consulta.' })
  @ApiParam({ name: 'id', description: 'ID de la pregunta' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  @Privileges(42)
  @Get('consulta-pregunta/paciente/:patientId/ultimas-respuestas')
  @ApiOperation({
    summary: 'Obtener últimas respuestas de antecedentes médicos del paciente',
    description: 'Retorna las respuestas de la consulta más reciente del paciente, para prellenar el formulario de una nueva consulta.',
  })
  findUltimasRespuestas(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.service.findUltimasRespuestasByPaciente(patientId);
  }

  @Privileges(42)
  @Get('consulta/:id/respuestas')
  @ApiOperation({
    summary: 'Obtener respuestas de consulta',
    description: `Devuelve las respuestas a las preguntas registradas para una consulta específica.

Incluye los datos de cada pregunta asociada (texto, orden, si requiere explicación, categoría).`,
  })
  @ApiParam({ name: 'id', description: 'ID de la consulta', example: 1 })
  @ApiOkResponse({ description: 'Respuestas de la consulta' })
  @ApiNotFoundResponse({ description: 'Consulta no encontrada' })
  findRespuestas(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRespuestasByConsulta(id);
  }

  @Privileges(43)
  @Post('consulta/:id/respuestas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Guardar respuestas de consulta',
    description: `Guarda o REEMPLAZA todas las respuestas de las preguntas para una consulta.

FLUJO DE USO:
1. Obtener las preguntas disponibles con GET /consulta-pregunta
2. Enviar las respuestas del paciente en un array

REGLAS:
- id_pregunta debe existir en la tabla de preguntas
- No se permiten id_pregunta duplicados en la misma petición
- Si la pregunta tiene requiere_explicacion=true y la respuesta es afirmativa, el campo explanation es OBLIGATORIO
- Este endpoint BORRA todas las respuestas previas de la consulta y guarda las nuevas en una transacción`,
  })
  @ApiParam({ name: 'id', description: 'ID de la consulta', example: 1 })
  @ApiBody({
    description: 'Array de respuestas del paciente',
    required: true,
    schema: {
      type: 'array',
      example: [
        { id_pregunta: 1, respuestaBoolean: true, explanation: 'Diabetes tipo 2' },
        { id_pregunta: 2, respuestaBoolean: false },
      ],
    },
  })
  @ApiOkResponse({ description: 'Respuestas guardadas exitosamente' })
  @ApiBadRequestResponse({
    description: 'Datos inválidos, pregunta duplicada, pregunta inexistente o explicación faltante',
  })
  @ApiNotFoundResponse({ description: 'Consulta no encontrada' })
  saveRespuestas(
    @Param('id', ParseIntPipe) id: number,
    @Body(
      new ParseArrayPipe({
        items: RespuestaItemDto,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    respuestas: RespuestaItemDto[],
  ) {
    return this.service.saveRespuestas(id, respuestas);
  }
}
