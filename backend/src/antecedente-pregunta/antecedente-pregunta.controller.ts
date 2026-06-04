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
} from '@nestjs/common';
import { AntecedentePreguntaService } from './antecedente-pregunta.service';
import { RespuestaItemDto } from './dto/save-respuestas.dto';

@Controller()
export class AntecedentePreguntaController {
  constructor(private readonly service: AntecedentePreguntaService) {}

  @Get('antecedente-pregunta')
  findAll() {
    return this.service.findAll();
  }

  @Get('consulta/:id/antecedentes')
  findRespuestas(@Param('id', ParseIntPipe) id: number) {
    return this.service.findRespuestasByConsulta(id);
  }

  @Post('consulta/:id/antecedentes')
  @HttpCode(HttpStatus.OK)
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
