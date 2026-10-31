import { privateUploadOptions, imageType } from '../upload/private-storage';
import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  Query,
  Param,
  Patch,
  Body,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConsentimientoService } from './consentimiento.service';
import { QueryConsentimientoDto } from './dto/query-consentimiento.dto';
import { CreateConsentimientoDto } from './dto/create-consentimiento.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateSignaturesDto } from './dto/update-signatures.dto';
import { UploadedFiles } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrivilegesGuard } from '../guards/privileges.guard';
import { Privileges } from '../auth/decorators/privileges.decorator';

@ApiTags('Consentimientos')
@Controller('consents')
@UseGuards(JwtAuthGuard, PrivilegesGuard)
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  description: 'No autorizado: token JWT inválido o expirado',
})
export class ConsentimientoController {
  constructor(private readonly consentimientoService: ConsentimientoService) {}

  private signatureDataUrl(file: Express.Multer.File) {
    const type = imageType(file.buffer);
    return `data:${type.mime};base64,${file.buffer.toString('base64')}`;
  }

  @Privileges(22)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un consentimiento',
    description:
      'Crea una nueva consulta configurada como consentimiento y permite asociar las firmas iniciales.',
  })
  @ApiCreatedResponse({ description: 'Consentimiento registrado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos proporcionados' })
  create(@Body() createConsentimientoDto: CreateConsentimientoDto) {
    return this.consentimientoService.create(createConsentimientoDto);
  }

  @Privileges(25)
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas globales',
    description:
      'Devuelve totales de consentimientos completos, pendientes e incompletos, y si hay alerta global.',
  })
  @ApiOkResponse({ description: 'Estadísticas obtenidas exitosamente' })
  getStats() {
    return this.consentimientoService.getStats();
  }

  @Privileges(25)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar consentimientos',
    description:
      'Obtiene una lista paginada y filtrada de consentimientos con su estado de firma.',
  })
  @ApiOkResponse({
    description: 'Listado de consentimientos devuelto exitosamente',
  })
  findAll(@Query() query: QueryConsentimientoDto) {
    return this.consentimientoService.findAll(query);
  }

  @Privileges(25)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener detalle de consentimiento',
    description:
      'Obtiene el detalle completo de un consentimiento específico por ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del consentimiento (consulta)',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Detalle de consentimiento devuelto exitosamente',
  })
  @ApiNotFoundResponse({ description: 'Consentimiento no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consentimientoService.findOne(id);
  }

  @Privileges(25)
  @Get(':id/print')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener datos para impresión',
    description:
      'Retorna los datos formateados listos para impresión o generación de PDF.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del consentimiento (consulta)',
    example: 1,
  })
  @ApiOkResponse({ description: 'Datos para impresión devueltos exitosamente' })
  @ApiNotFoundResponse({ description: 'Consentimiento no encontrado' })
  imprimir(@Param('id', ParseIntPipe) id: number) {
    return this.consentimientoService.imprimir(id);
  }

  @Privileges(22)
  @Patch(':id/signatures')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'firma_paciente', maxCount: 1 },
        { name: 'firma_doctor', maxCount: 1 },
      ],
      privateUploadOptions,
    ),
  )
  @ApiOperation({
    summary: 'Actualizar firmas faltantes',
    description:
      'Registra la firma del paciente o del doctor de manera independiente. No permite sobreescribir una firma ya existente.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del consentimiento (consulta)',
    example: 1,
  })
  @ApiOkResponse({
    description:
      'Firmas actualizadas y detalle del consentimiento devuelto exitosamente',
  })
  @ApiNotFoundResponse({ description: 'Consentimiento no encontrado' })
  @ApiBadRequestResponse({
    description: 'Cuerpo vacío: debe enviar al menos una firma',
  })
  @ApiConflictResponse({
    description: 'La firma ya existe y no puede sobreescribirse',
  })
  updateSignatures(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles()
    files: {
      firma_paciente?: Express.Multer.File[];
      firma_doctor?: Express.Multer.File[];
    },
    @Body() body: UpdateSignaturesDto,
  ) {
    const dto: UpdateSignaturesDto = {
      firma_paciente: files?.firma_paciente?.[0]
        ? this.signatureDataUrl(files.firma_paciente[0])
        : body.firma_paciente || undefined,
      firma_doctor: files?.firma_doctor?.[0]
        ? this.signatureDataUrl(files.firma_doctor[0])
        : body.firma_doctor || undefined,
    };

    return this.consentimientoService.updateSignatures(id, dto);
  }
}
