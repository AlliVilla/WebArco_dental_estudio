import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { AntecedentePreguntaService } from './antecedente-pregunta.service';
import { SaveRespuestasDto } from './dto/save-respuestas.dto';

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
  saveRespuestas(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveRespuestasDto,
  ) {
    return this.service.saveRespuestas(id, dto.respuestas);
  }
}
