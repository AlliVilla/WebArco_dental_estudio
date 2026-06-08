import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
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
import { AntecedentePreguntaService } from './antecedente-pregunta.service';
import { CreatePreguntaDto } from './dto/create-pregunta.dto';
import { RespuestaItemDto } from './dto/save-respuestas.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Antecedentes')
@Controller()
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'No autorizado: token JWT inválido o expirado' })
export class AntecedentePreguntaController {
  constructor(private readonly service: AntecedentePreguntaService) {}

  @Privileges(37)
  @Get('antecedente-pregunta')
  @ApiOperation({
    summary: 'Listar preguntas de antecedentes',
    description: `Obtiene todas las preguntas del formulario de antecedentes médicos, ordenadas por número de orden.

Cada pregunta contiene:
- id_pregunta (number): ID único de la pregunta
- pregunta (string): Texto de la pregunta
- orden_num (number): Número de orden en el formulario
- requiere_explicacion (boolean): Indica si se requiere explicación cuando la respuesta es afirmativa`,
  })
  @ApiOkResponse({ description: 'Listado de preguntas de antecedentes' })
  findAll() {
    return this.service.findAll();
  }

  @Privileges(38)
  @Post('antecedente-pregunta')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva pregunta de antecedente',
    description: `Agrega una nueva pregunta al formulario de antecedentes médicos.

La pregunta se insertará con el orden_num especificado y aparecerá en el listado al hacer GET /antecedente-pregunta.`,
  })
  @ApiCreatedResponse({ description: 'Pregunta creada exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Body() dto: CreatePreguntaDto) {
    return this.service.create(dto);
  }

  @Privileges(37)
  @Get('consulta/:id/antecedentes')
  @ApiOperation({
    summary: 'Obtener respuestas de antecedentes por consulta',
    description: `Devuelve las respuestas a las preguntas de antecedentes registradas para una consulta específica.

Incluye los datos de cada pregunta asociada (texto, orden, si requiere explicación).`,
  })
  @ApiParam({ name: 'id', description: 'ID de la consulta', example: 1 })
  @ApiOkResponse({ description: 'Respuestas de antecedentes de la consulta' })
  @ApiNotFoundResponse({ description: 'Consulta no encontrada' })
  findRespuestas(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRespuestasByConsulta(id);
  }

  @Privileges(39)
  @Post('consulta/:id/antecedentes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Guardar respuestas de antecedentes',
    description: `Guarda o REEMPLAZA todas las respuestas de antecedentes para una consulta.

FLUJO DE USO:
1. Obtener las preguntas disponibles con GET /antecedente-pregunta
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
