import { Controller, Get, Query, Param, Patch, Body, ParseIntPipe } from '@nestjs/common';
import { ConsentimientoService } from './consentimiento.service';
import { QueryConsentimientoDto } from './dto/query-consentimiento.dto';
import { CreateConsentimientoDto } from './dto/create-consentimiento.dto';

@Controller('consents')
export class ConsentimientoController {
  constructor(private readonly consentimientoService: ConsentimientoService) {}

  @Get('stats')
  getStats() {
    return this.consentimientoService.getStats();
  }

  @Get()
  findAll(@Query() query: QueryConsentimientoDto) {
    return this.consentimientoService.findAll(query);
  }

  @Get(':id/print')
  imprimir(@Param('id', ParseIntPipe) id: number) {
    return this.consentimientoService.imprimirConsentimiento(id);
  }

  @Patch(':id')
  registrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() createConsentimientoDto: CreateConsentimientoDto,
  ) {
    return this.consentimientoService.registrarConsentimiento(id, createConsentimientoDto);
  }
}
